'use server';

import { dbService, ExamRecord, StudentExamRecord, QuestionVariantRecord } from '@/lib/db';
import { generateIsomorphicExams, extractLessonFromDocument, extractLessonsFromMultipleDocuments, DocumentInput, safeJsonParse } from '@/lib/gemini';
import { calculateTeacherFatigueMetrics } from '@/lib/fatigue';
import { auth } from '@/lib/auth';
import { 
  publishIndividualStudentAssignments, 
  deleteExamClassroomAssignments,
  StudentPublishItem 
} from '@/lib/google-classroom';
import { prisma } from '@/lib/prisma';
import { revalidatePath } from 'next/cache';

export interface StudentRosterItem {
  name: string;
  email?: string;
  googleUserId?: string;
}

export interface CreateExamInput {
  title: string;
  subject: string;
  lessonContent: string;
  language: 'English' | 'Tagalog' | 'Bisaya';
  durationMinutes: number;
  questionCount: number;
  maxStrikes?: number;
  questionTypes?: string[];
  pointsMode?: 'AI_DYNAMIC' | 'FIXED' | 'BY_TYPE';
  fixedPoints?: number;
  pointsByType?: Record<string, number>;
  roster: Array<string | StudentRosterItem>;
  googleCourseId?: string;
  googleCourseName?: string;
}


export async function createExamAction(input: CreateExamInput) {
  try {
    const session = await auth();
    const teacherEmail = session?.user?.email || null;

    const normalizedRoster: StudentRosterItem[] = input.roster.map((item) => {
      if (typeof item === 'string') {
        return { name: item.trim(), email: undefined, googleUserId: undefined };
      }
      return { 
        name: item.name.trim(), 
        email: item.email?.trim(),
        googleUserId: item.googleUserId?.trim()
      };
    }).filter((item) => item.name.length > 0);

    if (normalizedRoster.length === 0) {
      return { success: false, error: 'At least one student must be enrolled in the roster.' };
    }

    const questionTypes = (input.questionTypes && input.questionTypes.length > 0)
      ? input.questionTypes
      : ['MCQ', 'TRUE_FALSE', 'SHORT_ANSWER', 'ESSAY'];

    const examId = 'exam_' + Math.random().toString(36).substring(2, 9);
    // Generate 6-digit access code e.g. "849201"
    const accessCode = Math.floor(100000 + Math.random() * 900000).toString();

    const fatigue = calculateTeacherFatigueMetrics(input.questionCount, normalizedRoster.length);

    const examRecord: ExamRecord = {
      id: examId,
      title: input.title,
      subject: input.subject,
      lessonContent: input.lessonContent,
      language: input.language,
      questionTypes: questionTypes.join(','),
      accessCode,
      durationMinutes: input.durationMinutes,
      totalQuestions: input.questionCount,
      maxStrikes: input.maxStrikes || 2,
      timeSavedHoursEstimate: fatigue.manualHoursSaved,
      googleCourseId: input.googleCourseId || null,
      googleCourseName: input.googleCourseName || null,
      googleCourseWorkId: null,
      googleCourseWorkUrl: null,
      teacherEmail,
      status: 'ACTIVE',
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString()
    };

    await dbService.createExam(examRecord);

    const studentNames = normalizedRoster.map((r) => r.name);

    const pointsConfig = {
      mode: input.pointsMode || ('AI_DYNAMIC' as const),
      fixedPoints: input.fixedPoints,
      pointsByType: input.pointsByType
    };

    // Generate personalized isomorphic exam sets for each student via Gemini / Fallback
    const examPackages = await generateIsomorphicExams(
      input.lessonContent,
      input.subject,
      input.language,
      input.questionCount,
      studentNames,
      questionTypes,
      pointsConfig
    );

    const createdStudents: Array<{
      name: string;
      email?: string;
      accessToken: string;
      accessCode: string;
      googleUserId?: string;
      id: string;
    }> = [];

    for (const pkg of examPackages) {
      const studentExamId = 'se_' + Math.random().toString(36).substring(2, 9);
      const accessToken = 'tok_' + Math.random().toString(36).substring(2, 11);
      // Generate a unique 6-digit access code for this specific student
      const studentAccessCode = Math.floor(100000 + Math.random() * 900000).toString();

      // Find matching email & Google user ID from roster
      const matchingRosterItem = normalizedRoster.find(
        (r) => r.name.toLowerCase() === pkg.studentName.toLowerCase()
      );
      const studentEmail = matchingRosterItem?.email || null;
      const googleUserId = matchingRosterItem?.googleUserId;

      const studentMaxPossibleScore = pkg.questions.reduce((sum, q) => sum + (q.maxPoints || 10), 0);

      const studentExamRecord: StudentExamRecord = {
        id: studentExamId,
        examId,
        studentName: pkg.studentName,
        studentEmail,
        accessCode: studentAccessCode,
        accessToken,
        googleCourseWorkId: null,
        googleCourseWorkUrl: null,
        status: 'PENDING',
        totalScore: null,
        maxPossibleScore: studentMaxPossibleScore > 0 ? studentMaxPossibleScore : (input.questionCount * 10),
        startedAt: null,
        submittedAt: null
      };

      await dbService.createStudentExam(studentExamRecord);

      const questionRecords: QuestionVariantRecord[] = pkg.questions.map((q, idx) => ({
        id: 'qv_' + Math.random().toString(36).substring(2, 9),
        studentExamId,
        questionIndex: q.questionIndex || idx + 1,
        type: q.type,
        conceptTested: q.conceptTested || 'Core Concept',
        difficulty: String(q.difficulty || 'MEDIUM'),
        prompt: q.prompt,
        options: q.options ? JSON.stringify(q.options) : null,
        correctAnswer: q.correctAnswer,
        studentAnswer: null,
        isCorrect: null,
        pointsAwarded: null,
        maxPoints: q.maxPoints || 10,
        aiExplanation: null
      }));

      await dbService.createQuestionVariants(questionRecords);

      createdStudents.push({
        name: pkg.studentName,
        email: studentEmail || undefined,
        accessToken,
        accessCode: studentAccessCode,
        googleUserId,
        id: studentExamId
      });
    }

    // Auto-publish private individual CourseWork assignments to Google Classroom
    let googleCourseWorkId: string | null = null;
    let googleCourseWorkUrl: string | null = null;
    let classroomPostSuccess = false;
    let classroomPostError: string | null = null;

    if (input.googleCourseId && session?.accessToken) {
      try {
        console.log(`[Google Classroom] Publishing individual assignments for ${createdStudents.length} students...`);
        const publishItems: StudentPublishItem[] = createdStudents.map((st) => ({
          id: st.id,
          name: st.name,
          email: st.email || null,
          googleUserId: st.googleUserId || null,
          accessCode: st.accessCode,
          accessToken: st.accessToken
        }));

        const examTotalPoints = examPackages[0]?.questions.reduce((sum, q) => sum + (q.maxPoints || 10), 0) || (input.questionCount * 10);

        const pubResult = await publishIndividualStudentAssignments(session.accessToken, {
          courseId: input.googleCourseId,
          examTitle: input.title,
          examSubject: input.subject,
          durationMinutes: input.durationMinutes,
          questionCount: input.questionCount,
          maxPoints: examTotalPoints,
          students: publishItems
        });


        // Persist coursework links for each student
        for (const item of pubResult.published) {
          await dbService.updateStudentExamCourseWork(
            item.studentExamId,
            item.courseWorkId,
            item.alternateLink || ''
          );
        }

        if (pubResult.published.length > 0) {
          classroomPostSuccess = true;
          googleCourseWorkId = pubResult.published[0].courseWorkId;
          googleCourseWorkUrl = pubResult.published[0].alternateLink || `https://classroom.google.com/c/${input.googleCourseId}`;
          await prisma.exam.update({
            where: { id: examId },
            data: {
              googleCourseWorkId,
              googleCourseWorkUrl
            }
          });
        }

        if (pubResult.errors.length > 0) {
          classroomPostError = `${pubResult.errors.length} student assignment(s) could not be posted.`;
        }
      } catch (err: unknown) {
        classroomPostError = err instanceof Error ? err.message : 'Failed to publish individual assignments';
        console.error('[Google Classroom] Publish error:', err);
      }
    }

    return {
      success: true,
      examId,
      accessCode,
      students: createdStudents,
      fatigue,
      classroomPostSuccess,
      classroomPostUrl: googleCourseWorkUrl,
      classroomPostError
    };
  } catch (error: unknown) {
    const message = error instanceof Error ? error.message : 'Failed to create exam';
    console.error('Error creating exam:', error);
    return {
      success: false,
      error: message
    };
  }
}

export async function getExamDetailsAction(examId: string) {
  try {
    const exam = await dbService.getExamById(examId);
    if (!exam) {
      return { success: false, error: 'Exam not found' };
    }

    const students = await dbService.getStudentExamsByExamId(examId);
    const integrityLogs = await dbService.getIntegrityLogsByExamId(examId);
    const analytics = await dbService.getExamAnalytics(examId);

    // Group integrity logs by student
    const studentIntegrityCounts: Record<string, number> = {};
    integrityLogs.forEach((log) => {
      studentIntegrityCounts[log.studentExamId] = (studentIntegrityCounts[log.studentExamId] || 0) + 1;
    });

    const studentsWithDetails = students.map((s) => ({
      ...s,
      integrityAlertsCount: studentIntegrityCounts[s.id] || 0
    }));

    return {
      success: true,
      exam,
      students: studentsWithDetails,
      integrityLogs,
      analytics: analytics
        ? {
            ...analytics,
            topMissedConcepts: safeJsonParse(analytics.topMissedConcepts || '[]', [])
          }
        : null
    };
  } catch (error: unknown) {
    const message = error instanceof Error ? error.message : 'Error retrieving exam details';
    return { success: false, error: message };
  }
}

export async function getAllExamsAction() {
  try {
    const session = await auth();
    const teacherEmail = session?.user?.email;

    // If teacher is logged in, show their exams, otherwise show all
    const exams = teacherEmail
      ? await dbService.getExamsByTeacherEmail(teacherEmail)
      : await dbService.getAllExams();

    return { success: true, exams };
  } catch (error: unknown) {
    const message = error instanceof Error ? error.message : 'Error retrieving exams';
    return { success: false, error: message };
  }
}

export async function extractDocumentContentAction(formData: FormData) {
  try {
    const file = formData.get('file') as File | null;
    if (!file) {
      return { success: false, error: 'No file was uploaded.' };
    }

    const validMimes = ['application/pdf', 'text/plain', 'image/png', 'image/jpeg', 'image/webp'];
    const mimeType = file.type || 'application/pdf';

    if (!validMimes.includes(mimeType) && !file.name.toLowerCase().endsWith('.pdf')) {
      return {
        success: false,
        error: 'Please upload a PDF document (.pdf), plain text (.txt), or image notes (.png, .jpg).'
      };
    }

    const arrayBuffer = await file.arrayBuffer();
    const buffer = Buffer.from(arrayBuffer);

    if (buffer.length > 20 * 1024 * 1024) {
      return { success: false, error: 'File size exceeds 20MB limit.' };
    }

    const base64Data = buffer.toString('base64');
    const result = await extractLessonFromDocument(base64Data, mimeType, file.name);

    // Auto-save to Past Materials library for future reuse
    try {
      const session = await auth();
      const teacherEmail = session?.user?.email || null;
      await dbService.createPastMaterial({
        teacherEmail,
        fileName: file.name,
        fileSize: buffer.length,
        mimeType,
        title: result.title,
        subject: result.subject,
        extractedContent: result.extractedContent
      });
    } catch (saveErr) {
      console.warn('Could not auto-save single document past material:', saveErr);
    }

    return {
      success: true,
      extractedContent: result.extractedContent,
      title: result.title,
      subject: result.subject,
      fileName: file.name
    };
  } catch (error: unknown) {
    const message = error instanceof Error ? error.message : 'Failed to extract content from document';
    console.error('Document extraction error:', error);
    return { success: false, error: message };
  }
}

export async function extractMultipleDocumentsAction(formData: FormData) {
  try {
    const files = formData.getAll('files') as File[];
    if (!files || files.length === 0) {
      return { success: false, error: 'No files were uploaded.' };
    }

    const validMimes = ['application/pdf', 'text/plain', 'image/png', 'image/jpeg', 'image/webp'];
    const documents: DocumentInput[] = [];

    for (const file of files) {
      const mimeType = file.type || 'application/pdf';

      if (!validMimes.includes(mimeType) && !file.name.toLowerCase().endsWith('.pdf')) {
        return {
          success: false,
          error: `File "${file.name}" is not a supported format. Please upload PDF, TXT, or images.`
        };
      }

      const arrayBuffer = await file.arrayBuffer();
      const buffer = Buffer.from(arrayBuffer);

      if (buffer.length > 20 * 1024 * 1024) {
        return { success: false, error: `File "${file.name}" exceeds 20MB limit.` };
      }

      documents.push({
        base64Data: buffer.toString('base64'),
        mimeType,
        fileName: file.name
      });
    }

    const result = await extractLessonsFromMultipleDocuments(documents);

    // Auto-save to Past Materials library for future reuse
    try {
      const session = await auth();
      const teacherEmail = session?.user?.email || null;
      const combinedName = documents.length === 1
        ? documents[0].fileName
        : `${documents[0].fileName} (+${documents.length - 1} docs)`;

      await dbService.createPastMaterial({
        teacherEmail,
        fileName: combinedName,
        fileSize: documents.reduce((sum, d) => sum + (d.base64Data ? Buffer.byteLength(d.base64Data, 'base64') : 0), 0),
        mimeType: documents.length === 1 ? documents[0].mimeType : 'application/pdf',
        title: result.title,
        subject: result.subject,
        extractedContent: result.extractedContent
      });
    } catch (saveErr) {
      console.warn('Could not auto-save multiple documents past material:', saveErr);
    }

    return {
      success: true,
      extractedContent: result.extractedContent,
      title: result.title,
      subject: result.subject,
      fileCount: documents.length,
      fileNames: documents.map((d) => d.fileName),
      totalTokens: result.totalTokens
    };
  } catch (error: unknown) {
    const message = error instanceof Error ? error.message : 'Failed to extract content from documents';
    console.error('Multi-document extraction error:', error);
    return { success: false, error: message };
  }
}

export async function deleteExamAction(examId: string): Promise<{
  success: boolean;
  classroomDeletedCount?: number;
  error?: string;
}> {
  try {
    const session = await auth();
    const accessToken = session?.accessToken;

    const exam = await dbService.getExamById(examId);
    if (!exam) {
      return { success: false, error: 'Exam not found.' };
    }

    let classroomDeletedCount = 0;

    // Check if exam is linked to a Google Classroom course
    if (exam.googleCourseId) {
      const students = await dbService.getStudentExamsByExamId(examId);
      const courseWorkIds: string[] = [];

      if (exam.googleCourseWorkId) {
        courseWorkIds.push(exam.googleCourseWorkId);
      }
      for (const st of students) {
        if (st.googleCourseWorkId) {
          courseWorkIds.push(st.googleCourseWorkId);
        }
      }

      if (courseWorkIds.length > 0 && accessToken) {
        try {
          const res = await deleteExamClassroomAssignments(
            accessToken,
            exam.googleCourseId,
            courseWorkIds
          );
          classroomDeletedCount = res.deletedCount;
          console.log(`[Google Classroom] Deleted ${classroomDeletedCount} coursework assignment(s) for exam ${examId}`);
        } catch (classroomErr) {
          console.warn('[Google Classroom] Non-fatal error deleting coursework assignments:', classroomErr);
        }
      }
    }

    // Delete the exam in DB (all student exams, questions, logs cascade delete)
    await dbService.deleteExam(examId);

    return {
      success: true,
      classroomDeletedCount
    };
  } catch (error: unknown) {
    const message = error instanceof Error ? error.message : 'Failed to delete exam';
    console.error('deleteExamAction error:', error);
    return { success: false, error: message };
  }
}


export async function getTeacherExamPreviewAction(examId: string, studentExamId?: string) {
  try {
    const session = await auth();
    if (!session || session.user?.role !== 'TEACHER') {
      return { success: false, error: 'Unauthorized. Teacher access required.' };
    }

    const exam = await dbService.getExamById(examId);
    if (!exam) {
      return { success: false, error: 'Exam not found.' };
    }

    const students = await dbService.getStudentExamsByExamId(examId);
    if (students.length === 0) {
      return { success: false, error: 'No student exam variants found for this exam.' };
    }

    // Default to the first student if studentExamId is not provided or not found
    const selectedStudent = studentExamId
      ? students.find((s) => s.id === studentExamId) || students[0]
      : students[0];

    const questions = await dbService.getQuestionsByStudentExamId(selectedStudent.id);

    return {
      success: true,
      exam: {
        ...exam,
        maxStrikes: exam.maxStrikes || 2
      },
      students: students.map((s) => ({
        id: s.id,
        studentName: s.studentName,
        studentEmail: s.studentEmail,
        accessCode: s.accessCode || exam.accessCode,
        accessToken: s.accessToken,
        googleCourseWorkUrl: s.googleCourseWorkUrl,
        status: s.status,
        totalScore: s.totalScore
      })),
      selectedStudent: {
        id: selectedStudent.id,
        studentName: selectedStudent.studentName,
        studentEmail: selectedStudent.studentEmail,
        accessCode: selectedStudent.accessCode || exam.accessCode,
        accessToken: selectedStudent.accessToken,
        googleCourseWorkUrl: selectedStudent.googleCourseWorkUrl,
        status: selectedStudent.status,
        totalScore: selectedStudent.totalScore
      },
      questions: questions.map((q) => {
        const parsedOptions = q.options ? safeJsonParse(q.options, q.options) : null;
        return {
          id: q.id,
          studentExamId: q.studentExamId,
          questionIndex: q.questionIndex,
          type: q.type,
          conceptTested: q.conceptTested || 'Core Concept',
          difficulty: q.difficulty || 'MEDIUM',
          prompt: q.prompt,
          options: parsedOptions,
          correctAnswer: q.correctAnswer,
          maxPoints: q.maxPoints,
          aiExplanation: q.aiExplanation
        };
      })
    };
  } catch (err: unknown) {
    const message = err instanceof Error ? err.message : 'Error loading exam preview';
    return { success: false, error: message };
  }
}

export interface ManualQuestionPayload {
  type: string;
  prompt: string;
  options?: any;
  correctAnswer: string;
  maxPoints: number;
  conceptTested?: string;
  difficulty?: string;
  aiExplanation?: string;
}

export async function updateExamSettingsAction(
  examId: string,
  updates: {
    maxStrikes?: number;
    durationMinutes?: number;
    title?: string;
    subject?: string;
    status?: string;
  }
) {
  try {
    const session = await auth();
    if (!session || session.user?.role !== 'TEACHER') {
      return { success: false, error: 'Unauthorized. Teacher access required.' };
    }

    const exam = await dbService.getExamById(examId);
    if (!exam) return { success: false, error: 'Exam not found.' };

    const updated = await dbService.updateExam(examId, updates);
    revalidatePath(`/teacher/exam/${examId}`);
    revalidatePath(`/teacher/exam/${examId}/preview`);
    return { success: true, exam: updated };
  } catch (err: unknown) {
    const message = err instanceof Error ? err.message : 'Error updating exam settings';
    return { success: false, error: message };
  }
}

export async function addManualQuestionAction(input: {
  examId: string;
  studentExamId?: string;
  applyToAllStudents: boolean;
  question: ManualQuestionPayload;
}) {
  try {
    const session = await auth();
    if (!session || session.user?.role !== 'TEACHER') {
      return { success: false, error: 'Unauthorized. Teacher access required.' };
    }

    const exam = await dbService.getExamById(input.examId);
    if (!exam) return { success: false, error: 'Exam not found.' };

    const students = await dbService.getStudentExamsByExamId(input.examId);
    if (students.length === 0) return { success: false, error: 'No enrolled students found in exam.' };

    const serializedOptions = input.question.options
      ? typeof input.question.options === 'string'
        ? input.question.options
        : JSON.stringify(input.question.options)
      : null;

    if (input.applyToAllStudents) {
      for (const st of students) {
        const existingQs = await dbService.getQuestionsByStudentExamId(st.id);
        const nextIndex = existingQs.length + 1;
        const qId = 'q_' + Math.random().toString(36).substring(2, 9);
        await dbService.createQuestionVariant({
          id: qId,
          studentExamId: st.id,
          questionIndex: nextIndex,
          type: input.question.type,
          conceptTested: input.question.conceptTested || 'Manual Addition',
          difficulty: input.question.difficulty || 'MEDIUM',
          prompt: input.question.prompt,
          options: serializedOptions,
          correctAnswer: input.question.correctAnswer,
          studentAnswer: null,
          isCorrect: null,
          pointsAwarded: null,
          maxPoints: input.question.maxPoints || 10,
          aiExplanation: input.question.aiExplanation || null
        });
        await dbService.recalculateStudentExamScoreAndIndex(st.id);
      }
      await dbService.recalculateExamTotalQuestions(input.examId);
    } else {
      const targetStudentId = input.studentExamId || students[0].id;
      const existingQs = await dbService.getQuestionsByStudentExamId(targetStudentId);
      const nextIndex = existingQs.length + 1;
      const qId = 'q_' + Math.random().toString(36).substring(2, 9);
      await dbService.createQuestionVariant({
        id: qId,
        studentExamId: targetStudentId,
        questionIndex: nextIndex,
        type: input.question.type,
        conceptTested: input.question.conceptTested || 'Manual Addition',
        difficulty: input.question.difficulty || 'MEDIUM',
        prompt: input.question.prompt,
        options: serializedOptions,
        correctAnswer: input.question.correctAnswer,
        studentAnswer: null,
        isCorrect: null,
        pointsAwarded: null,
        maxPoints: input.question.maxPoints || 10,
        aiExplanation: input.question.aiExplanation || null
      });
      await dbService.recalculateStudentExamScoreAndIndex(targetStudentId);
    }

    revalidatePath(`/teacher/exam/${input.examId}`);
    revalidatePath(`/teacher/exam/${input.examId}/preview`);
    return { success: true };
  } catch (err: unknown) {
    const message = err instanceof Error ? err.message : 'Error adding manual question';
    return { success: false, error: message };
  }
}

export async function updateQuestionAction(input: {
  questionId: string;
  examId: string;
  studentExamId: string;
  questionIndex: number;
  applyToAllStudents: boolean;
  question: ManualQuestionPayload;
}) {
  try {
    const session = await auth();
    if (!session || session.user?.role !== 'TEACHER') {
      return { success: false, error: 'Unauthorized. Teacher access required.' };
    }

    const serializedOptions = input.question.options
      ? typeof input.question.options === 'string'
        ? input.question.options
        : JSON.stringify(input.question.options)
      : null;

    if (input.applyToAllStudents) {
      const students = await dbService.getStudentExamsByExamId(input.examId);
      for (const st of students) {
        const studentQs = await dbService.getQuestionsByStudentExamId(st.id);
        const match = studentQs.find((q) => q.questionIndex === input.questionIndex);
        if (match) {
          await dbService.updateQuestionVariant(match.id, {
            type: input.question.type,
            prompt: input.question.prompt,
            options: serializedOptions,
            correctAnswer: input.question.correctAnswer,
            maxPoints: input.question.maxPoints,
            conceptTested: input.question.conceptTested,
            difficulty: input.question.difficulty,
            aiExplanation: input.question.aiExplanation
          });
          await dbService.recalculateStudentExamScoreAndIndex(st.id);
        }
      }
    } else {
      await dbService.updateQuestionVariant(input.questionId, {
        type: input.question.type,
        prompt: input.question.prompt,
        options: serializedOptions,
        correctAnswer: input.question.correctAnswer,
        maxPoints: input.question.maxPoints,
        conceptTested: input.question.conceptTested,
        difficulty: input.question.difficulty,
        aiExplanation: input.question.aiExplanation
      });
      await dbService.recalculateStudentExamScoreAndIndex(input.studentExamId);
    }

    revalidatePath(`/teacher/exam/${input.examId}`);
    revalidatePath(`/teacher/exam/${input.examId}/preview`);
    return { success: true };
  } catch (err: unknown) {
    const message = err instanceof Error ? err.message : 'Error updating question';
    return { success: false, error: message };
  }
}

export async function deleteQuestionAction(input: {
  questionId: string;
  examId: string;
  studentExamId: string;
  questionIndex: number;
  applyToAllStudents: boolean;
}) {
  try {
    const session = await auth();
    if (!session || session.user?.role !== 'TEACHER') {
      return { success: false, error: 'Unauthorized. Teacher access required.' };
    }

    if (input.applyToAllStudents) {
      const students = await dbService.getStudentExamsByExamId(input.examId);
      for (const st of students) {
        const studentQs = await dbService.getQuestionsByStudentExamId(st.id);
        const match = studentQs.find((q) => q.questionIndex === input.questionIndex);
        if (match) {
          await dbService.deleteQuestionVariant(match.id);
          await dbService.recalculateStudentExamScoreAndIndex(st.id);
        }
      }
      await dbService.recalculateExamTotalQuestions(input.examId);
    } else {
      await dbService.deleteQuestionVariant(input.questionId);
      await dbService.recalculateStudentExamScoreAndIndex(input.studentExamId);
    }

    revalidatePath(`/teacher/exam/${input.examId}`);
    revalidatePath(`/teacher/exam/${input.examId}/preview`);
    return { success: true };
  } catch (err: unknown) {
    const message = err instanceof Error ? err.message : 'Error deleting question';
    return { success: false, error: message };
  }
}

export async function getLiveExamScreensAction(examId: string) {
  try {
    const screens = await dbService.getExamLiveScreens(examId);
    return { success: true, screens };
  } catch (err: unknown) {
    const message = err instanceof Error ? err.message : 'Error fetching live screens';
    return { success: false, error: message };
  }
}

export async function setStudentWatchModeAction(studentExamId: string, isBeingWatched: boolean) {
  try {
    const ok = await dbService.setStudentWatchMode(studentExamId, isBeingWatched);
    return { success: ok };
  } catch (err: unknown) {
    const message = err instanceof Error ? err.message : 'Error setting watch mode';
    return { success: false, error: message };
  }
}

export async function getSingleStudentLiveScreenAction(studentExamId: string) {
  try {
    const student = await dbService.getSingleStudentLiveScreen(studentExamId);
    if (!student) return { success: false, error: 'Student not found' };
    return { success: true, student };
  } catch (err: unknown) {
    const message = err instanceof Error ? err.message : 'Error fetching student screen';
    return { success: false, error: message };
  }
}



