'use client';

import React from 'react';
import { Target, AlertCircle } from 'lucide-react';

interface CohortAnalyticsProps {
  analytics: {
    classAverage: number;
    topMissedConcepts: string[];
    aiSynthesisSummary: string;
    aiRecommendations: string;
    updatedAt: string;
  } | null;
  totalStudents: number;
  submittedCount: number;
}

export function CohortAnalytics({
  analytics,
  totalStudents,
  submittedCount
}: CohortAnalyticsProps) {
  if (!analytics || submittedCount === 0) {
    return (
      <div className="rounded-[2px] bg-paper border border-rule p-8 text-center space-y-2">
        <div className="font-mono text-xs uppercase tracking-wider text-ink-muted">
          Cohort Mastery Data Pending
        </div>
        <p className="text-xs text-ink-muted max-w-md mx-auto leading-relaxed">
          As students complete their assessments, the model evaluates cross-variant error distributions and concept friction points.
        </p>
      </div>
    );
  }

  return (
    <div className="space-y-4">
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        {/* Class Average Score Metric */}
        <div className="rounded-[2px] bg-paper border border-rule p-5 space-y-2">
          <div className="flex items-center justify-between font-mono text-xs text-ink-muted uppercase tracking-wider">
            <span>Class Mean</span>
            <Target className="w-3.5 h-3.5" />
          </div>
          <div className="text-3xl font-semibold font-mono text-ink tabular-nums">
            {analytics.classAverage}%
          </div>
          <div className="text-[11px] font-mono text-ink-muted">
            Computed from {submittedCount} of {totalStudents} completed variants
          </div>

          {/* Horizontal Distribution Strip */}
          <div className="pt-2">
            <div className="text-[10px] font-mono text-ink-muted mb-1 flex justify-between">
              <span>0%</span>
              <span>Distribution Target</span>
              <span>100%</span>
            </div>
            <div className="h-2 w-full bg-ground border border-rule rounded-[1px] relative overflow-hidden">
              <div
                className="h-full bg-ink"
                style={{ width: `${Math.min(100, Math.max(0, analytics.classAverage))}%` }}
              />
            </div>
          </div>
        </div>

        {/* Priority Remediation Concepts */}
        <div className="md:col-span-2 rounded-[2px] bg-paper border border-rule p-5 space-y-3">
          <div className="flex items-center justify-between font-mono text-xs text-ink-muted uppercase tracking-wider">
            <span>Concept Friction Rankings</span>
            <AlertCircle className="w-3.5 h-3.5 text-caution" />
          </div>
          <div className="flex flex-wrap gap-1.5 pt-1">
            {analytics.topMissedConcepts.map((concept, idx) => (
              <span
                key={idx}
                className="px-2.5 py-1 rounded-[2px] bg-ground border border-rule text-ink font-mono text-xs font-medium"
              >
                #{idx + 1} {concept}
              </span>
            ))}
          </div>
          <div className="text-[11px] font-mono text-ink-muted pt-1">
            Topics showing highest error distribution across all isomorphic variations
          </div>
        </div>
      </div>

      {/* AI Synthesis Summary */}
      <div className="rounded-[2px] bg-paper border border-rule p-5 space-y-2">
        <div className="font-mono text-xs uppercase tracking-wider text-ink font-semibold">
          Pedagogical Synthesis &amp; Error Pattern Analysis
        </div>
        <p className="text-xs text-ink-muted leading-relaxed font-sans whitespace-pre-line">
          {analytics.aiSynthesisSummary}
        </p>
      </div>

      {/* Actionable Recommendations */}
      <div className="rounded-[2px] bg-paper border border-rule p-5 space-y-2">
        <div className="font-mono text-xs uppercase tracking-wider text-ink font-semibold">
          Recommended Classroom Review Steps
        </div>
        <p className="text-xs text-ink-muted leading-relaxed font-sans whitespace-pre-line">
          {analytics.aiRecommendations}
        </p>
      </div>
    </div>
  );
}
