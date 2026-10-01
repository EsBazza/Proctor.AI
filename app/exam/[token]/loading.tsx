import React from 'react';

export default function StudentExamLoading() {
  return (
    <div className="max-w-3xl mx-auto px-4 sm:px-6 py-16 space-y-6 text-center">
      <div className="h-6 w-48 bg-rule/50 rounded-[2px] mx-auto animate-pulse" />
      <div className="h-10 w-72 bg-rule/40 rounded-[2px] mx-auto animate-pulse" />
      <div className="p-8 bg-paper border border-rule rounded-[2px] font-mono text-xs text-ink-muted flex flex-col items-center justify-center space-y-2">
        <div className="w-6 h-6 border-2 border-ink border-t-transparent rounded-full animate-spin mb-2" />
        <span>Initializing secure isomorphic examination room...</span>
      </div>
    </div>
  );
}
