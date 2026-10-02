'use client';

import React, { useState } from 'react';
import { Trash2, Loader2 } from 'lucide-react';
import { Button } from '@/components/ui/Button';
import { deleteQuestionAction } from '@/actions/exam';

interface DeleteQuestionModalProps {
  isOpen: boolean;
  onClose: () => void;
  examId: string;
  studentExamId: string;
  studentName: string;
  questionId: string;
  questionIndex: number;
  promptSnippet: string;
  onSuccess?: () => void;
}

export function DeleteQuestionModal({
  isOpen,
  onClose,
  examId,
  studentExamId,
  studentName,
  questionId,
  questionIndex,
  promptSnippet,
  onSuccess
}: DeleteQuestionModalProps) {
  const [applyToAllStudents, setApplyToAllStudents] = useState<boolean>(true);
  const [isDeleting, setIsDeleting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  if (!isOpen) return null;

  const handleDelete = async () => {
    setIsDeleting(true);
    setError(null);

    try {
      const res = await deleteQuestionAction({
        questionId,
        examId,
        studentExamId,
        questionIndex,
        applyToAllStudents
      });

      if (!res.success) {
        setError(res.error || 'Failed to delete question.');
        setIsDeleting(false);
        return;
      }

      setIsDeleting(false);
      if (onSuccess) onSuccess();
      onClose();
    } catch (err: unknown) {
      const message = err instanceof Error ? err.message : 'Error deleting question.';
      setError(message);
      setIsDeleting(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 bg-ink/60 flex items-center justify-center p-4">
      <div className="relative max-w-md w-full rounded-[2px] bg-paper border border-rule p-6 space-y-5 text-left shadow-2xl">
        <div className="flex items-start gap-3 border-b border-rule pb-3">
          <div className="w-8 h-8 rounded-[2px] bg-signal/10 text-signal flex items-center justify-center shrink-0">
            <Trash2 className="w-4 h-4 text-signal" />
          </div>
          <div>
            <div className="font-mono text-xs uppercase tracking-wider text-signal font-semibold">
              Delete Question #{questionIndex}
            </div>
            <h3 className="text-base font-bold text-ink">
              Confirm Question Removal
            </h3>
          </div>
        </div>

        {error && (
          <div className="p-3 rounded-[2px] bg-signal/10 border border-signal/40 text-signal text-xs font-mono">
            {error}
          </div>
        )}

        <div className="p-3 rounded-[2px] bg-ground border border-rule text-xs text-ink-muted">
          <span className="font-semibold text-ink block mb-1">Target Question:</span>
          <p className="line-clamp-2 italic">
            &quot;{promptSnippet}&quot;
          </p>
        </div>

        <div className="space-y-2">
          <label className="block text-xs font-semibold uppercase tracking-wider text-ink-muted font-mono">
            Deletion Scope:
          </label>
          <div className="space-y-2 text-xs">
            <label className="flex items-center gap-2.5 text-ink cursor-pointer">
              <input
                type="radio"
                name="deleteScope"
                checked={applyToAllStudents}
                onChange={() => setApplyToAllStudents(true)}
                className="w-4 h-4 text-signal focus:ring-0"
              />
              <div>
                <span className="font-semibold block">Remove from ALL Candidates in this Exam</span>
                <span className="text-[11px] text-ink-muted block">
                  Question #{questionIndex} will be removed for everyone, and questions will be renumbered.
                </span>
              </div>
            </label>

            <label className="flex items-center gap-2.5 text-ink cursor-pointer pt-1 border-t border-rule/60">
              <input
                type="radio"
                name="deleteScope"
                checked={!applyToAllStudents}
                onChange={() => setApplyToAllStudents(false)}
                className="w-4 h-4 text-signal focus:ring-0"
              />
              <div>
                <span className="font-semibold block">Remove ONLY from candidate: {studentName}</span>
                <span className="text-[11px] text-ink-muted block">
                  Only this student’s variant will have this question removed.
                </span>
              </div>
            </label>
          </div>
        </div>

        <div className="flex items-center justify-end gap-2 pt-3 border-t border-rule">
          <Button
            type="button"
            variant="secondary"
            size="sm"
            onClick={onClose}
            disabled={isDeleting}
          >
            Cancel
          </Button>
          <button
            type="button"
            onClick={handleDelete}
            disabled={isDeleting}
            className="px-4 py-2 rounded-[2px] bg-signal hover:bg-signal/90 text-paper font-mono text-xs uppercase tracking-wider font-semibold transition flex items-center gap-1.5"
          >
            {isDeleting ? (
              <>
                <Loader2 className="w-3.5 h-3.5 animate-spin" />
                <span>Removing...</span>
              </>
            ) : (
              <>
                <Trash2 className="w-3.5 h-3.5" />
                <span>Delete Question</span>
              </>
            )}
          </button>
        </div>
      </div>
    </div>
  );
}
