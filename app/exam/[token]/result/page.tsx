import React from 'react';
import Link from 'next/link';
import { notFound } from 'next/navigation';
import { getStudentExamAction } from '@/actions/student';
import { ArrowLeft } from 'lucide-react';
import { BadgeMarker } from '@/components/ui/BadgeMarker';

export const dynamic = 'force-dynamic';

export default async function StudentExamResultPage({
  params
}: {
  params: Promise<{ token: string }>;
}) {
  const { token } = await params;
  const result = await getStudentExamAction(token);

  if (!result.success || !result.studentExam) {
    notFound();
  }

  const { studentExam, questions = [] } = result;

  const totalPointsAwarded = questions.reduce((sum, q) => sum + (q.pointsAwarded || 0), 0);
  const totalMaxPoints = questions.reduce((sum, q) => sum + (q.maxPoints || 0), 0);

  return (
    <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-10 space-y-8">
      {/* Assessment Summary Ledger Card */}
      <div className="rounded-[2px] bg-paper border border-rule p-6 sm:p-8 space-y-5">
        <div className="flex flex-col sm:flex-row sm:items-start justify-between gap-4 border-b border-rule pb-5">
          <div className="space-y-1">
            <div className="font-mono text-xs uppercase tracking-widest text-ink-muted">
              Examination Results Statement
            </div>
            <h1 className="text-xl sm:text-2xl font-semibold tracking-tight text-ink">
              {studentExam.examTitle}
            </h1>
            <div className="text-xs font-mono text-ink-muted flex items-center gap-3 pt-0.5">
              <span>Candidate: <strong className="text-ink font-medium">{studentExam.studentName}</strong></span>
              <span>/</span>
              <span>Subject: {studentExam.examSubject}</span>
            </div>
          </div>

          {/* Awarded Score */}
          <div className="flex flex-col sm:items-end justify-center">
            <div className="text-[11px] font-mono uppercase tracking-wider text-ink-muted">Final Score</div>
            <div className="text-3xl sm:text-4xl font-semibold font-mono text-ink tabular-nums">
              {totalPointsAwarded} <span className="text-lg sm:text-xl text-ink-muted font-normal">/ {totalMaxPoints} pts</span>
            </div>
            {totalMaxPoints > 0 && (
              <div className="text-xs font-mono text-ink-muted">
                {Math.round((totalPointsAwarded / totalMaxPoints) * 100)}% Accuracy
              </div>
            )}
          </div>
        </div>

        {/* Status Marker Strip */}
        <div className="flex items-center justify-between text-xs font-mono text-ink-muted pt-1">
          <span>Proctor Record:</span>
          {studentExam.status === 'FLAGGED' ? (
            <BadgeMarker level="suspicious" label="Proctor Review Logged" />
          ) : (
            <BadgeMarker level="verified" label="Verified Clean Session" />
          )}
        </div>
      </div>

      {/* Item Analysis & Rubric Notes */}
      <div className="space-y-4">
        <div className="flex items-center justify-between border-b border-rule pb-2">
          <h2 className="text-sm font-semibold font-mono uppercase tracking-wider text-ink">
            Item-by-Item Analysis &amp; Rubric Feedback
          </h2>
          <span className="text-xs font-mono text-ink-muted">
            {questions.length} Total Items
          </span>
        </div>

        <div className="divide-y divide-rule border border-rule rounded-[2px] bg-paper">
          {questions.map((q, idx) => {
            const isFullScore = q.isCorrect;
            return (
              <div key={q.id} className="p-6 space-y-4">
                <div className="flex items-center justify-between gap-2 font-mono text-xs">
                  <div className="flex items-center gap-2">
                    <span className="font-semibold text-ink uppercase">
                      Item {idx + 1}
                    </span>
                    <span className="text-ink-muted">
                      [{q.type}]
                    </span>
                    {q.conceptTested && (
                      <span className="hidden sm:inline text-ink-muted">
                        — {q.conceptTested}
                      </span>
                    )}
                  </div>
                  <span className={`font-semibold tabular-nums ${isFullScore ? 'text-verified' : 'text-caution'}`}>
                    {q.pointsAwarded ?? 0} / {q.maxPoints} pts
                  </span>
                </div>

                <div className="font-serif text-base text-ink leading-relaxed">
                  {q.prompt}
                </div>

                {/* Response Breakdown */}
                <div className="p-3.5 rounded-[2px] bg-ground border border-rule space-y-1.5 text-xs font-mono">
                  <div className="text-ink-muted uppercase text-[10px] tracking-wider">Submitted Answer:</div>
                  <div className="text-ink whitespace-pre-wrap">
                    {q.studentAnswer || '— No response provided —'}
                  </div>
                </div>

                {q.aiExplanation && (
                  <div className="p-3.5 rounded-[2px] bg-ground border border-rule text-xs space-y-1">
                    <div className="font-mono text-xs uppercase tracking-wider text-ink font-semibold">
                      Rubric &amp; Feedback Notes:
                    </div>
                    <div className="text-ink-muted leading-relaxed">
                      {q.aiExplanation}
                    </div>
                  </div>
                )}
              </div>
            );
          })}
        </div>
      </div>

      {/* Return Navigation */}
      <div className="pt-2">
        <Link
          href="/"
          className="inline-flex items-center gap-2 px-4 py-2.5 rounded-[2px] bg-paper hover:bg-ground border border-rule text-ink font-mono text-xs uppercase tracking-wider transition-colors"
        >
          <ArrowLeft className="w-3.5 h-3.5" />
          <span>Return to Portal</span>
        </Link>
      </div>
    </div>
  );
}
