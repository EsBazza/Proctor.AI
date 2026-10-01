import React from 'react';

export default function TeacherLoading() {
  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 space-y-6 animate-pulse">
      <div className="h-6 w-52 bg-rule/50 rounded-[2px]" />
      <div className="h-10 w-80 bg-rule/40 rounded-[2px]" />
      <div className="h-64 bg-paper border border-rule rounded-[2px] p-6 flex items-center justify-center font-mono text-xs text-ink-muted">
        Loading Operations Ledger...
      </div>
    </div>
  );
}
