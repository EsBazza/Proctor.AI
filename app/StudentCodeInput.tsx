'use client';

import React, { useState } from 'react';
import { useRouter } from 'next/navigation';
import { ArrowRight, Loader2 } from 'lucide-react';
import { validateExamCodeAction } from '@/actions/student';
import { Button } from '@/components/ui/Button';

interface StudentCodeInputProps {
  initialCode?: string;
}

export default function StudentCodeInput({ initialCode = '' }: StudentCodeInputProps) {
  const router = useRouter();
  const [accessCode, setAccessCode] = useState(initialCode);
  const [isValidating, setIsValidating] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);

    const cleanCode = accessCode.trim();
    if (!cleanCode) {
      setError('Please enter your 6-digit exam access code.');
      return;
    }

    setIsValidating(true);

    try {
      const res = await validateExamCodeAction(cleanCode);

      if (!res.success) {
        setError(res.error || 'Invalid examination code.');
        setIsValidating(false);
        return;
      }

      if (res.redirectUrl) {
        router.push(res.redirectUrl);
        return;
      }

      setError('Could not locate an active examination session for this code.');
    } catch (err: unknown) {
      const message = err instanceof Error ? err.message : 'Error validating code';
      setError(message);
    } finally {
      setIsValidating(false);
    }
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      {error && (
        <div
          role="alert"
          className="p-3 border border-signal/40 bg-signal/5 text-signal text-xs rounded-[2px] font-mono leading-relaxed"
        >
          {error}
        </div>
      )}

      <div className="space-y-1.5 text-left">
        <label
          htmlFor="accessCodeInput"
          className="block text-xs font-mono uppercase tracking-wider text-ink-muted"
        >
          6-Digit Examination Code
        </label>
        <div className="relative">
          <input
            id="accessCodeInput"
            type="text"
            maxLength={6}
            required
            autoFocus
            placeholder="849201"
            value={accessCode}
            onChange={(e) => setAccessCode(e.target.value.replace(/\s+/g, ''))}
            className="w-full px-3.5 py-3 rounded-[2px] bg-paper border border-rule text-ink font-mono text-lg font-semibold tracking-widest placeholder:text-ink-muted/30 focus:outline-none focus:ring-1 focus:ring-ink focus:border-ink"
          />
        </div>
      </div>

      <Button
        type="submit"
        disabled={isValidating}
        variant="primary"
        size="lg"
        fullWidth
        className="font-mono text-xs uppercase tracking-wider"
      >
        {isValidating ? (
          <span className="inline-flex items-center gap-2">
            <Loader2 className="w-4 h-4 animate-spin" />
            <span>Verifying Session...</span>
          </span>
        ) : (
          <span className="inline-flex items-center gap-2">
            <span>Enter Examination Room</span>
            <ArrowRight className="w-4 h-4" />
          </span>
        )}
      </Button>
    </form>
  );
}
