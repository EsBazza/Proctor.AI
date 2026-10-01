'use server';

import { auth } from '@/lib/auth';
import { 
  fetchTeacherCourses, 
  fetchCourseRoster, 
  ClassroomCourse, 
  ClassroomStudent,
  publishIndividualStudentAssignments,
  releaseStudentGradesToClassroom,
  StudentPublishItem
} from '@/lib/google-classroom';
import { dbService } from '@/lib/db';
import { prisma } from '@/lib/prisma';

export async function getTeacherCoursesAction(): Promise<{
  success: boolean;
  courses?: ClassroomCourse[];
  error?: string;
}> {
  try {
    const session = await auth();
    const accessToken = session?.accessToken;

    if (!accessToken) {
      return {
        success: false,
        error: 'Google authentication required. Please sign in with your teacher Google account.'
      };
    }

    const courses = await fetchTeacherCourses(accessToken);
    return { success: true, courses };
  } catch (error: unknown) {
    const message = error instanceof Error ? error.message : 'Error fetching Google Classroom courses';
    return { success: false, error: message };
  }
}

export async function getCourseRosterAction(courseId: string): Promise<{
  success: boolean;
  students?: ClassroomStudent[];
  error?: string;
}> {
  try {
    const session = await auth();
    const accessToken = session?.accessToken;

    if (!accessToken) {
      return {
        success: false,
        error: 'Google authentication required. Please sign in with your teacher Google account.'
      };
    }

    if (!courseId) {
      return { success: false, error: 'Course ID is required.' };
    }

    const students = await fetchCourseRoster(accessToken, courseId);
    return { success: true, students };
  } catch (error: unknown) {
    const message = error instanceof Error ? error.message : 'Error fetching course roster';
    return { success: false, error: message };
  }
}

/**
 * Publishes individual private CourseWork assignments to Google Classroom for an exam.
 * Each student receives their own assignment with their unique code and link.
 */
export async function publishExamToClassroomAction(examId: string): Promise<{
  success: boolean;
  publishedCount?: number;
  courseWorkUrl?: string;
  error?: string;
}> {
  try {
    const session = await auth();
    const accessToken = session?.accessToken;

    if (!accessToken) {
      return {
        success: false,
        error: 'Google authentication required. Please sign in with your teacher Google account.'
      };
    }

    const exam = await dbService.getExamById(examId);
    if (!exam) {
      return { success: false, error: 'Exam not found.' };
    }

    if (!exam.googleCourseId) {
      return { success: false, error: 'This exam is not linked to any Google Classroom course.' };
    }

    const students = await dbService.getStudentExamsByExamId(examId);
    if (students.length === 0) {
      return { success: false, error: 'No student exam variants found to publish.' };
    }

    // Ensure all students have a unique accessCode generated
    for (const st of students) {
      if (!st.accessCode) {
        const newCode = Math.floor(100000 + Math.random() * 900000).toString();
        st.accessCode = newCode;
        await prisma.studentExam.update({
          where: { id: st.id },
          data: { accessCode: newCode }
        });
      }
    }

    const publishItems: StudentPublishItem[] = students.map((st) => ({
      id: st.id,
      name: st.studentName,
      email: st.studentEmail,
      accessCode: st.accessCode || exam.accessCode,
      accessToken: st.accessToken,
      maxPoints: st.maxPossibleScore
    }));

    const result = await publishIndividualStudentAssignments(accessToken, {
      courseId: exam.googleCourseId,
      examTitle: exam.title,
      examSubject: exam.subject,
      durationMinutes: exam.durationMinutes,
      questionCount: exam.totalQuestions,
      maxPoints: students[0]?.maxPossibleScore || (exam.totalQuestions * 10),
      students: publishItems
    });


    for (const item of result.published) {
      await dbService.updateStudentExamCourseWork(
        item.studentExamId,
        item.courseWorkId,
        item.alternateLink || ''
      );
    }

    if (result.published.length > 0) {
      const primaryUrl = result.published[0].alternateLink || `https://classroom.google.com/c/${exam.googleCourseId}`;
      await prisma.exam.update({
        where: { id: examId },
        data: {
          googleCourseWorkId: result.published[0].courseWorkId,
          googleCourseWorkUrl: primaryUrl
        }
      });

      return {
        success: true,
        publishedCount: result.published.length,
        courseWorkUrl: primaryUrl
      };
    }

    const errorDetails = result.errors.map((e) => `${e.studentName}: ${e.error}`).join('; ');
    return {
      success: false,
      error: `Could not publish assignments. Details: ${errorDetails || 'Permission denied or no matching Google users.'}`
    };
  } catch (err: unknown) {
    const message = err instanceof Error ? err.message : 'Failed to publish exam to Google Classroom';
    return { success: false, error: message };
  }
}

/**
 * Releases and syncs graded examinee scores into Google Classroom.
 */
export async function releaseExamGradesAction(examId: string): Promise<{
  success: boolean;
  releasedCount?: number;
  totalGraded?: number;
  errors?: string[];
  error?: string;
}> {
  try {
    const session = await auth();
    const accessToken = session?.accessToken;

    if (!accessToken) {
      return {
        success: false,
        error: 'Google authentication required. Please sign in with your teacher Google account.'
      };
    }

    const exam = await dbService.getExamById(examId);
    if (!exam) {
      return { success: false, error: 'Exam not found.' };
    }

    if (!exam.googleCourseId) {
      return { success: false, error: 'This exam is not linked to any Google Classroom course.' };
    }

    const students = await dbService.getStudentExamsByExamId(examId);
    const evaluatedStudents = students.filter(
      (st) => st.totalScore !== null && st.totalScore !== undefined
    );

    if (evaluatedStudents.length === 0) {
      return {
        success: false,
        error: 'No evaluated student submissions found to release. Grades can only be released after students submit their exams.'
      };
    }

    const gradesToRelease = await Promise.all(
      evaluatedStudents.map(async (st) => {
        // Fetch questions to guarantee points-based evaluation (points awarded vs total points)
        const questions = await dbService.getQuestionsByStudentExamId(st.id);
        const actualPoints = questions.length > 0
          ? questions.reduce((sum, q) => sum + (q.pointsAwarded || 0), 0)
          : (st.totalScore ?? 0);
        const actualMax = questions.length > 0
          ? questions.reduce((sum, q) => sum + (q.maxPoints || 0), 0)
          : st.maxPossibleScore;

        // Self-heal studentExam record if it was previously saved as a percentage
        if (questions.length > 0 && (st.totalScore !== actualPoints || st.maxPossibleScore !== actualMax)) {
          await prisma.studentExam.update({
            where: { id: st.id },
            data: {
              totalScore: actualPoints,
              maxPossibleScore: actualMax
            }
          });
        }

        return {
          studentName: st.studentName,
          courseWorkId: st.googleCourseWorkId || exam.googleCourseWorkId,
          totalScore: actualPoints,
          maxScore: actualMax
        };
      })
    );

    const result = await releaseStudentGradesToClassroom(accessToken, {
      courseId: exam.googleCourseId,
      grades: gradesToRelease
    });

    if (result.releasedCount > 0) {
      return {
        success: true,
        releasedCount: result.releasedCount,
        totalGraded: evaluatedStudents.length,
        errors: result.errors.map((e) => `${e.studentName}: ${e.error}`)
      };
    }

    const errorDetails = result.errors.map((e) => `${e.studentName}: ${e.error}`).join('; ');
    return {
      success: false,
      error: errorDetails || 'Could not release grades to Google Classroom. Ensure coursework assignments are published first.'
    };
  } catch (err: unknown) {
    const message = err instanceof Error ? err.message : 'Failed to release grades to Google Classroom';
    return { success: false, error: message };
  }
}

