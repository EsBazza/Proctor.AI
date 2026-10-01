import React from 'react';

export default function TeacherExamLoading() {
  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 space-y-6 animate-pulse">
      <div className="space-y-4 border-b border-rule pb-5">
        <div className="h-4 w-48 bg-rule/50 rounded-[2px]" />
        <div className="flex flex-col lg:flex-row lg:items-baseline justify-between gap-4">
          <div className="space-y-2">
            <div className="h-4 w-64 bg-rule/40 rounded-[2px]" />
            <div className="h-8 w-96 bg-rule/60 rounded-[2px]" />
          </div>
          <div className="h-10 w-48 bg-rule/40 rounded-[2px]" />
        </div>
      </div>
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
        <div className="lg:col-span-8 h-96 bg-paper border border-rule rounded-[2px] p-6 flex flex-col items-center justify-center font-mono text-xs text-ink-muted space-y-2">
          <div className="w-6 h-6 border-2 border-ink border-t-transparent rounded-full animate-spin mb-2" />
          <span>Connecting to candidate monitor telemetry...</span>
        </div>
        <div className="lg:col-span-4 h-96 bg-paper border border-rule rounded-[2px] p-6 flex items-center justify-center font-mono text-xs text-ink-muted">
          <span>Loading forensic event stream...</span>
        </div>
      </div>
    </div>
  );
}
