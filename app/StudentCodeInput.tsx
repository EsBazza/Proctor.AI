'use client';

import React, { useState } from 'react';
import { useRouter } from 'next/navigation';
import { ArrowRight, Loader2, KeyRound, UserCheck } from 'lucide-react';
import { validateExamCodeAction } from '@/actions/student';
import { Button } from '@/components/ui/Button';

interface StudentCodeInputProps {
  initialCode?: string;
  userEmail?: string | null;
  variant?: 'default' | 'hero';
}

export default function StudentCodeInput({
  initialCode = '',
  userEmail,
  variant = 'hero'
}: StudentCodeInputProps) {
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

  if (variant === 'hero') {
    return (
      <div className="p-5 rounded-2xl bg-white border border-slate-200/90 shadow-md space-y-4 text-left font-sans">
        {/* Student Session Header */}
        <div className="flex items-center justify-between gap-3 border-b border-slate-100 pb-3">
          <div className="flex items-center gap-2">
            <div className="w-7 h-7 rounded-lg bg-emerald-50 text-emerald-600 flex items-center justify-center">
              <UserCheck className="w-4 h-4" />
            </div>
            <div>
              <div className="text-xs font-bold text-[#0B1D39]">Student Session Active</div>
              {userEmail && <div className="text-[11px] font-mono text-[#576375] truncate max-w-[200px] sm:max-w-[260px]">{userEmail}</div>}
            </div>
          </div>
          <span className="inline-flex items-center px-2 py-0.5 rounded text-[10px] font-mono font-bold bg-slate-100 text-[#0B1D39] border border-slate-200 uppercase">
            STUDENT
          </span>
        </div>

        {error && (
          <div
            role="alert"
            className="p-3 border border-rose-200 bg-rose-50 text-rose-700 text-xs rounded-xl font-mono leading-relaxed"
          >
            {error}
          </div>
        )}

        {/* Code Input Form */}
        <form onSubmit={handleSubmit} className="space-y-3">
          <div>
            <label
              htmlFor="heroAccessCodeInput"
              className="block text-xs font-mono font-semibold uppercase tracking-wider text-[#576375] mb-1.5"
            >
              Enter 6-Digit Exam Access Code
            </label>
            <div className="relative flex items-center">
              <div className="absolute left-3.5 text-[#576375] pointer-events-none">
                <KeyRound className="w-4 h-4" />
              </div>
              <input
                id="heroAccessCodeInput"
                type="text"
                maxLength={6}
                required
                autoFocus
                placeholder="e.g. 849201"
                value={accessCode}
                onChange={(e) => setAccessCode(e.target.value.replace(/\s+/g, ''))}
                className="w-full pl-10 pr-4 py-3 rounded-xl bg-slate-50 border border-slate-200 text-[#0B1D39] font-mono text-base sm:text-lg font-bold tracking-widest placeholder:tracking-normal placeholder:text-slate-400 placeholder:font-normal focus:bg-white focus:outline-none focus:ring-2 focus:ring-[#123A63] focus:border-transparent transition-all"
              />
            </div>
          </div>

          <button
            type="submit"
            disabled={isValidating}
            className="w-full flex items-center justify-center gap-2.5 px-5 py-3.5 rounded-xl bg-[#0B1D39] hover:bg-[#123A63] disabled:opacity-75 text-white font-bold text-sm shadow-md hover:shadow-lg transition-all duration-150 active:scale-[0.99] font-sans group cursor-pointer border border-[#0B1D39]"
          >
            {isValidating ? (
              <span className="inline-flex items-center gap-2 text-xs font-mono">
                <Loader2 className="w-4 h-4 animate-spin" />
                <span>Verifying Roster Access...</span>
              </span>
            ) : (
              <>
                <span>Access Examination Room</span>
                <ArrowRight className="w-4 h-4 transition-transform group-hover:translate-x-1" />
              </>
            )}
          </button>
        </form>
      </div>
    );
  }

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
