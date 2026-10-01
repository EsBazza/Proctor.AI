'use client';

import React, { useState } from 'react';
import { useRouter } from 'next/navigation';
import { GraduationCap, Loader2, CheckCircle2, AlertCircle } from 'lucide-react';
import { publishExamToClassroomAction } from '@/actions/classroom';
import { Button } from '@/components/ui/Button';

interface PublishToClassroomButtonProps {
  examId: string;
  hasCourseWork: boolean;
  googleCourseName?: string | null;
}

export function PublishToClassroomButton({
  examId,
  hasCourseWork
}: PublishToClassroomButtonProps) {
  const router = useRouter();
  const [isPublishing, setIsPublishing] = useState(false);
  const [message, setMessage] = useState<{ type: 'success' | 'error'; text: string } | null>(null);

  const handlePublish = async () => {
    setIsPublishing(true);
    setMessage(null);

    try {
      const res = await publishExamToClassroomAction(examId);
      if (res.success) {
        setMessage({
          type: 'success',
          text: `Successfully published ${res.publishedCount} assignment(s) to Google Classroom.`
        });
        router.refresh();
      } else {
        setMessage({
          type: 'error',
          text: res.error || 'Failed to publish to Google Classroom.'
        });
      }
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : 'Error publishing to Google Classroom';
      setMessage({ type: 'error', text: msg });
    } finally {
      setIsPublishing(false);
    }
  };

  return (
    <div className="space-y-2">
      <Button
        type="button"
        onClick={handlePublish}
        disabled={isPublishing}
        variant="secondary"
        size="md"
        className="font-mono text-xs text-ink"
      >
        {isPublishing ? (
          <span className="inline-flex items-center gap-1.5">
            <Loader2 className="w-3.5 h-3.5 animate-spin" />
            <span>Posting to Classroom...</span>
          </span>
        ) : (
          <span className="inline-flex items-center gap-1.5">
            <GraduationCap className="w-3.5 h-3.5" />
            <span>{hasCourseWork ? 'Re-sync Classroom' : 'Post to Classroom'}</span>
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
