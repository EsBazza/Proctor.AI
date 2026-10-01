'use client';

import React, { useState, useEffect, use, useCallback } from 'react';
import { useRouter } from 'next/navigation';
import { signIn } from 'next-auth/react';
import Link from 'next/link';
import { 
  getStudentExamAction, 
  submitStudentExamAction, 
  getStudentExamStatusAction,
  SanitizedQuestion 
} from '@/actions/student';
import { IntegrityGuard } from '@/components/IntegrityGuard';
import { 
  Clock, 
  Send, 
  Loader2, 
  AlertCircle, 
  LogIn, 
  ArrowLeft, 
  FileText,
  Check
} from 'lucide-react';
import { StudentExamWithDetails } from '@/lib/db';
import { MatchingColumns } from '@/lib/gemini';
import { Button } from '@/components/ui/Button';

export default function StudentExamRoomPage({
  params
}: {
  params: Promise<{ token: string }>;
}) {
  const { token } = use(params);
  const router = useRouter();

  const [isLoading, setIsLoading] = useState(true);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [isLocked, setIsLocked] = useState(false);

  const [studentExam, setStudentExam] = useState<StudentExamWithDetails | null>(null);
  const [questions, setQuestions] = useState<SanitizedQuestion[]>([]);
  const [answers, setAnswers] = useState<Record<string, string>>({});
  const [timeLeft, setTimeLeft] = useState<number>(30 * 60);
  const [isProctoringReady, setIsProctoringReady] = useState(false);
  const [lastSavedTime, setLastSavedTime] = useState<string>('');
  const [activeQuestionIndex, setActiveQuestionIndex] = useState<number>(0);

  const handleSubmit = useCallback(async (e?: React.FormEvent) => {
    if (e) e.preventDefault();
    if (isSubmitting || isLocked) return;

    setIsSubmitting(true);
    setError(null);

    const formattedAnswers = questions.map((q) => ({
      questionId: q.id,
      studentAnswer: answers[q.id] || ''
    }));

    try {
      const res = await submitStudentExamAction(token, formattedAnswers);
      if (!res.success) {
        setError(res.error || 'Failed to submit examination.');
        setIsSubmitting(false);
        return;
      }

      localStorage.removeItem(`exam_draft_${token}`);
      router.push(`/exam/${token}/result`);
    } catch (err: unknown) {
      const message = err instanceof Error ? err.message : 'Error submitting answers.';
      setError(message);
      setIsSubmitting(false);
    }
  }, [answers, isLocked, isSubmitting, questions, router, token]);

  // Load exam and cached answers
  useEffect(() => {
    async function loadExam() {
      try {
        const res = await getStudentExamAction(token);
        if (!res.success || !res.studentExam) {
          setError(res.error || 'Failed to load examination variant.');
          setIsLoading(false);
          return;
        }

        if (res.studentExam.status === 'SUBMITTED' || res.studentExam.status === 'FLAGGED') {
          router.push(`/exam/${token}/result`);
          return;
        }

        if (res.studentExam.status === 'LOCKED') {
          setIsLocked(true);
        }

        setStudentExam(res.studentExam);
        setQuestions(res.questions || []);

        const initialSecs = (res.studentExam.durationMinutes || 30) * 60;
        setTimeLeft(initialSecs);

        const saved = localStorage.getItem(`exam_draft_${token}`);
        if (saved) {
          try {
            setAnswers(JSON.parse(saved));
            setLastSavedTime(new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit', second: '2-digit' }));
          } catch {
            // ignore corrupted cache
          }
        }
      } catch (err: unknown) {
        const message = err instanceof Error ? err.message : 'Failed to initialize session.';
        setError(message);
      } finally {
        setIsLoading(false);
      }
    }

    loadExam();
  }, [token, router]);

  // Countdown timer (only active once proctoring consent is confirmed)
  useEffect(() => {
    if (isLoading || isLocked || !isProctoringReady) return;

    const timer = setInterval(() => {
      setTimeLeft((prev) => {
        if (prev <= 1) {
          clearInterval(timer);
          handleSubmit();
          return 0;
        }
        return prev - 1;
      });
    }, 1000);

    return () => clearInterval(timer);
  }, [isLoading, isLocked, isProctoringReady, handleSubmit]);

  // Real-time status polling for unlock events
  useEffect(() => {
    if (!isLocked) return;

    const interval = setInterval(async () => {
      try {
        const statusRes = await getStudentExamStatusAction(token);
        if (statusRes.success && statusRes.status && statusRes.status !== 'LOCKED') {
          setIsLocked(false);
          setError(null);
        }
      } catch {
        // Silent error during polling
      }
    }, 4000);

    return () => clearInterval(interval);
  }, [isLocked, token]);

  const handleAnswerChange = (qId: string, val: string) => {
    if (isLocked) return;
    setAnswers((prev) => {
      const updated = { ...prev, [qId]: val };
      localStorage.setItem(`exam_draft_${token}`, JSON.stringify(updated));
      return updated;
    });
    setLastSavedTime(new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit', second: '2-digit' }));
  };

  const handleMatchingPairChange = (qId: string, itemKey: string, matchedLetter: string) => {
    if (isLocked) return;
    const oldAnswer = answers[qId] || '';
    const pairRegex = new RegExp(`${itemKey}\\s*:\\s*[A-Za-z0-9]+`, 'i');

    let newAnswer = '';
    if (pairRegex.test(oldAnswer)) {
      newAnswer = oldAnswer.replace(pairRegex, `${itemKey}:${matchedLetter}`);
    } else {
      newAnswer = oldAnswer ? `${oldAnswer}, ${itemKey}:${matchedLetter}` : `${itemKey}:${matchedLetter}`;
    }

    handleAnswerChange(qId, newAnswer);
  };

  const countWords = (text: string = '') => {
    return text.trim().split(/\s+/).filter(Boolean).length;
  };

  if (isLoading) {
    return (
      <div className="min-h-[70vh] flex flex-col items-center justify-center space-y-2">
        <Loader2 className="w-5 h-5 text-ink animate-spin" />
        <p className="font-mono text-xs text-ink-muted">Loading assigned examination variant...</p>
      </div>
    );
  }

  if (error && !studentExam) {
    const isAuthIssue = error.includes('Access Denied') || error.includes('Authentication required');
    return (
      <div className="max-w-md mx-auto my-16 p-8 rounded-[2px] bg-paper border border-rule text-center space-y-4">
        <div className="font-mono text-xs uppercase tracking-widest text-signal font-semibold">
          Access Restricted
        </div>
        <h2 className="text-xl font-semibold text-ink">Examination Authorization Required</h2>
        <p className="text-xs text-ink-muted leading-relaxed bg-ground p-3 rounded-[2px] border border-rule">
          {error}
        </p>

        <div className="pt-2 flex flex-col gap-2">
          {isAuthIssue && (
            <button
              onClick={() => signIn('google', { callbackUrl: window.location.pathname })}
              className="w-full flex items-center justify-center gap-2 px-4 py-2.5 rounded-[2px] bg-ink hover:bg-ink/90 text-paper font-mono text-xs uppercase tracking-wider transition-colors"
            >
              <LogIn className="w-3.5 h-3.5" />
              <span>Sign in with Google</span>
            </button>
          )}
          <Link
            href="/"
            className="w-full flex items-center justify-center gap-2 px-4 py-2.5 rounded-[2px] bg-paper hover:bg-ground border border-rule text-ink font-mono text-xs uppercase tracking-wider transition-colors"
          >
            <ArrowLeft className="w-3.5 h-3.5" />
            <span>Return to Landing</span>
          </Link>
        </div>
      </div>
    );
  }

  if (!studentExam) return null;

  const formatTimer = (seconds: number) => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`;
  };

  const answeredCount = Object.keys(answers).filter((k) => (answers[k] || '').trim().length > 0).length;

  return (
    <div className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8 py-8 space-y-6">
      {/* Examination Paper Header */}
      <div className="rounded-[2px] bg-paper border border-rule p-6 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div className="space-y-1">
          <div className="flex items-center gap-2 font-mono text-xs text-ink-muted">
            <span className="uppercase tracking-wider font-semibold text-ink">
              {studentExam.examSubject}
            </span>
            <span>/</span>
            <span>Candidate: <strong className="text-ink font-medium">{studentExam.studentName}</strong></span>
          </div>
          <h1 className="text-xl sm:text-2xl font-semibold tracking-tight text-ink">
            {studentExam.examTitle}
          </h1>
          <div className="text-xs text-ink-muted font-mono flex items-center gap-3 pt-0.5">
            <span>Progress: {answeredCount} of {questions.length} answered</span>
            {lastSavedTime && (
              <span aria-live="polite" className="text-verified">
                Saved {lastSavedTime}
              </span>
            )}
          </div>
        </div>

        {/* Live Mono Timer */}
        <div className="flex items-center gap-2 px-3.5 py-2 rounded-[2px] bg-ground border border-rule text-ink self-start sm:self-auto font-mono text-xs">
          <Clock className="w-3.5 h-3.5 text-ink-muted" />
          <span className="text-ink-muted">Time Remaining:</span>
          <strong className={`tabular-nums font-semibold ${isLocked ? 'text-signal' : !isProctoringReady ? 'text-ink-muted' : 'text-ink'}`}>
            {isLocked ? 'PAUSED' : !isProctoringReady ? 'PENDING CONSENT' : formatTimer(timeLeft)}
          </strong>
        </div>
      </div>

      {/* Proctoring Protocol & Consent Gate */}
      <IntegrityGuard 
        token={token}
        examTitle={studentExam.examTitle}
        examSubject={studentExam.examSubject}
        studentName={studentExam.studentName}
        durationMinutes={studentExam.durationMinutes}
        questionCount={questions.length}
        maxStrikes={studentExam.maxStrikes || 2}
        isLocked={isLocked}
        onLockout={() => setIsLocked(true)}
        onProctoringReady={(ready) => setIsProctoringReady(ready)}
      />

      {/* Neutral Non-Accusatory Session Locked Screen */}
      {isLocked && (
        <div className="rounded-[2px] bg-paper border border-signal/60 p-8 sm:p-10 text-center space-y-5">
          <div className="space-y-1.5 max-w-lg mx-auto">
            <div className="font-mono text-xs uppercase tracking-widest text-signal font-semibold">
              Proctoring Alert
            </div>
            <h2 className="text-xl font-semibold text-ink">
              Examination Session Paused
            </h2>
            <p className="text-xs text-ink-muted leading-relaxed">
              Your examination has been temporarily paused following multiple focus change events (tab switching or exiting fullscreen). A multi-frame forensic log has been submitted for instructor review.
            </p>
          </div>

          <div className="p-4 rounded-[2px] bg-ground border border-rule max-w-md mx-auto text-xs text-left space-y-1 font-mono">
            <div className="font-semibold text-ink">
              Your work is preserved:
            </div>
            <p className="text-ink-muted leading-relaxed">
              All responses recorded up to {lastSavedTime || 'incident'} are safely stored. Please inform your instructor to review your record and unlock your session.
            </p>
          </div>

          <div className="flex items-center justify-center gap-2 text-xs font-mono text-ink-muted pt-1">
            <Loader2 className="w-3.5 h-3.5 animate-spin text-ink" />
            <span>Listening for instructor authorization... (auto-resumes instantly)</span>
          </div>
        </div>
      )}

      {error && !isLocked && (
        <div role="alert" className="p-3.5 rounded-[2px] bg-signal/5 border border-signal/40 text-signal text-xs flex items-center gap-2.5 font-mono">
          <AlertCircle className="w-4 h-4 shrink-0" />
          <span>{error}</span>
        </div>
      )}

      {/* Main Examination Canvas with Margin Question Matrix */}
      {!isLocked && isProctoringReady && (
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-start">
          {/* Question Navigator (Left Margin on Desktop, Top Bar on Mobile) */}
          <aside className="lg:col-span-3 lg:sticky lg:top-20 space-y-3">
            <div className="rounded-[2px] bg-paper border border-rule p-4 space-y-3">
              <div className="font-mono text-xs uppercase tracking-wider text-ink-muted font-semibold flex items-center justify-between">
                <span>Navigator</span>
                <span>{answeredCount}/{questions.length}</span>
              </div>

              {/* Square Matrix Grid */}
              <div className="grid grid-cols-5 sm:grid-cols-6 lg:grid-cols-4 gap-1.5">
                {questions.map((q, idx) => {
                  const isAnswered = Boolean((answers[q.id] || '').trim().length > 0);
                  const isCurrent = idx === activeQuestionIndex;

                  return (
                    <button
                      key={q.id}
                      type="button"
                      onClick={() => {
                        setActiveQuestionIndex(idx);
                        const el = document.getElementById(`question_item_${idx}`);
                        if (el) el.scrollIntoView({ behavior: 'smooth', block: 'start' });
                      }}
                      className={`h-9 flex items-center justify-center font-mono text-xs rounded-[2px] border transition-colors ${
                        isCurrent
                          ? 'border-ink bg-ink text-paper font-bold ring-2 ring-ink/30'
                          : isAnswered
                          ? 'border-rule bg-ground text-ink font-semibold'
                          : 'border-rule bg-paper text-ink-muted hover:border-ink/50'
                      }`}
                      title={`Question ${idx + 1}: ${isAnswered ? 'Answered' : 'Unanswered'}`}
                    >
                      {idx + 1}
                    </button>
                  );
                })}
              </div>

              <div className="pt-2 border-t border-rule space-y-1 text-[11px] font-mono text-ink-muted">
                <div className="flex items-center gap-2">
                  <span className="w-2.5 h-2.5 rounded-[1px] bg-ink" />
                  <span>Current item</span>
                </div>
                <div className="flex items-center gap-2">
                  <span className="w-2.5 h-2.5 rounded-[1px] bg-ground border border-rule" />
                  <span>Answered</span>
                </div>
                <div className="flex items-center gap-2">
                  <span className="w-2.5 h-2.5 rounded-[1px] bg-paper border border-rule" />
                  <span>Unanswered</span>
                </div>
              </div>
            </div>
          </aside>

          {/* Reading Column (Constrained to 62–70ch for calm, fatigue-free reading) */}
          <main className="lg:col-span-9 space-y-8 max-w-[70ch]">
            <form onSubmit={handleSubmit} className="space-y-8">
              {questions.map((q, index) => {
                const rawType = (q.type || 'SHORT_ANSWER').toUpperCase();
                const currentAnswer = answers[q.id] || '';

                return (
                  <article
                    key={q.id}
                    id={`question_item_${index}`}
                    className="rounded-[2px] bg-paper border border-rule p-6 sm:p-8 space-y-6"
                  >
                    {/* Item Meta Header */}
                    <div className="flex items-center justify-between border-b border-rule pb-3 font-mono text-xs text-ink-muted">
                      <div className="flex items-center gap-2">
                        <span className="font-semibold text-ink uppercase tracking-wider">
                          Item {index + 1} of {questions.length}
                        </span>
                        <span>/</span>
                        <span className="uppercase text-[11px]">
                          {rawType.replace(/_/g, ' ')}
                        </span>
                        {q.conceptTested && (
                          <span className="hidden sm:inline text-ink-muted/80">
                            ({q.conceptTested})
                          </span>
                        )}
                      </div>
                      <span className="font-semibold text-ink">
                        [{q.maxPoints} pts]
                      </span>
                    </div>

                    {/* Question Prompt in Source Serif 4 */}
                    <div className="font-serif text-[18px] sm:text-[19px] leading-[1.65] text-ink whitespace-pre-wrap">
                      {q.prompt}
                    </div>

                    {/* 1. Multiple Choice Options (MCQ) — Ruled Answer Rows */}
                    {rawType === 'MCQ' && Array.isArray(q.options) && (
                      <div className="border border-rule rounded-[2px] divide-y divide-rule">
                        {q.options.map((option: string, optIdx: number) => {
                          const isChecked = currentAnswer === option;
                          return (
                            <label
                              key={optIdx}
                              className={`flex items-center gap-3.5 p-4 cursor-pointer transition-colors text-sm min-h-[44px] ${
                                isChecked
                                  ? 'bg-ground text-ink font-medium'
                                  : 'bg-paper text-ink-muted hover:bg-ground/60'
                              }`}
                            >
                              <input
                                type="radio"
                                name={`q_${q.id}`}
                                value={option}
                                checked={isChecked}
                                onChange={() => handleAnswerChange(q.id, option)}
                                className="w-4 h-4 text-ink border-rule focus:ring-ink"
                              />
                              <span className="text-ink leading-relaxed">{option}</span>
                            </label>
                          );
                        })}
                      </div>
                    )}

                    {/* 2. True or False (TRUE_FALSE) */}
                    {rawType === 'TRUE_FALSE' && (
                      <div className="grid grid-cols-2 gap-3">
                        {['TRUE', 'FALSE'].map((choice) => {
                          const isChecked = currentAnswer.toUpperCase() === choice;
                          return (
                            <button
                              key={choice}
                              type="button"
                              onClick={() => handleAnswerChange(q.id, choice)}
                              className={`py-3.5 px-4 rounded-[2px] border font-mono text-xs uppercase tracking-wider font-semibold transition-colors flex items-center justify-center gap-2 min-h-[44px] ${
                                isChecked
                                  ? 'bg-ink text-paper border-ink'
                                  : 'bg-paper text-ink border-rule hover:bg-ground'
                              }`}
                            >
                              <span>{choice}</span>
                              {isChecked && <Check className="w-3.5 h-3.5" />}
                            </button>
                          );
                        })}
                      </div>
                    )}

                    {/* 3. Short Answer */}
                    {rawType === 'SHORT_ANSWER' && (
                      <div className="space-y-1.5">
                        <textarea
                          rows={3}
                          placeholder="Write your concise explanation here..."
                          value={currentAnswer}
                          onChange={(e) => handleAnswerChange(q.id, e.target.value)}
                          className="w-full px-3.5 py-2.5 rounded-[2px] bg-paper border border-rule text-ink placeholder:text-ink-muted/50 focus:outline-none focus:ring-1 focus:ring-ink focus:border-ink text-sm leading-relaxed"
                        />
                        <div className="text-[11px] font-mono text-ink-muted text-right">
                          {currentAnswer.length} characters
                        </div>
                      </div>
                    )}

                    {/* 4. Essay */}
                    {rawType === 'ESSAY' && (
                      <div className="space-y-2">
                        <div className="flex items-center justify-between text-xs font-mono text-ink-muted">
                          <span className="flex items-center gap-1.5">
                            <FileText className="w-3.5 h-3.5" />
                            <span>Essay Response</span>
                          </span>
                          <span>
                            {countWords(currentAnswer)} words
                          </span>
                        </div>
                        <textarea
                          rows={8}
                          placeholder="Develop your response with structured arguments, evidence, and clear analysis..."
                          value={currentAnswer}
                          onChange={(e) => handleAnswerChange(q.id, e.target.value)}
                          className="w-full px-3.5 py-3 rounded-[2px] bg-paper border border-rule text-ink placeholder:text-ink-muted/50 focus:outline-none focus:ring-1 focus:ring-ink focus:border-ink text-sm leading-relaxed"
                        />
                      </div>
                    )}

                    {/* 5. Fill in the Blank */}
                    {rawType === 'FILL_IN_BLANK' && (
                      <div className="space-y-2">
                        <label className="block text-xs font-mono text-ink-muted">
                          Enter missing term or expression:
                        </label>
                        <input
                          type="text"
                          placeholder="Type answer..."
                          value={currentAnswer}
                          onChange={(e) => handleAnswerChange(q.id, e.target.value)}
                          className="w-full sm:max-w-md px-3.5 py-2.5 rounded-[2px] bg-paper border border-rule text-ink placeholder:text-ink-muted/50 focus:outline-none focus:ring-1 focus:ring-ink focus:border-ink text-sm font-mono min-h-[44px]"
                        />
                      </div>
                    )}

                    {/* 6. Matching Type */}
                    {rawType === 'MATCHING' && q.options && typeof q.options === 'object' && 'columnA' in q.options && (
                      <div className="space-y-4">
                        <div className="text-xs font-mono text-ink-muted">
                          Match items in Column A with corresponding entries in Column B:
                        </div>

                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                          {/* Column A */}
                          <div className="space-y-2">
                            <div className="font-mono text-xs uppercase tracking-wider text-ink font-semibold">
                              Column A (Premises)
                            </div>
                            {(q.options as MatchingColumns).columnA.map((itemA, itemIdx) => {
                              const itemKey = itemA.split(/[:.)\s]+/)[0] || String(itemIdx + 1);

                              let currentMatch = '';
                              try {
                                const matchRegex = new RegExp(`${itemKey}\\s*:\\s*([A-Za-z0-9]+)`, 'i');
                                const found = currentAnswer.match(matchRegex);
                                if (found) currentMatch = found[1].toUpperCase();
                              } catch {
                                currentMatch = '';
                              }

                              return (
                                <div
                                  key={itemIdx}
                                  className="p-3 rounded-[2px] bg-ground border border-rule flex items-center justify-between gap-3 text-xs"
                                >
                                  <span className="text-ink leading-relaxed">{itemA}</span>
                                  <select
                                    value={currentMatch}
                                    onChange={(e) => handleMatchingPairChange(q.id, itemKey, e.target.value)}
                                    className="px-2 py-1 rounded-[2px] bg-paper border border-rule text-ink text-xs font-mono font-semibold focus:outline-none focus:ring-1 focus:ring-ink"
                                  >
                                    <option value="">Select</option>
                                    {(q.options as MatchingColumns).columnB.map((itemB, bIdx) => {
                                      const letter = itemB.split(/[:.)\s]+/)[0] || String.fromCharCode(65 + bIdx);
                                      return (
                                        <option key={bIdx} value={letter}>
                                          {letter}
                                        </option>
                                      );
                                    })}
                                  </select>
                                </div>
                              );
                            })}
                          </div>

                          {/* Column B */}
                          <div className="space-y-2">
                            <div className="font-mono text-xs uppercase tracking-wider text-ink font-semibold">
                              Column B (Definitions)
                            </div>
                            {(q.options as MatchingColumns).columnB.map((itemB, bIdx) => (
                              <div
                                key={bIdx}
                                className="p-3 rounded-[2px] bg-paper border border-rule text-xs text-ink-muted leading-relaxed"
                              >
                                {itemB}
                              </div>
                            ))}
                          </div>
                        </div>
                      </div>
                    )}

                    {/* 7. Identification */}
                    {rawType === 'IDENTIFICATION' && (
                      <div className="space-y-2">
                        <input
                          type="text"
                          placeholder="Type term or name..."
                          value={currentAnswer}
                          onChange={(e) => handleAnswerChange(q.id, e.target.value)}
                          className="w-full sm:max-w-md px-3.5 py-2.5 rounded-[2px] bg-paper border border-rule text-ink placeholder:text-ink-muted/50 focus:outline-none focus:ring-1 focus:ring-ink focus:border-ink text-sm font-mono min-h-[44px]"
                        />
                      </div>
                    )}
                  </article>
                );
              })}

              {/* Submit Final Examination */}
              <div className="pt-4 border-t border-rule">
                <Button
                  type="submit"
                  disabled={isSubmitting}
                  variant="primary"
                  size="lg"
                  fullWidth
                  className="font-mono text-xs uppercase tracking-widest min-h-[48px]"
                >
                  {isSubmitting ? (
                    <span className="inline-flex items-center gap-2">
                      <Loader2 className="w-4 h-4 animate-spin" />
                      <span>Submitting Examination Responses...</span>
                    </span>
                  ) : (
                    <span className="inline-flex items-center gap-2">
                      <Send className="w-4 h-4" />
                      <span>Submit Completed Examination</span>
                    </span>
                  )}
                </Button>
              </div>
            </form>
          </main>
        </div>
      )}
    </div>
  );
}
