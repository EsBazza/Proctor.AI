'use client';

import React, { useState } from 'react';
import { useRouter } from 'next/navigation';
import { Trash2, Loader2, X, GraduationCap } from 'lucide-react';
import { deleteExamAction } from '@/actions/exam';
import { Button } from '@/components/ui/Button';

interface DeleteExamButtonProps {
  examId: string;
  examTitle: string;
  hasGoogleClassroom?: boolean;
  variant?: 'compact' | 'full';
  redirectOnDelete?: boolean;
}

export function DeleteExamButton({
  examId,
  examTitle,
  hasGoogleClassroom = false,
  variant = 'compact',
  redirectOnDelete = false
}: DeleteExamButtonProps) {
  const router = useRouter();
  const [isOpen, setIsOpen] = useState(false);
  const [isDeleting, setIsDeleting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleDelete = async () => {
    setIsDeleting(true);
    setError(null);

    try {
      const res = await deleteExamAction(examId);
      if (res.success) {
        setIsOpen(false);
        if (redirectOnDelete) {
          router.push('/teacher');
        } else {
          router.refresh();
        }
      } else {
        setError(res.error || 'Failed to delete examination.');
        setIsDeleting(false);
      }
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : 'Error deleting examination.';
      setError(msg);
      setIsDeleting(false);
    }
  };

  return (
    <>
      {variant === 'compact' ? (
        <button
          type="button"
          onClick={(e) => {
            e.stopPropagation();
            e.preventDefault();
            setIsOpen(true);
          }}
          title="Delete Assessment"
          className="p-1.5 rounded-[2px] text-ink-muted hover:text-signal hover:bg-ground border border-transparent hover:border-rule transition-colors"
        >
          <Trash2 className="w-3.5 h-3.5" />
        </button>
      ) : (
        <Button
          type="button"
          onClick={() => setIsOpen(true)}
          variant="secondary"
          size="sm"
          className="text-signal hover:text-signal"
        >
          <Trash2 className="w-3.5 h-3.5 mr-1.5" />
          <span>Delete Assessment</span>
        </Button>
      )}

      {/* Confirmation Modal */}
      {isOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-ink/60">
          <div 
            className="w-full max-w-md rounded-[2px] bg-paper border border-rule p-6 space-y-4"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="flex items-start justify-between border-b border-rule pb-3">
              <div className="space-y-0.5">
                <div className="font-mono text-xs uppercase tracking-wider text-signal font-semibold">
                  Confirm Deletion
                </div>
                <h3 className="text-base font-semibold text-ink">Delete Assessment</h3>
              </div>
              <button
                type="button"
                onClick={() => !isDeleting && setIsOpen(false)}
                className="p-1 text-ink-muted hover:text-ink rounded-[2px] hover:bg-ground"
                disabled={isDeleting}
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <div className="space-y-3 text-xs">
              <p className="text-ink">
                Are you sure you want to delete <strong className="font-semibold">&quot;{examTitle}&quot;</strong>?
              </p>

              <div className="p-3 rounded-[2px] bg-ground border border-rule space-y-1.5 text-ink-muted font-mono">
                <div>• Permanently removes all student variants, scores, and integrity logs.</div>
                {hasGoogleClassroom && (
                  <div className="flex items-start gap-1.5 text-ink pt-1 border-t border-rule">
                    <GraduationCap className="w-3.5 h-3.5 shrink-0 mt-0.5" />
                    <span>Associated assignments will be removed from your Google Classroom course stream.</span>
                  </div>
                )}
              </div>

              {error && (
                <div role="alert" className="p-2.5 rounded-[2px] bg-signal/5 border border-signal/40 text-signal font-mono">
                  {error}
                </div>
              )}
            </div>

            <div className="flex items-center justify-end gap-2 pt-2 border-t border-rule">
              <Button
                type="button"
                onClick={() => setIsOpen(false)}
                disabled={isDeleting}
                variant="secondary"
                size="sm"
              >
                Cancel
              </Button>
              <Button
                type="button"
                onClick={handleDelete}
                disabled={isDeleting}
                variant="signal"
                size="sm"
              >
                {isDeleting ? (
                  <span className="inline-flex items-center gap-1.5">
                    <Loader2 className="w-3.5 h-3.5 animate-spin" />
                    <span>Deleting...</span>
                  </span>
                ) : (
                  <span>Confirm Delete</span>
                )}
              </Button>
            </div>
          </div>
        </div>
      )}
    </>
  );
}
