'use client';

import React, { useState, useTransition } from 'react';
import { Shield, Check, Loader2 } from 'lucide-react';
import { updateExamSettingsAction } from '@/actions/exam';
import { Button } from '@/components/ui/Button';

interface AdjustLockoutModalProps {
  examId: string;
  currentMaxStrikes: number;
}

export function AdjustLockoutModal({
  examId,
  currentMaxStrikes
}: AdjustLockoutModalProps) {
  const [isOpen, setIsOpen] = useState(false);
  const [strikes, setStrikes] = useState<number>(currentMaxStrikes || 2);
  const [isPending, startTransition] = useTransition();
  const [statusMessage, setStatusMessage] = useState<string | null>(null);

  const handleSave = () => {
    startTransition(async () => {
      setStatusMessage(null);
      const res = await updateExamSettingsAction(examId, { maxStrikes: strikes });
      if (res.success) {
        setStatusMessage('Threshold updated successfully!');
        setTimeout(() => {
          setIsOpen(false);
          setStatusMessage(null);
        }, 1000);
      } else {
        setStatusMessage(res.error || 'Failed to update threshold');
      }
    });
  };

  return (
    <>
      <button
        type="button"
        onClick={() => setIsOpen(true)}
        className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-[2px] bg-paper hover:bg-ground border border-rule text-ink text-xs font-mono transition-colors"
        title="Change how many integrity flags trigger exam lockout"
      >
        <Shield className="w-3.5 h-3.5 text-signal" />
        <span>Policy: {currentMaxStrikes || 2} Flags</span>
      </button>

      {isOpen && (
        <div className="fixed inset-0 z-50 bg-ink/60 flex items-center justify-center p-4">
          <div className="relative max-w-md w-full rounded-[2px] bg-paper border border-rule p-6 space-y-5 text-left shadow-2xl">
            <div className="space-y-1 border-b border-rule pb-3">
              <div className="font-mono text-xs uppercase tracking-wider text-ink-muted">
                Exam Security Protocol
              </div>
              <h3 className="text-lg font-semibold text-ink">
                Adjust Lockout Threshold
              </h3>
              <p className="text-xs text-ink-muted leading-relaxed">
                Configure how many integrity flags (tab switching, window blur, fullscreen exits, paste attempts) a student can accumulate before their exam session is locked.
              </p>
            </div>

            <div className="space-y-3">
              <label className="block text-xs font-semibold uppercase tracking-wider text-ink-muted">
                Flags Allowed Before Lockout:
              </label>

              <div className="flex items-center gap-3">
                <input
                  type="number"
                  min="1"
                  max="20"
                  value={strikes}
                  onChange={(e) => setStrikes(Math.max(1, parseInt(e.target.value) || 2))}
                  className="w-24 px-3 py-2 rounded-[2px] bg-ground border border-rule text-ink font-mono font-bold text-center text-sm"
                />
                <span className="text-xs font-mono text-ink-muted">
                  Infraction(s)
                </span>
              </div>

              {/* Preset buttons */}
              <div className="flex items-center gap-1.5 flex-wrap pt-1">
                {[
                  { value: 1, label: '1 (Strict Lock)' },
                  { value: 2, label: '2 (Standard)' },
                  { value: 3, label: '3 (Lenient)' },
                  { value: 5, label: '5 (High Tolerance)' }
                ].map((p) => (
                  <button
                    key={p.value}
                    type="button"
                    onClick={() => setStrikes(p.value)}
                    className={`px-2.5 py-1 rounded-[2px] text-xs font-mono transition ${
                      strikes === p.value
                        ? 'bg-signal text-paper font-semibold'
                        : 'bg-ground border border-rule text-ink-muted hover:text-ink'
                    }`}
                  >
                    {p.label}
                  </button>
                ))}
              </div>
            </div>

            {statusMessage && (
              <div className="text-xs font-mono text-verified flex items-center gap-1.5">
                <Check className="w-3.5 h-3.5" />
                <span>{statusMessage}</span>
              </div>
            )}

            <div className="flex items-center justify-end gap-2 pt-3 border-t border-rule">
              <Button
                variant="secondary"
                size="sm"
                onClick={() => setIsOpen(false)}
                disabled={isPending}
              >
                Cancel
              </Button>
              <Button
                variant="primary"
                size="sm"
                onClick={handleSave}
                disabled={isPending}
                className="font-mono text-xs uppercase"
              >
                {isPending ? (
                  <>
                    <Loader2 className="w-3.5 h-3.5 mr-1.5 animate-spin" />
                    <span>Saving...</span>
                  </>
                ) : (
                  <span>Update Policy</span>
                )}
              </Button>
            </div>
          </div>
        </div>
      )}
    </>
  );
}
