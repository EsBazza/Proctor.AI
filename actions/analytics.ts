'use server';

import { dbService } from '@/lib/db';
import { generateCohortAnalytics } from '@/lib/gemini';

export async function refreshCohortAnalyticsAction(examId: string) {
  try {
    const exam = await dbService.getExamById(examId);
    if (!exam) return { success: false, error: 'Exam not found' };

    const students = await dbService.getStudentExamsByExamId(examId);
    const submitted = students.filter((s) => s.status === 'SUBMITTED' || s.status === 'FLAGGED');

    if (submitted.length === 0) {
      return { success: true, message: 'No student submissions yet' };
    }

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

    const analytics = await generateCohortAnalytics(exam.title, submissionData);

    await dbService.saveExamAnalytics({
      id: 'analytics_' + examId,
      examId,
      classAverage: analytics.classAverage,
      topMissedConcepts: JSON.stringify(analytics.topMissedConcepts),
      aiSynthesisSummary: analytics.aiSynthesisSummary,
      aiRecommendations: analytics.aiRecommendations,
      updatedAt: new Date().toISOString()
    });

    return { success: true, analytics };
  } catch (error: unknown) {
    const message = error instanceof Error ? error.message : 'Error refreshing analytics';
    return { success: false, error: message };
  }
}
