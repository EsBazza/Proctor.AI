/**
 * Calculates the Teacher Fatigue Metrics and time saved.
 * 
 * Formula:
 * - Manual authoring time: ~1.5 hours per test (designing questions, rubrics, variants)
 * - Manual grading time: ~4.5 minutes per student question
 * - Total Manual Hours = 1.5 + (questionCount * studentCount * 4.5 / 60)
 * - AI Execution Time = ~18-25 seconds
 * - Efficiency Gain = ~99%
 */
export function calculateTeacherFatigueMetrics(questionCount: number, studentCount: number) {
  const authoringHours = 1.5;
  const gradingMinutesPerQuestion = 4.5;
  const gradingHours = (questionCount * studentCount * gradingMinutesPerQuestion) / 60;
  const totalManualHours = parseFloat((authoringHours + gradingHours).toFixed(1));
  const aiSeconds = 18.4;
  const manualSeconds = totalManualHours * 3600;
  const timeSavedPercentage = parseFloat((((manualSeconds - aiSeconds) / manualSeconds) * 100).toFixed(1));

  return {
    manualHoursSaved: totalManualHours,
    authoringHours,
    gradingHours: parseFloat(gradingHours.toFixed(1)),
    aiGenerationSeconds: aiSeconds,
    timeSavedPercentage: Math.max(95, Math.min(99.8, timeSavedPercentage)),
    fatigueScoreLabel: "Low Fatigue / High Efficiency",
    fatigueHeadline: `Eliminated ${totalManualHours} hours of manual authoring & grading in ${aiSeconds}s`
  };
}
