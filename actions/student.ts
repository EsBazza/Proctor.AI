'use server';

import { dbService } from '@/lib/db';
import { 
  gradeStudentAnswer, 
  generateCohortAnalytics, 
  analyzeViolationSequenceWithGeminiVision,
  MatchingColumns
} from '@/lib/gemini';
import { auth } from '@/lib/auth';

export interface SanitizedQuestion {
  id: string;
  questionIndex: number;
  type: string;
  conceptTested?: string | null;
  difficulty?: string | null;
  prompt: string;
  options: string[] | MatchingColumns | null;
  maxPoints: number;
  studentAnswer: string | null;
  isCorrect: boolean | null;
  pointsAwarded: number | null;
  aiExplanation: string | null;
}

/**
 * Validates a 6-digit access code and matches with logged in student Google session
 */
export async function validateExamCodeAction(accessCode: string) {
  try {
    const cleanCode = accessCode.trim();
    if (!cleanCode) {
      return { success: false, error: 'Please enter a 6-digit exam code.' };
    }

    // 1. Check if cleanCode matches an individual student's unique access code
    const individualStudentExam = await dbService.getStudentExamByAccessCode(cleanCode);

    // 2. Or check if it matches the master exam access code
    const exam = individualStudentExam ? null : await dbService.getExamByAccessCode(cleanCode);

    if (!individualStudentExam && !exam) {
      return {
        success: false,
        error: 'Exam access code not found. Please verify your 6-digit code with your instructor.'
      };
    }

    const session = await auth();

    // If user is already signed in with Google
    if (session?.user?.email) {
      const studentExam = individualStudentExam
        ? individualStudentExam
        : await dbService.getStudentExamByEmailAndAccessCode(session.user.email, cleanCode);

      if (!studentExam) {
        const title = individualStudentExam?.examTitle || exam?.title || 'Exam';
        return {
          success: false,
          error: `Your Google account (${session.user.email}) is not enrolled in the roster for "${title}". Please switch to your student Google account.`
        };
      }

      // If individual student code was entered, verify email matches that student
      if (
        studentExam.studentEmail &&
        studentExam.studentEmail.toLowerCase() !== session.user.email.toLowerCase()
      ) {
        return {
          success: false,
          error: `Access Denied: This personalized code is assigned to ${studentExam.studentEmail}. You are signed in as ${session.user.email}.`
        };
      }

      return {
        success: true,
        redirectUrl: `/exam/${studentExam.accessToken}`
      };
    }

    // User is not signed in yet
    return {
      success: true,
      requiresAuth: true,
      accessCode: cleanCode
    };
  } catch (error: unknown) {
    const message = error instanceof Error ? error.message : 'Error validating exam code';
    return { success: false, error: message };
  }
}

export async function getStudentExamAction(token: string) {
  try {
    const session = await auth();
    if (!session?.user?.email) {
      return {
        success: false,
        error: 'Authentication required. Please sign in with your student Google account.'
      };
    }

    const studentExam = await dbService.getStudentExamByToken(token);
    if (!studentExam) {
      return { success: false, error: 'Exam token not found or invalid.' };
    }

    // Verify email match if studentEmail is assigned
    if (
      studentExam.studentEmail &&
      studentExam.studentEmail.toLowerCase() !== session.user.email.toLowerCase()
    ) {
      return {
        success: false,
        error: `Access Denied: This exam is assigned to ${studentExam.studentEmail}. You are currently signed in as ${session.user.email}.`
      };
    }

    const questions = await dbService.getQuestionsByStudentExamId(studentExam.id);

    // If student opened for the first time and is PENDING, mark IN_PROGRESS
    if (studentExam.status === 'PENDING') {
      await dbService.updateStudentExamStatus(studentExam.id, 'IN_PROGRESS');
      studentExam.status = 'IN_PROGRESS';
    }

    const sanitizedQuestions: SanitizedQuestion[] = questions.map((q) => ({
      id: q.id,
      questionIndex: q.questionIndex,
      type: q.type,
      conceptTested: q.conceptTested,
      difficulty: q.difficulty,
      prompt: q.prompt,
      options: q.options ? (JSON.parse(q.options) as string[]) : null,
      maxPoints: q.maxPoints,
      studentAnswer: q.studentAnswer,
      isCorrect: q.isCorrect,
      pointsAwarded: q.pointsAwarded,
      aiExplanation: q.aiExplanation
    }));

    return {
      success: true,
      studentExam,
      questions: sanitizedQuestions
    };
  } catch (error: unknown) {
    const message = error instanceof Error ? error.message : 'Error retrieving exam';
    return { success: false, error: message };
  }
}

export async function submitStudentExamAction(
  token: string,
  answers: Array<{ questionId: string; studentAnswer: string }>
) {
  try {
    const studentExam = await dbService.getStudentExamByToken(token);
    if (!studentExam) {
      return { success: false, error: 'Exam token not found' };
    }

    const questions = await dbService.getQuestionsByStudentExamId(studentExam.id);
    let totalScore = 0;
    let maxPossibleScore = 0;

    for (const q of questions) {
      maxPossibleScore += q.maxPoints;
      const submitted = answers.find((a) => a.questionId === q.id);
      const studentAnswer = submitted ? submitted.studentAnswer : '';

      const evalResult = await gradeStudentAnswer(
        q.prompt,
        q.type,
        studentAnswer,
        q.correctAnswer,
        q.maxPoints
      );

      totalScore += evalResult.pointsAwarded;

      await dbService.updateQuestionAnswer(
        q.id,
        studentAnswer,
        evalResult.isCorrect,
        evalResult.pointsAwarded,
        evalResult.aiExplanation
      );
    }

    const finalPoints = Math.round(totalScore * 10) / 10;

    // Check if flagged for multiple integrity violations
    const logs = await dbService.getIntegrityLogsByStudentExamId(studentExam.id);
    const finalStatus = logs.length >= 3 ? 'FLAGGED' : 'SUBMITTED';

    await dbService.updateStudentExamStatus(
      studentExam.id,
      finalStatus,
      finalPoints,
      new Date().toISOString(),
      undefined,
      maxPossibleScore
    );

    // Trigger Cohort Analytics Refresh
    await refreshExamAnalytics(studentExam.examId, studentExam.examTitle);

    return {
      success: true,
      score: finalPoints,
      totalPoints: finalPoints,
      maxPossibleScore,
      status: finalStatus
    };
  } catch (error: unknown) {
    const message = error instanceof Error ? error.message : 'Submission error';
    return { success: false, error: message };
  }
}

export async function logIntegrityEventAction(
  token: string,
  eventType: 'TAB_SWITCH' | 'WINDOW_BLUR' | 'PASTE_ATTEMPT' | 'FULLSCREEN_EXIT',
  details?: string
) {
  return logIntegrityEventWithSequenceAction(token, eventType, details);
}

export async function logIntegrityEventWithSnapshotAction(
  token: string,
  eventType: 'TAB_SWITCH' | 'WINDOW_BLUR' | 'PASTE_ATTEMPT' | 'FULLSCREEN_EXIT',
  details?: string,
  screenshotBase64?: string
) {
  return logIntegrityEventWithSequenceAction(
    token,
    eventType,
    details,
    screenshotBase64 ? [screenshotBase64] : undefined
  );
}

export async function logIntegrityEventWithSequenceAction(
  token: string,
  eventType: 'TAB_SWITCH' | 'WINDOW_BLUR' | 'PASTE_ATTEMPT' | 'FULLSCREEN_EXIT',
  details?: string,
  framesBase64?: string[],
  keystrokes?: string[]
) {
  try {
    const studentExam = await dbService.getStudentExamByToken(token);
    if (!studentExam) {
      return { success: false, error: 'Invalid token' };
    }

    const maxStrikes = studentExam.maxStrikes || 2;

    // 1. Immediately increment strike count and enforce lockout at configured maxStrikes threshold
    const updatedStudent = await dbService.incrementStudentStrikeAndCheckLock(studentExam.id, maxStrikes);
    const strikeCount = updatedStudent?.strikeCount || (studentExam.strikeCount || 0) + 1;
    const isLocked = updatedStudent?.status === 'LOCKED' || strikeCount >= maxStrikes;

    // Pick central frame for screenshot thumbnail
    const centralSnapshot = framesBase64 && framesBase64.length > 0
      ? framesBase64[Math.floor(framesBase64.length / 2)] || framesBase64[0]
      : null;

    // 2. Persist Integrity Log entry with sequence & keystrokes
    const logId = 'log_' + Math.random().toString(36).substring(2, 9);
    await dbService.logIntegrityEvent({
      id: logId,
      studentExamId: studentExam.id,
      eventType,
      timestamp: new Date().toISOString(),
      details: details || `Recorded ${eventType} in browser`,
      screenshotBase64: centralSnapshot,
      framesBase64: framesBase64 && framesBase64.length > 0 ? JSON.stringify(framesBase64) : null,
      keystrokesLog: keystrokes && keystrokes.length > 0 ? JSON.stringify(keystrokes) : null,
      threatRank: isLocked ? 'CRITICAL' : 'SUSPICIOUS',
      threatScore: isLocked ? 90 : 50,
      aiAnalysis: isLocked
        ? `Examinee accumulated ${strikeCount}/${maxStrikes} violation strike(s). Exam locked by automated security integrity shield.`
        : `Violation strike #${strikeCount}/${maxStrikes} logged: ${eventType}. 10-second before/after sequence captured.`
    });

    // 3. Asynchronously trigger Gemini Vision Forensics on sequence in background
    if (framesBase64 && framesBase64.length > 0) {
      analyzeViolationSequenceWithGeminiVision(
        framesBase64,
        eventType,
        keystrokes,
        studentExam.studentName
      )
        .then(async (forensics) => {
          await dbService.updateIntegrityLogForensics(logId, {
            threatRank: forensics.threatRank,
            threatScore: forensics.threatScore,
            aiAnalysis: `${forensics.reason} (Detected: ${forensics.detectedApps.join(', ') || 'None'})`
          });
        })
        .catch((err) => console.error('[Vision Forensics Error]', err));
    }

    return { 
      success: true, 
      strikeCount, 
      maxStrikes,
      isLocked 
    };
  } catch (error: unknown) {
    const message = error instanceof Error ? error.message : 'Error logging integrity event';
    return { success: false, error: message };
  }
}


export async function getStudentExamStatusAction(token: string) {
  try {
    const studentExam = await dbService.getStudentExamByToken(token);
    if (!studentExam) return { success: false, error: 'Exam not found' };
    return {
      success: true,
      status: studentExam.status,
      strikeCount: studentExam.strikeCount,
      maxStrikes: studentExam.maxStrikes || 2,
      isLocked: studentExam.status === 'LOCKED'
    };
  } catch (err: unknown) {
    const message = err instanceof Error ? err.message : 'Error checking status';
    return { success: false, error: message };
  }
}

export async function unlockStudentExamAction(studentExamId: string) {
  try {
    const session = await auth();
    if (!session || session.user?.role !== 'TEACHER') {
      return { success: false, error: 'Unauthorized. Teacher access required.' };
    }

    const updated = await dbService.unlockStudentExam(studentExamId);
    return { success: true, student: updated };
  } catch (err: unknown) {
    const message = err instanceof Error ? err.message : 'Failed to unlock student';
    return { success: false, error: message };
  }
}

async function refreshExamAnalytics(examId: string, examTitle: string) {
  try {
    const students = await dbService.getStudentExamsByExamId(examId);
    const submitted = students.filter((s) => s.status === 'SUBMITTED' || s.status === 'FLAGGED');

    if (submitted.length === 0) return;

    const submissionData = await Promise.all(
      submitted.map(async (s) => {
        const qs = await dbService.getQuestionsByStudentExamId(s.id);
        const missed = qs
          .filter((q) => !q.isCorrect)
          .map((q) => ({
            concept: q.conceptTested || 'Core Concept',
            studentAnswer: q.studentAnswer || '',
            correctAnswer: q.correctAnswer
          }));

        return {
          studentName: s.studentName,
          totalScore: s.totalScore || 0,
          maxScore: s.maxPossibleScore || 100,
          missedQuestions: missed
        };
      })
    );

    const analytics = await generateCohortAnalytics(examTitle, submissionData);

    await dbService.saveExamAnalytics({
      id: 'analytics_' + examId,
      examId,
      classAverage: analytics.classAverage,
      topMissedConcepts: JSON.stringify(analytics.topMissedConcepts),
      aiSynthesisSummary: analytics.aiSynthesisSummary,
      aiRecommendations: analytics.aiRecommendations,
      updatedAt: new Date().toISOString()
    });
  } catch (err) {
    console.warn('Could not refresh exam analytics:', err);
  }
}
