'use client';

import React, { useState } from 'react';
import { useRouter } from 'next/navigation';
import { Award, Loader2, CheckCircle2, AlertCircle } from 'lucide-react';
import { releaseExamGradesAction } from '@/actions/classroom';
import { Button } from '@/components/ui/Button';

interface ReleaseGradesButtonProps {
  examId: string;
  hasGoogleClassroom: boolean;
  gradedCount: number;
}

export function ReleaseGradesButton({
  examId,
  hasGoogleClassroom,
  gradedCount
}: ReleaseGradesButtonProps) {
  const router = useRouter();
  const [isReleasing, setIsReleasing] = useState(false);
  const [message, setMessage] = useState<{ type: 'success' | 'error'; text: string } | null>(null);

  if (!hasGoogleClassroom) return null;

  const handleRelease = async () => {
    if (gradedCount === 0) return;
    setIsReleasing(true);
    setMessage(null);

    try {
      const res = await releaseExamGradesAction(examId);
      if (res.success) {
        setMessage({
          type: 'success',
          text: `Successfully released grades for ${res.releasedCount} student(s) into Google Classroom.`
        });
        router.refresh();
      } else {
        setMessage({
          type: 'error',
          text: res.error || 'Failed to release grades to Google Classroom.'
        });
      }
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : 'Error releasing grades to Google Classroom';
      setMessage({ type: 'error', text: msg });
    } finally {
      setIsReleasing(false);
    }
  };

  return (
    <div className="space-y-2">
      <Button
        type="button"
        onClick={handleRelease}
        disabled={isReleasing || gradedCount === 0}
        variant="secondary"
        size="md"
        className="font-mono text-xs text-ink"
        title={gradedCount === 0 ? 'No completed exams to release yet' : 'Release grades into Google Classroom gradebook'}
      >
        {isReleasing ? (
          <span className="inline-flex items-center gap-1.5">
            <Loader2 className="w-3.5 h-3.5 animate-spin" />
            <span>Releasing Grades...</span>
          </span>
        ) : (
          <span className="inline-flex items-center gap-1.5">
            <Award className="w-3.5 h-3.5 text-verified" />
            <span>Release Grades ({gradedCount})</span>
          </span>
        )}
      </Button>

      {message && (
        <div
          role="status"
          className={`p-2.5 rounded-[2px] text-xs font-mono flex items-start gap-2 border ${
            message.type === 'success'
              ? 'bg-ground border-rule text-verified'
              : 'bg-signal/5 border-signal/40 text-signal'
          }`}
        >
          {message.type === 'success' ? (
            <CheckCircle2 className="w-3.5 h-3.5 shrink-0 mt-0.5" />
          ) : (
            <AlertCircle className="w-3.5 h-3.5 shrink-0 mt-0.5" />
          )}
          <span className="leading-relaxed">{message.text}</span>
        </div>
      )}
    </div>
  );
}
