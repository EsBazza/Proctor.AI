import React from 'react';

export default function TeacherPreviewLoading() {
  return (
    <div className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8 py-10 space-y-8 animate-pulse">
      <div className="h-4 w-40 bg-rule/50 rounded-[2px]" />
      <div className="h-10 w-96 bg-rule/40 rounded-[2px]" />
      <div className="h-96 bg-paper border border-rule rounded-[2px] p-8 flex items-center justify-center font-mono text-xs text-ink-muted">
        Loading isomorphic question editor and student variants...
      </div>
    </div>
  );
}
