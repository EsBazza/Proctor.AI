import React from 'react';
import { Zap } from 'lucide-react';
import { calculateTeacherFatigueMetrics } from '@/lib/fatigue';

interface TeacherFatigueBannerProps {
  questionCount: number;
  studentCount: number;
}

export function TeacherFatigueBanner({
  questionCount,
  studentCount
}: TeacherFatigueBannerProps) {
  const metrics = calculateTeacherFatigueMetrics(questionCount, studentCount);

  return (
    <div className="rounded-2xl bg-gradient-to-br from-slate-900 via-indigo-950/40 to-slate-900 border border-indigo-500/20 p-6 shadow-xl relative overflow-hidden">
      <div className="absolute top-0 right-0 w-96 h-96 bg-indigo-600/10 rounded-full blur-3xl pointer-events-none -mr-20 -mt-20" />
      
      <div className="relative z-10 flex flex-col md:flex-row items-start md:items-center justify-between gap-6">
        <div>
          <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-indigo-500/10 border border-indigo-500/30 text-indigo-300 text-xs font-semibold mb-3">
            <Zap className="w-3.5 h-3.5 text-yellow-400" />
            <span>Teacher Fatigue Metric</span>
          </div>
          <h3 className="text-xl sm:text-2xl font-bold text-white tracking-tight">
            {metrics.fatigueHeadline}
          </h3>
          <p className="text-slate-400 text-sm mt-1 max-w-xl">
            Our AI generates unique anti-cheating isomorphic variants, auto-grades open-ended answers, and synthesizes mastery analytics instantaneously.
          </p>
        </div>

        <div className="flex items-center gap-3 sm:gap-4 flex-wrap sm:flex-nowrap">
          <div className="px-4 py-3 rounded-xl bg-slate-900/80 border border-slate-800 text-center min-w-[120px]">
            <div className="text-xs text-slate-400 uppercase tracking-wider font-semibold">Manual Time</div>
            <div className="text-xl font-bold text-rose-400 mt-0.5">~{metrics.manualHoursSaved} hrs</div>
            <div className="text-[10px] text-slate-500">Authoring + Grading</div>
          </div>

          <div className="px-4 py-3 rounded-xl bg-indigo-950/60 border border-indigo-500/30 text-center min-w-[120px]">
            <div className="text-xs text-indigo-300 uppercase tracking-wider font-semibold">AI Time</div>
            <div className="text-xl font-bold text-emerald-400 mt-0.5">{metrics.aiGenerationSeconds}s</div>
            <div className="text-[10px] text-emerald-500/80 font-medium">99% Efficiency</div>
          </div>
        </div>
      </div>
    </div>
  );
}
