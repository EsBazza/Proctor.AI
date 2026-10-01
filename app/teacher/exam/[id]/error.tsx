'use client';

import React, { useEffect } from 'react';
import Link from 'next/link';
import { ArrowLeft, RefreshCw, AlertTriangle } from 'lucide-react';
import { Button } from '@/components/ui/Button';

export default function TeacherExamError({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  useEffect(() => {
    console.error('Teacher Exam Monitor Error:', error);
  }, [error]);

  return (
    <div className="max-w-xl mx-auto px-4 py-16 text-center space-y-4 font-mono text-xs">
      <div className="inline-flex items-center justify-center w-12 h-12 rounded-[2px] bg-signal/10 border border-signal/30 text-signal mb-2">
        <AlertTriangle className="w-6 h-6" />
      </div>
      <h2 className="text-base font-semibold text-ink">
        Monitor Connection Interrupted
      </h2>
      <p className="text-ink-muted leading-relaxed font-sans text-xs">
        {error?.message || 'An error occurred while loading the real-time exam telemetry.'}
      </p>
      <div className="flex items-center justify-center gap-3 pt-2">
        <Button
          type="button"
          onClick={() => reset()}
          variant="primary"
          size="sm"
          className="font-mono text-xs"
        >
          <RefreshCw className="w-3.5 h-3.5 mr-1.5" />
          <span>Retry Connection</span>
        </Button>
        <Link href="/teacher">
          <Button
            type="button"
            variant="secondary"
            size="sm"
            className="font-mono text-xs"
          >
            <ArrowLeft className="w-3.5 h-3.5 mr-1.5" />
            <span>Return to Ledger</span>
          </Button>
        </Link>
      </div>
    </div>
  );
}
