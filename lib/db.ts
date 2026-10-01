import { prisma } from '@/lib/prisma';

export interface ExamRecord {
  id: string;
  title: string;
  subject: string;
  lessonContent: string;
  language: string;
  questionTypes?: string;
  accessCode: string;
  durationMinutes: number;
  totalQuestions: number;
  maxStrikes?: number;
  timeSavedHoursEstimate: number;
  googleCourseId?: string | null;
  googleCourseName?: string | null;
  googleCourseWorkId?: string | null;
  googleCourseWorkUrl?: string | null;
  teacherEmail?: string | null;
  status?: string;
  createdAt: string;
  updatedAt?: string;
}

export interface StudentExamRecord {
  id: string;
  examId: string;
  studentName: string;
  studentEmail?: string | null;
  accessCode?: string | null;
  accessToken: string;
  googleCourseWorkId?: string | null;
  googleCourseWorkUrl?: string | null;
  status: 'PENDING' | 'IN_PROGRESS' | 'LOCKED' | 'SUBMITTED' | 'FLAGGED';
  totalScore: number | null;
  maxPossibleScore: number;
  strikeCount?: number;
  lockedAt?: string | null;
  startedAt: string | null;
  submittedAt: string | null;
}

export interface QuestionVariantRecord {
  id: string;
  studentExamId: string;
  questionIndex: number;
  type: string; // 'MCQ' | 'TRUE_FALSE' | 'SHORT_ANSWER' | 'ESSAY' | 'FILL_IN_BLANK' | 'MATCHING' | 'IDENTIFICATION'
  conceptTested?: string | null;
  difficulty?: string | null;
  prompt: string;
  options: string | null; // JSON string
  correctAnswer: string;
  studentAnswer: string | null;
  isCorrect: boolean | null;
  pointsAwarded: number | null;
  maxPoints: number;
  aiExplanation: string | null;
}

export interface IntegrityLogRecord {
  id: string;
  studentExamId: string;
  eventType: 'TAB_SWITCH' | 'WINDOW_BLUR' | 'PASTE_ATTEMPT' | 'FULLSCREEN_EXIT';
  timestamp: string;
  details: string | null;
  screenshotBase64?: string | null;
  framesBase64?: string | null;
  keystrokesLog?: string | null;
  threatRank?: string | null; // 'CRITICAL' | 'SUSPICIOUS' | 'LOW' | 'BENIGN'
  threatScore?: number | null; // 0 to 100
  aiAnalysis?: string | null;
  studentName?: string;
}


export interface ExamAnalyticsRecord {
  id: string;
  examId: string;
  classAverage: number;
  topMissedConcepts: string; // JSON array string
  aiSynthesisSummary: string;
  aiRecommendations: string;
  updatedAt: string;
}

export interface StudentExamWithDetails extends StudentExamRecord {
  examTitle: string;
  examSubject: string;
  durationMinutes: number;
  accessCode: string;
  maxStrikes: number;
  strikeCount: number;
  lockedAt: string | null;
}

export interface PastMaterialRecord {
  id: string;
  teacherEmail?: string | null;
  fileName: string;
  fileSize?: number | null;
  mimeType?: string | null;
  title?: string | null;
  subject?: string | null;
  extractedContent: string;
  createdAt: string;
  updatedAt: string;
}


export const dbService = {
  createExam: async (exam: ExamRecord) => {
    return await prisma.exam.create({
      data: {
        id: exam.id,
        title: exam.title,
        subject: exam.subject,
        lessonContent: exam.lessonContent,
        language: exam.language || 'English',
        questionTypes: exam.questionTypes || 'MCQ,TRUE_FALSE,SHORT_ANSWER,ESSAY',
        accessCode: exam.accessCode,
        durationMinutes: exam.durationMinutes,
        totalQuestions: exam.totalQuestions,
        maxStrikes: exam.maxStrikes || 2,
        timeSavedHoursEstimate: exam.timeSavedHoursEstimate,
        googleCourseId: exam.googleCourseId ?? null,
        googleCourseName: exam.googleCourseName ?? null,
        googleCourseWorkId: exam.googleCourseWorkId ?? null,
        googleCourseWorkUrl: exam.googleCourseWorkUrl ?? null,
        teacherEmail: exam.teacherEmail ?? null,
        status: exam.status || 'ACTIVE',
        ...(exam.createdAt ? { createdAt: new Date(exam.createdAt) } : {}),
        ...(exam.updatedAt ? { updatedAt: new Date(exam.updatedAt) } : {})
      }
    });
  },

  getAllExams: async (): Promise<ExamRecord[]> => {
    const rows = await prisma.exam.findMany({
      orderBy: { createdAt: 'desc' }
    });
    return rows.map((r) => ({
      ...r,
      createdAt: r.createdAt.toISOString(),
      updatedAt: r.updatedAt.toISOString()
    }));
  },

  getExamsByTeacherEmail: async (teacherEmail: string): Promise<ExamRecord[]> => {
    const rows = await prisma.exam.findMany({
      where: { teacherEmail },
      orderBy: { createdAt: 'desc' }
    });
    return rows.map((r) => ({
      ...r,
      createdAt: r.createdAt.toISOString(),
      updatedAt: r.updatedAt.toISOString()
    }));
  },

  getExamById: async (id: string): Promise<ExamRecord | null> => {
    const r = await prisma.exam.findUnique({
      where: { id }
    });
    if (!r) return null;
    return {
      ...r,
      createdAt: r.createdAt.toISOString(),
      updatedAt: r.updatedAt.toISOString()
    };
  },

  getExamByAccessCode: async (accessCode: string): Promise<ExamRecord | null> => {
    const r = await prisma.exam.findUnique({
      where: { accessCode }
    });
    if (!r) return null;
    return {
      ...r,
      createdAt: r.createdAt.toISOString(),
      updatedAt: r.updatedAt.toISOString()
    };
  },

  createStudentExam: async (studentExam: StudentExamRecord) => {
    return await prisma.studentExam.create({
      data: {
        id: studentExam.id,
        examId: studentExam.examId,
        studentName: studentExam.studentName,
        studentEmail: studentExam.studentEmail ?? null,
        accessCode: studentExam.accessCode ?? null,
        accessToken: studentExam.accessToken,
        googleCourseWorkId: studentExam.googleCourseWorkId ?? null,
        googleCourseWorkUrl: studentExam.googleCourseWorkUrl ?? null,
        status: studentExam.status || 'PENDING',
        totalScore: studentExam.totalScore ?? null,
        maxPossibleScore: studentExam.maxPossibleScore,
        startedAt: studentExam.startedAt ? new Date(studentExam.startedAt) : null,
        submittedAt: studentExam.submittedAt ? new Date(studentExam.submittedAt) : null
      }
    });
  },

  getStudentExamsByExamId: async (examId: string): Promise<StudentExamRecord[]> => {
    const rows = await prisma.studentExam.findMany({
      where: { examId },
      orderBy: { studentName: 'asc' }
    });
    return rows.map((r) => ({
      id: r.id,
      examId: r.examId,
      studentName: r.studentName,
      studentEmail: r.studentEmail,
      accessCode: r.accessCode,
      accessToken: r.accessToken,
      googleCourseWorkId: r.googleCourseWorkId,
      googleCourseWorkUrl: r.googleCourseWorkUrl,
      status: r.status as 'PENDING' | 'IN_PROGRESS' | 'LOCKED' | 'SUBMITTED' | 'FLAGGED',
      totalScore: r.totalScore,
      maxPossibleScore: r.maxPossibleScore,
      strikeCount: r.strikeCount ?? 0,
      lockedAt: r.lockedAt ? r.lockedAt.toISOString() : null,
      startedAt: r.startedAt ? r.startedAt.toISOString() : null,
      submittedAt: r.submittedAt ? r.submittedAt.toISOString() : null
    }));
  },

  getStudentExamByToken: async (token: string): Promise<StudentExamWithDetails | null> => {
    const r = await prisma.studentExam.findUnique({
      where: { accessToken: token },
      include: { exam: true }
    });
    if (!r) return null;
    return {
      id: r.id,
      examId: r.examId,
      studentName: r.studentName,
      studentEmail: r.studentEmail,
      accessCode: r.accessCode || r.exam.accessCode,
      accessToken: r.accessToken,
      googleCourseWorkId: r.googleCourseWorkId,
      googleCourseWorkUrl: r.googleCourseWorkUrl,
      status: r.status as 'PENDING' | 'IN_PROGRESS' | 'LOCKED' | 'SUBMITTED' | 'FLAGGED',
      totalScore: r.totalScore,
      maxPossibleScore: r.maxPossibleScore,
      strikeCount: r.strikeCount ?? 0,
      lockedAt: r.lockedAt ? r.lockedAt.toISOString() : null,
      startedAt: r.startedAt ? r.startedAt.toISOString() : null,
      submittedAt: r.submittedAt ? r.submittedAt.toISOString() : null,
      examTitle: r.exam.title,
      examSubject: r.exam.subject,
      durationMinutes: r.exam.durationMinutes,
      maxStrikes: r.exam.maxStrikes ?? 2
    };
  },

  getStudentExamByAccessCode: async (accessCode: string): Promise<StudentExamWithDetails | null> => {
    const r = await prisma.studentExam.findFirst({
      where: { accessCode },
      include: { exam: true }
    });
    if (!r) return null;
    return {
      id: r.id,
      examId: r.examId,
      studentName: r.studentName,
      studentEmail: r.studentEmail,
      accessCode: r.accessCode || r.exam.accessCode,
      accessToken: r.accessToken,
      googleCourseWorkId: r.googleCourseWorkId,
      googleCourseWorkUrl: r.googleCourseWorkUrl,
      status: r.status as 'PENDING' | 'IN_PROGRESS' | 'LOCKED' | 'SUBMITTED' | 'FLAGGED',
      totalScore: r.totalScore,
      maxPossibleScore: r.maxPossibleScore,
      strikeCount: r.strikeCount ?? 0,
      lockedAt: r.lockedAt ? r.lockedAt.toISOString() : null,
      startedAt: r.startedAt ? r.startedAt.toISOString() : null,
      submittedAt: r.submittedAt ? r.submittedAt.toISOString() : null,
      examTitle: r.exam.title,
      examSubject: r.exam.subject,
      durationMinutes: r.exam.durationMinutes,
      maxStrikes: r.exam.maxStrikes ?? 2
    };
  },

  getStudentExamByEmailAndAccessCode: async (email: string, accessCode: string): Promise<StudentExamWithDetails | null> => {
    // First, check if accessCode matches studentExam.accessCode directly
    let r = await prisma.studentExam.findFirst({
      where: {
        studentEmail: {
          equals: email,
          mode: 'insensitive'
        },
        accessCode
      },
      include: { exam: true }
    });

    // If not found, check if accessCode matches the master exam.accessCode
    if (!r) {
      r = await prisma.studentExam.findFirst({
        where: {
          studentEmail: {
            equals: email,
            mode: 'insensitive'
          },
          exam: {
            accessCode
          }
        },
        include: { exam: true }
      });
    }

    if (!r) return null;
    return {
      id: r.id,
      examId: r.examId,
      studentName: r.studentName,
      studentEmail: r.studentEmail,
      accessCode: r.accessCode || r.exam.accessCode,
      accessToken: r.accessToken,
      googleCourseWorkId: r.googleCourseWorkId,
      googleCourseWorkUrl: r.googleCourseWorkUrl,
      status: r.status as 'PENDING' | 'IN_PROGRESS' | 'LOCKED' | 'SUBMITTED' | 'FLAGGED',
      totalScore: r.totalScore,
      maxPossibleScore: r.maxPossibleScore,
      strikeCount: r.strikeCount ?? 0,
      lockedAt: r.lockedAt ? r.lockedAt.toISOString() : null,
      startedAt: r.startedAt ? r.startedAt.toISOString() : null,
      submittedAt: r.submittedAt ? r.submittedAt.toISOString() : null,
      examTitle: r.exam.title,
      examSubject: r.exam.subject,
      durationMinutes: r.exam.durationMinutes,
      maxStrikes: r.exam.maxStrikes ?? 2
    };
  },

  updateStudentExamCourseWork: async (
    id: string,
    googleCourseWorkId: string,
    googleCourseWorkUrl: string
  ) => {
    return await prisma.studentExam.update({
      where: { id },
      data: {
        googleCourseWorkId,
        googleCourseWorkUrl
      }
    });
  },

  updateStudentExamStatus: async (
    id: string,
    status: string,
    totalScore?: number | null,
    submittedAt?: string,
    startedAt?: string,
    maxPossibleScore?: number | null
  ) => {
    return await prisma.studentExam.update({
      where: { id },
      data: {
        status,
        ...(totalScore !== undefined && totalScore !== null ? { totalScore } : {}),
        ...(maxPossibleScore !== undefined && maxPossibleScore !== null ? { maxPossibleScore } : {}),
        ...(submittedAt ? { submittedAt: new Date(submittedAt) } : {}),
        ...(startedAt ? { startedAt: new Date(startedAt) } : {})
      }
    });
  },

  createQuestionVariants: async (questions: QuestionVariantRecord[]) => {
    if (questions.length === 0) return { count: 0 };
    return await prisma.questionVariant.createMany({
      data: questions.map((item) => ({
        id: item.id,
        studentExamId: item.studentExamId,
        questionIndex: item.questionIndex,
        type: item.type,
        conceptTested: item.conceptTested || 'Core Concept',
        difficulty: item.difficulty || 'MEDIUM',
        prompt: item.prompt,
        options: item.options,
        correctAnswer: item.correctAnswer,
        studentAnswer: item.studentAnswer ?? null,
        isCorrect: item.isCorrect ?? null,
        pointsAwarded: item.pointsAwarded ?? null,
        maxPoints: item.maxPoints || 10,
        aiExplanation: item.aiExplanation ?? null
      }))
    });
  },

  getQuestionsByStudentExamId: async (studentExamId: string): Promise<QuestionVariantRecord[]> => {
    const rows = await prisma.questionVariant.findMany({
      where: { studentExamId },
      orderBy: { questionIndex: 'asc' }
    });
    return rows.map((r) => ({
      id: r.id,
      studentExamId: r.studentExamId,
      questionIndex: r.questionIndex,
      type: r.type,
      conceptTested: r.conceptTested,
      difficulty: r.difficulty,
      prompt: r.prompt,
      options: r.options,
      correctAnswer: r.correctAnswer,
      studentAnswer: r.studentAnswer,
      isCorrect: r.isCorrect,
      pointsAwarded: r.pointsAwarded,
      maxPoints: r.maxPoints,
      aiExplanation: r.aiExplanation
    }));
  },

  createQuestionVariant: async (question: QuestionVariantRecord) => {
    return await prisma.questionVariant.create({
      data: {
        id: question.id,
        studentExamId: question.studentExamId,
        questionIndex: question.questionIndex,
        type: question.type,
        conceptTested: question.conceptTested || 'Core Concept',
        difficulty: question.difficulty || 'MEDIUM',
        prompt: question.prompt,
        options: question.options ?? null,
        correctAnswer: question.correctAnswer,
        studentAnswer: question.studentAnswer ?? null,
        isCorrect: question.isCorrect ?? null,
        pointsAwarded: question.pointsAwarded ?? null,
        maxPoints: question.maxPoints || 10,
        aiExplanation: question.aiExplanation ?? null
      }
    });
  },

  updateQuestionVariant: async (
    id: string,
    updates: Partial<QuestionVariantRecord>
  ) => {
    return await prisma.questionVariant.update({
      where: { id },
      data: {
        ...(updates.prompt !== undefined ? { prompt: updates.prompt } : {}),
        ...(updates.type !== undefined ? { type: updates.type } : {}),
        ...(updates.options !== undefined ? { options: updates.options } : {}),
        ...(updates.correctAnswer !== undefined ? { correctAnswer: updates.correctAnswer } : {}),
        ...(updates.maxPoints !== undefined ? { maxPoints: updates.maxPoints } : {}),
        ...(updates.conceptTested ? { conceptTested: updates.conceptTested } : {}),
        ...(updates.difficulty ? { difficulty: updates.difficulty } : {}),
        ...(updates.aiExplanation !== undefined ? { aiExplanation: updates.aiExplanation } : {})
      }
    });
  },

  deleteQuestionVariant: async (id: string) => {
    return await prisma.questionVariant.delete({
      where: { id }
    });
  },

  recalculateStudentExamScoreAndIndex: async (studentExamId: string) => {
    const questions = await prisma.questionVariant.findMany({
      where: { studentExamId },
      orderBy: { questionIndex: 'asc' }
    });
    for (let i = 0; i < questions.length; i++) {
      if (questions[i].questionIndex !== i + 1) {
        await prisma.questionVariant.update({
          where: { id: questions[i].id },
          data: { questionIndex: i + 1 }
        });
      }
    }
    const totalMaxPoints = questions.reduce((sum, q) => sum + (q.maxPoints || 0), 0);
    await prisma.studentExam.update({
      where: { id: studentExamId },
      data: { maxPossibleScore: totalMaxPoints }
    });
    return { questionCount: questions.length, totalMaxPoints };
  },

  recalculateExamTotalQuestions: async (examId: string) => {
    const students = await prisma.studentExam.findMany({
      where: { examId },
      select: { id: true }
    });
    if (students.length === 0) return 0;
    const firstStudentQuestions = await prisma.questionVariant.count({
      where: { studentExamId: students[0].id }
    });
    await prisma.exam.update({
      where: { id: examId },
      data: { totalQuestions: firstStudentQuestions }
    });
    return firstStudentQuestions;
  },

  updateExam: async (id: string, updates: Partial<ExamRecord>) => {
    return await prisma.exam.update({
      where: { id },
      data: {
        ...(updates.title !== undefined ? { title: updates.title } : {}),
        ...(updates.subject !== undefined ? { subject: updates.subject } : {}),
        ...(updates.durationMinutes !== undefined ? { durationMinutes: updates.durationMinutes } : {}),
        ...(updates.maxStrikes !== undefined ? { maxStrikes: updates.maxStrikes } : {}),
        ...(updates.totalQuestions !== undefined ? { totalQuestions: updates.totalQuestions } : {}),
        ...(updates.status !== undefined ? { status: updates.status } : {})
      }
    });
  },

  updateQuestionAnswer: async (
    id: string,
    studentAnswer: string,
    isCorrect: boolean,
    pointsAwarded: number,
    aiExplanation: string
  ) => {
    return await prisma.questionVariant.update({
      where: { id },
      data: {
        studentAnswer,
        isCorrect,
        pointsAwarded,
        aiExplanation
      }
    });
  },

  logIntegrityEvent: async (log: IntegrityLogRecord) => {
    return await prisma.integrityLog.create({
      data: {
        id: log.id,
        studentExamId: log.studentExamId,
        eventType: log.eventType,
        timestamp: log.timestamp ? new Date(log.timestamp) : new Date(),
        details: log.details ?? null,
        screenshotBase64: log.screenshotBase64 ?? null,
        framesBase64: log.framesBase64 ?? null,
        keystrokesLog: log.keystrokesLog ?? null,
        threatRank: log.threatRank ?? null,
        threatScore: log.threatScore ?? null,
        aiAnalysis: log.aiAnalysis ?? null
      }
    });
  },

  incrementStudentStrikeAndCheckLock: async (studentExamId: string, maxStrikes: number = 2) => {
    const student = await prisma.studentExam.findUnique({
      where: { id: studentExamId }
    });
    if (!student) return null;

    const newStrikeCount = (student.strikeCount || 0) + 1;
    const shouldLock = newStrikeCount >= maxStrikes;

    return await prisma.studentExam.update({
      where: { id: studentExamId },
      data: {
        strikeCount: newStrikeCount,
        integrityAlertsCount: (student.integrityAlertsCount || 0) + 1,
        ...(shouldLock
          ? {
              status: 'LOCKED',
              lockedAt: new Date(),
              cheatingFlagged: true
            }
          : {})
      }
    });
  },

  unlockStudentExam: async (studentExamId: string) => {
    return await prisma.studentExam.update({
      where: { id: studentExamId },
      data: {
        status: 'IN_PROGRESS',
        strikeCount: 1, // Reset strike to 1 warning state so student gets another chance
        lockedAt: null
      }
    });
  },

  updateIntegrityLogForensics: async (
    logId: string,
    forensics: {
      threatRank?: string | null;
      threatScore?: number | null;
      aiAnalysis?: string | null;
    }
  ) => {
    return await prisma.integrityLog.update({
      where: { id: logId },
      data: {
        threatRank: forensics.threatRank,
        threatScore: forensics.threatScore,
        aiAnalysis: forensics.aiAnalysis
      }
    });
  },

  getIntegrityLogsByExamId: async (examId: string): Promise<(IntegrityLogRecord & { studentName: string })[]> => {
    const rows = await prisma.integrityLog.findMany({
      where: {
        studentExam: {
          examId
        }
      },
      include: {
        studentExam: true
      },
      orderBy: {
        timestamp: 'desc'
      }
    });
    return rows.map((r) => ({
      id: r.id,
      studentExamId: r.studentExamId,
      eventType: r.eventType as 'TAB_SWITCH' | 'WINDOW_BLUR' | 'PASTE_ATTEMPT' | 'FULLSCREEN_EXIT',
      timestamp: r.timestamp.toISOString(),
      details: r.details,
      screenshotBase64: r.screenshotBase64,
      framesBase64: r.framesBase64,
      keystrokesLog: r.keystrokesLog,
      threatRank: r.threatRank,
      threatScore: r.threatScore,
      aiAnalysis: r.aiAnalysis,
      studentName: r.studentExam.studentName
    }));
  },

  getIntegrityLogsByStudentExamId: async (studentExamId: string): Promise<IntegrityLogRecord[]> => {
    const rows = await prisma.integrityLog.findMany({
      where: { studentExamId },
      orderBy: { timestamp: 'desc' }
    });
    return rows.map((r) => ({
      id: r.id,
      studentExamId: r.studentExamId,
      eventType: r.eventType as 'TAB_SWITCH' | 'WINDOW_BLUR' | 'PASTE_ATTEMPT' | 'FULLSCREEN_EXIT',
      timestamp: r.timestamp.toISOString(),
      details: r.details,
      screenshotBase64: r.screenshotBase64,
      framesBase64: r.framesBase64,
      keystrokesLog: r.keystrokesLog,
      threatRank: r.threatRank,
      threatScore: r.threatScore,
      aiAnalysis: r.aiAnalysis
    }));
  },


  saveExamAnalytics: async (analytics: ExamAnalyticsRecord) => {
    return await prisma.examAnalytics.upsert({
      where: { examId: analytics.examId },
      update: {
        classAverage: analytics.classAverage,
        topMissedConcepts: analytics.topMissedConcepts,
        aiSynthesisSummary: analytics.aiSynthesisSummary,
        aiRecommendations: analytics.aiRecommendations,
        updatedAt: analytics.updatedAt ? new Date(analytics.updatedAt) : new Date()
      },
      create: {
        id: analytics.id,
        examId: analytics.examId,
        classAverage: analytics.classAverage,
        topMissedConcepts: analytics.topMissedConcepts,
        aiSynthesisSummary: analytics.aiSynthesisSummary,
        aiRecommendations: analytics.aiRecommendations,
        updatedAt: analytics.updatedAt ? new Date(analytics.updatedAt) : new Date()
      }
    });
  },

  getExamAnalytics: async (examId: string): Promise<ExamAnalyticsRecord | null> => {
    const r = await prisma.examAnalytics.findUnique({
      where: { examId }
    });
    if (!r) return null;
    return {
      id: r.id,
      examId: r.examId,
      classAverage: r.classAverage,
      topMissedConcepts: r.topMissedConcepts,
      aiSynthesisSummary: r.aiSynthesisSummary,
      aiRecommendations: r.aiRecommendations,
      updatedAt: r.updatedAt.toISOString()
    };
  },

  deleteExam: async (examId: string) => {
    return await prisma.exam.delete({
      where: { id: examId }
    });
  },

  createPastMaterial: async (data: {
    teacherEmail?: string | null;
    fileName: string;
    fileSize?: number | null;
    mimeType?: string | null;
    title?: string | null;
    subject?: string | null;
    extractedContent: string;
  }): Promise<PastMaterialRecord> => {
    const row = await prisma.pastMaterial.create({
      data: {
        teacherEmail: data.teacherEmail || null,
        fileName: data.fileName,
        fileSize: data.fileSize || null,
        mimeType: data.mimeType || null,
        title: data.title || null,
        subject: data.subject || null,
        extractedContent: data.extractedContent
      }
    });

    return {
      id: row.id,
      teacherEmail: row.teacherEmail,
      fileName: row.fileName,
      fileSize: row.fileSize,
      mimeType: row.mimeType,
      title: row.title,
      subject: row.subject,
      extractedContent: row.extractedContent,
      createdAt: row.createdAt.toISOString(),
      updatedAt: row.updatedAt.toISOString()
    };
  },

  getPastMaterials: async (teacherEmail?: string | null): Promise<PastMaterialRecord[]> => {
    const rows = await prisma.pastMaterial.findMany({
      where: teacherEmail
        ? {
            OR: [
              { teacherEmail },
              { teacherEmail: null }
            ]
          }
        : undefined,
      orderBy: { createdAt: 'desc' }
    });

    return rows.map((r) => ({
      id: r.id,
      teacherEmail: r.teacherEmail,
      fileName: r.fileName,
      fileSize: r.fileSize,
      mimeType: r.mimeType,
      title: r.title,
      subject: r.subject,
      extractedContent: r.extractedContent,
      createdAt: r.createdAt.toISOString(),
      updatedAt: r.updatedAt.toISOString()
    }));
  },

  deletePastMaterial: async (id: string) => {
    return await prisma.pastMaterial.delete({
      where: { id }
    });
  }
};

