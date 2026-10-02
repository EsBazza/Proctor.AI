'use client';

import React, { useState } from 'react';
import { 
  X, 
  Plus, 
  Trash2, 
  CheckCircle2, 
  Loader2
} from 'lucide-react';
import { Button } from '@/components/ui/Button';
import { addManualQuestionAction, updateQuestionAction, ManualQuestionPayload } from '@/actions/exam';

export interface QuestionData {
  id?: string;
  questionIndex?: number;
  type: string;
  prompt: string;
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  options?: any;
  correctAnswer: string;
  maxPoints: number;
  conceptTested?: string | null;
  difficulty?: string | null;
  aiExplanation?: string | null;
}

interface QuestionEditorModalProps {
  isOpen: boolean;
  onClose: () => void;
  examId: string;
  studentExamId: string;
  studentName: string;
  existingQuestion?: QuestionData | null;
  onSuccess?: () => void;
}

const QUESTION_TYPES = [
  { id: 'MCQ', label: 'Multiple Choice', desc: '4-option question (A, B, C, D)' },
  { id: 'TRUE_FALSE', label: 'True / False', desc: 'Binary statement validation' },
  { id: 'SHORT_ANSWER', label: 'Short Answer', desc: '1-2 sentence response with model answer' },
  { id: 'ESSAY', label: 'Essay', desc: 'Long-form analysis with grading rubric' },
  { id: 'FILL_IN_BLANK', label: 'Fill in the Blank', desc: 'Sentence with blank (______)' },
  { id: 'MATCHING', label: 'Matching Type', desc: 'Pair items from Column A to Column B' },
  { id: 'IDENTIFICATION', label: 'Identification', desc: 'Definition clue with target term' }
];

export function QuestionEditorModal({
  isOpen,
  onClose,
  examId,
  studentExamId,
  studentName,
  existingQuestion,
  onSuccess
}: QuestionEditorModalProps) {
  const isEditing = !!existingQuestion?.id;

  const [type, setType] = useState<string>(() => existingQuestion?.type || 'MCQ');
  const [prompt, setPrompt] = useState(() => existingQuestion?.prompt || '');
  const [conceptTested, setConceptTested] = useState(() => existingQuestion?.conceptTested || '');
  const [difficulty, setDifficulty] = useState(() => existingQuestion?.difficulty || 'MEDIUM');
  const [maxPoints, setMaxPoints] = useState<number>(() => existingQuestion?.maxPoints || 10);
  const [applyToAllStudents, setApplyToAllStudents] = useState<boolean>(true);

  // MCQ specific state
  const [mcqOptions, setMcqOptions] = useState<string[]>(() => {
    if (existingQuestion?.type === 'MCQ' && Array.isArray(existingQuestion.options)) {
      return existingQuestion.options.map((o) => String(o));
    }
    return ['A) ', 'B) ', 'C) ', 'D) '];
  });
  const [mcqCorrectIndex, setMcqCorrectIndex] = useState<number>(() => {
    if (existingQuestion?.type === 'MCQ' && Array.isArray(existingQuestion.options)) {
      const opts = existingQuestion.options.map((o) => String(o));
      const correctAns = existingQuestion.correctAnswer || '';
      const foundIdx = opts.findIndex((o) => 
        o.trim().toLowerCase() === correctAns.trim().toLowerCase() ||
        o.trim().toLowerCase().startsWith(correctAns.trim().toLowerCase().charAt(0) + ')')
      );
      return foundIdx >= 0 ? foundIdx : 0;
    }
    return 0;
  });

  // True/False state
  const [tfCorrect, setTfCorrect] = useState<'TRUE' | 'FALSE'>(() => {
    if (existingQuestion?.type === 'TRUE_FALSE') {
      return existingQuestion.correctAnswer?.toUpperCase().includes('TRUE') ? 'TRUE' : 'FALSE';
    }
    return 'TRUE';
  });

  // Short Answer & Essay state
  const [rubricText, setRubricText] = useState(() => {
    if (existingQuestion?.type === 'SHORT_ANSWER' || existingQuestion?.type === 'ESSAY') {
      return existingQuestion.correctAnswer || '';
    }
    return '';
  });

  // Fill in the Blank state
  const [fillAnswer, setFillAnswer] = useState(() => {
    if (existingQuestion?.type === 'FILL_IN_BLANK') {
      return existingQuestion.correctAnswer || '';
    }
    return '';
  });

  // Identification state
  const [identAnswer, setIdentAnswer] = useState(() => {
    if (existingQuestion?.type === 'IDENTIFICATION') {
      return existingQuestion.correctAnswer || '';
    }
    return '';
  });

  // Matching Type state
  const [matchingPairs, setMatchingPairs] = useState<Array<{ colA: string; colB: string }>>(() => {
    if (existingQuestion?.type === 'MATCHING' && existingQuestion.options && typeof existingQuestion.options === 'object') {
      const optsObj = existingQuestion.options as { columnA?: string[]; columnB?: string[] };
      const colA = optsObj.columnA || [];
      const colB = optsObj.columnB || [];
      const pairs = [];
      for (let i = 0; i < Math.max(colA.length, colB.length); i++) {
        pairs.push({
          colA: colA[i] || `${i + 1}. `,
          colB: colB[i] || `${String.fromCharCode(65 + i)}. `
        });
      }
      if (pairs.length > 0) return pairs;
    }
    return [
      { colA: '1. Term 1', colB: 'A. Definition 1' },
      { colA: '2. Term 2', colB: 'B. Definition 2' },
      { colA: '3. Term 3', colB: 'C. Definition 3' }
    ];
  });

  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  if (!isOpen) return null;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!prompt.trim()) {
      setError('Please provide a question prompt.');
      return;
    }

    setIsSubmitting(true);
    setError(null);

    let finalOptions: unknown = null;
    let finalCorrectAnswer = '';

    if (type === 'MCQ') {
      const validOptions = mcqOptions.map((o, idx) => {
        const letter = String.fromCharCode(65 + idx);
        const text = o.replace(/^[A-Da-d][).]\s*/, '').trim();
        return `${letter}) ${text}`;
      });
      finalOptions = validOptions;
      finalCorrectAnswer = validOptions[mcqCorrectIndex] || validOptions[0];
    } else if (type === 'TRUE_FALSE') {
      finalOptions = ['TRUE', 'FALSE'];
      finalCorrectAnswer = tfCorrect;
    } else if (type === 'SHORT_ANSWER' || type === 'ESSAY') {
      finalOptions = null;
      finalCorrectAnswer = rubricText.trim() || 'Comprehensive mastery demonstrated according to course material.';
    } else if (type === 'FILL_IN_BLANK') {
      finalOptions = null;
      finalCorrectAnswer = fillAnswer.trim();
    } else if (type === 'IDENTIFICATION') {
      finalOptions = null;
      finalCorrectAnswer = identAnswer.trim();
    } else if (type === 'MATCHING') {
      finalOptions = {
        columnA: matchingPairs.map((p) => p.colA.trim()),
        columnB: matchingPairs.map((p) => p.colB.trim())
      };
      // Format pairs like "1:A, 2:B, 3:C"
      finalCorrectAnswer = matchingPairs
        .map((p, idx) => `${idx + 1}:${String.fromCharCode(65 + idx)}`)
        .join(', ');
    }

    const payload: ManualQuestionPayload = {
      type,
      prompt: prompt.trim(),
      options: finalOptions,
      correctAnswer: finalCorrectAnswer,
      maxPoints: maxPoints || 10,
      conceptTested: conceptTested.trim() || 'Core Concept',
      difficulty,
      aiExplanation: (isEditing ? existingQuestion?.aiExplanation : null) || 'Created manually by educator.'
    };

    try {
      if (isEditing && existingQuestion?.id) {
        const res = await updateQuestionAction({
          questionId: existingQuestion.id,
          examId,
          studentExamId,
          questionIndex: existingQuestion.questionIndex || 1,
          applyToAllStudents,
          question: payload
        });
        if (!res.success) {
          setError(res.error || 'Failed to update question.');
          setIsSubmitting(false);
          return;
        }
      } else {
        const res = await addManualQuestionAction({
          examId,
          studentExamId,
          applyToAllStudents,
          question: payload
        });
        if (!res.success) {
          setError(res.error || 'Failed to add question.');
          setIsSubmitting(false);
          return;
        }
      }

      setIsSubmitting(false);
      if (onSuccess) onSuccess();
      onClose();
    } catch (err: unknown) {
      const message = err instanceof Error ? err.message : 'Error saving question.';
      setError(message);
      setIsSubmitting(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 bg-ink/60 flex items-center justify-center p-4 overflow-y-auto">
      <div className="relative max-w-2xl w-full rounded-[2px] bg-paper border border-rule p-6 sm:p-8 space-y-6 text-left shadow-2xl my-8">
        {/* Header */}
        <div className="flex items-start justify-between gap-3 border-b border-rule pb-4">
          <div className="space-y-1">
            <div className="font-mono text-xs uppercase tracking-widest text-ink-muted">
              {isEditing ? 'Educator Manual Override' : 'Manual Question Authoring'}
            </div>
            <h2 className="text-xl font-bold text-ink">
              {isEditing ? `Edit Question ${existingQuestion?.questionIndex || ''}` : 'Add Manual Question'}
            </h2>
            <p className="text-xs text-ink-muted">
              Safeguard and refine test questions using any of the 7 official assessment formats.
            </p>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="p-1 rounded-[2px] text-ink-muted hover:text-ink hover:bg-ground transition"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {error && (
          <div className="p-3 rounded-[2px] bg-signal/10 border border-signal/40 text-signal text-xs font-mono">
            {error}
          </div>
        )}

        <form onSubmit={handleSubmit} className="space-y-5">
          {/* Question Format Selector */}
          <div>
            <label className="block text-xs font-semibold uppercase tracking-wider text-ink-muted mb-2">
              Question Format (7 Types Supported)
            </label>
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
              {QUESTION_TYPES.map((t) => (
                <button
                  key={t.id}
                  type="button"
                  onClick={() => setType(t.id)}
                  className={`p-2.5 rounded-[2px] text-left border transition text-xs flex flex-col justify-between ${
                    type === t.id
                      ? 'bg-ink text-paper border-ink font-semibold'
                      : 'bg-ground/50 border-rule text-ink hover:bg-ground'
                  }`}
                >
                  <span className="font-medium text-xs">{t.label}</span>
                  <span className="text-[10px] opacity-70 font-mono mt-1 line-clamp-1">{t.id}</span>
                </button>
              ))}
            </div>
          </div>

          {/* Prompt */}
          <div>
            <label className="block text-xs font-semibold uppercase tracking-wider text-ink-muted mb-1.5">
              Question Prompt *
            </label>
            <textarea
              rows={3}
              value={prompt}
              onChange={(e) => setPrompt(e.target.value)}
              placeholder={
                type === 'FILL_IN_BLANK'
                  ? 'e.g. The powerhouse of the cell is the ______.'
                  : 'Enter the complete question prompt...'
              }
              className="w-full px-3.5 py-2.5 rounded-[2px] bg-paper border border-rule text-ink placeholder-slate-400 focus:outline-none focus:border-ink transition text-sm leading-relaxed"
              required
            />
          </div>

          {/* Format-Specific Answer & Options Inputs */}
          {/* 1. MCQ */}
          {type === 'MCQ' && (
            <div className="space-y-3 p-4 rounded-[2px] bg-ground/50 border border-rule">
              <div className="flex items-center justify-between">
                <span className="text-xs font-semibold text-ink uppercase tracking-wider">
                  Multiple Choice Options (Select Correct Answer)
                </span>
                <span className="text-[11px] font-mono text-ink-muted">Radio button marks correct choice</span>
              </div>
              <div className="space-y-2.5">
                {mcqOptions.map((opt, idx) => {
                  const letter = String.fromCharCode(65 + idx);
                  const cleanText = opt.replace(/^[A-Da-d][).]\s*/, '');
                  const isCorrect = mcqCorrectIndex === idx;

                  return (
                    <div
                      key={idx}
                      className={`flex items-center gap-3 p-2.5 rounded-[2px] border transition ${
                        isCorrect
                          ? 'bg-emerald-950/20 border-emerald-500/50'
                          : 'bg-paper border-rule'
                      }`}
                    >
                      <input
                        type="radio"
                        name="mcqCorrectRadio"
                        checked={isCorrect}
                        onChange={() => setMcqCorrectIndex(idx)}
                        className="w-4 h-4 text-emerald-600 focus:ring-0 cursor-pointer"
                        title={`Mark Option ${letter} as correct`}
                      />
                      <span className="font-mono font-bold text-xs text-ink w-6 shrink-0">
                        {letter})
                      </span>
                      <input
                        type="text"
                        value={cleanText}
                        onChange={(e) => {
                          const updated = [...mcqOptions];
                          updated[idx] = `${letter}) ${e.target.value}`;
                          setMcqOptions(updated);
                        }}
                        placeholder={`Option ${letter} text...`}
                        className="w-full px-3 py-1.5 rounded-[2px] bg-transparent border-0 text-ink text-xs focus:outline-none"
                      />
                      {isCorrect && (
                        <span className="shrink-0 px-2 py-0.5 rounded-[2px] bg-emerald-500/20 text-verified text-[10px] font-bold font-mono">
                          Correct
                        </span>
                      )}
                    </div>
                  );
                })}
              </div>
            </div>
          )}

          {/* 2. TRUE_FALSE */}
          {type === 'TRUE_FALSE' && (
            <div className="p-4 rounded-[2px] bg-ground/50 border border-rule space-y-3">
              <span className="text-xs font-semibold text-ink uppercase tracking-wider block">
                Select Correct Binary Truth Value
              </span>
              <div className="grid grid-cols-2 gap-3">
                {(['TRUE', 'FALSE'] as const).map((val) => (
                  <button
                    key={val}
                    type="button"
                    onClick={() => setTfCorrect(val)}
                    className={`py-3 px-4 rounded-[2px] font-mono text-xs font-bold uppercase transition flex items-center justify-center gap-2 border ${
                      tfCorrect === val
                        ? 'bg-verified text-paper border-verified'
                        : 'bg-paper text-ink border-rule hover:bg-ground'
                    }`}
                  >
                    {tfCorrect === val && <CheckCircle2 className="w-4 h-4" />}
                    <span>{val}</span>
                  </button>
                ))}
              </div>
            </div>
          )}

          {/* 3. SHORT_ANSWER & ESSAY */}
          {(type === 'SHORT_ANSWER' || type === 'ESSAY') && (
            <div className="p-4 rounded-[2px] bg-ground/50 border border-rule space-y-2">
              <div className="flex items-center justify-between">
                <span className="text-xs font-semibold text-ink uppercase tracking-wider">
                  {type === 'ESSAY' ? 'Master Essay Rubric & Criteria' : 'Expected Short Answer Benchmark'}
                </span>
                <span className="text-[11px] font-mono text-ink-muted">AI compares student response to this text</span>
              </div>
              <textarea
                rows={3}
                value={rubricText}
                onChange={(e) => setRubricText(e.target.value)}
                placeholder="Enter model answer, required key points, or evaluation criteria..."
                className="w-full px-3.5 py-2.5 rounded-[2px] bg-paper border border-rule text-ink placeholder-slate-400 focus:outline-none focus:border-ink transition text-xs leading-relaxed"
              />
            </div>
          )}

          {/* 4. FILL_IN_BLANK */}
          {type === 'FILL_IN_BLANK' && (
            <div className="p-4 rounded-[2px] bg-ground/50 border border-rule space-y-2">
              <span className="text-xs font-semibold text-ink uppercase tracking-wider block">
                Target Missing Term / Answer
              </span>
              <input
                type="text"
                value={fillAnswer}
                onChange={(e) => setFillAnswer(e.target.value)}
                placeholder="e.g. Mitochondria"
                className="w-full px-3.5 py-2.5 rounded-[2px] bg-paper border border-rule text-ink focus:outline-none focus:border-ink transition text-xs font-mono font-semibold"
                required
              />
              <span className="text-[11px] text-ink-muted block font-mono">
                Tip: Make sure your prompt contains a blank line e.g. &quot;______&quot;.
              </span>
            </div>
          )}

          {/* 5. IDENTIFICATION */}
          {type === 'IDENTIFICATION' && (
            <div className="p-4 rounded-[2px] bg-ground/50 border border-rule space-y-2">
              <span className="text-xs font-semibold text-ink uppercase tracking-wider block">
                Correct Identified Term
              </span>
              <input
                type="text"
                value={identAnswer}
                onChange={(e) => setIdentAnswer(e.target.value)}
                placeholder="e.g. Photosynthesis"
                className="w-full px-3.5 py-2.5 rounded-[2px] bg-paper border border-rule text-ink focus:outline-none focus:border-ink transition text-xs font-mono font-semibold"
                required
              />
            </div>
          )}

          {/* 6. MATCHING */}
          {type === 'MATCHING' && (
            <div className="p-4 rounded-[2px] bg-ground/50 border border-rule space-y-3">
              <div className="flex items-center justify-between">
                <span className="text-xs font-semibold text-ink uppercase tracking-wider">
                  Matching Pairs (Column A ➔ Column B)
                </span>
                <button
                  type="button"
                  onClick={() => {
                    const nextNum = matchingPairs.length + 1;
                    const nextLetter = String.fromCharCode(64 + nextNum);
                    setMatchingPairs([...matchingPairs, { colA: `${nextNum}. Item ${nextNum}`, colB: `${nextLetter}. Match ${nextLetter}` }]);
                  }}
                  className="inline-flex items-center gap-1 text-[11px] font-mono text-ink hover:underline"
                >
                  <Plus className="w-3.5 h-3.5" />
                  <span>Add Pair</span>
                </button>
              </div>

              <div className="space-y-2">
                {matchingPairs.map((pair, idx) => (
                  <div key={idx} className="flex items-center gap-2">
                    <input
                      type="text"
                      value={pair.colA}
                      onChange={(e) => {
                        const updated = [...matchingPairs];
                        updated[idx].colA = e.target.value;
                        setMatchingPairs(updated);
                      }}
                      className="w-1/2 px-3 py-1.5 rounded-[2px] bg-paper border border-rule text-ink text-xs font-mono"
                      placeholder={`Column A #${idx + 1}`}
                    />
                    <span className="font-mono text-ink-muted text-xs">➔</span>
                    <input
                      type="text"
                      value={pair.colB}
                      onChange={(e) => {
                        const updated = [...matchingPairs];
                        updated[idx].colB = e.target.value;
                        setMatchingPairs(updated);
                      }}
                      className="w-1/2 px-3 py-1.5 rounded-[2px] bg-paper border border-rule text-ink text-xs font-mono"
                      placeholder={`Column B #${String.fromCharCode(65 + idx)}`}
                    />
                    {matchingPairs.length > 2 && (
                      <button
                        type="button"
                        onClick={() => setMatchingPairs(matchingPairs.filter((_, i) => i !== idx))}
                        className="p-1 text-ink-muted hover:text-signal transition"
                        title="Remove pair"
                      >
                        <Trash2 className="w-3.5 h-3.5" />
                      </button>
                    )}
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Metadata Row: Points, Concept, Difficulty */}
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
            <div>
              <label className="block text-xs font-semibold uppercase tracking-wider text-ink-muted mb-1">
                Points (Score)
              </label>
              <input
                type="number"
                min="1"
                max="100"
                value={maxPoints}
                onChange={(e) => setMaxPoints(Math.max(1, parseInt(e.target.value) || 10))}
                className="w-full px-3 py-2 rounded-[2px] bg-paper border border-rule text-ink text-xs font-mono font-bold"
              />
            </div>

            <div>
              <label className="block text-xs font-semibold uppercase tracking-wider text-ink-muted mb-1">
                Difficulty
              </label>
              <select
                value={difficulty}
                onChange={(e) => setDifficulty(e.target.value)}
                className="w-full px-3 py-2 rounded-[2px] bg-paper border border-rule text-ink text-xs font-mono"
              >
                <option value="EASY">EASY</option>
                <option value="MEDIUM">MEDIUM</option>
                <option value="HARD">HARD</option>
              </select>
            </div>

            <div>
              <label className="block text-xs font-semibold uppercase tracking-wider text-ink-muted mb-1">
                Concept Tested
              </label>
              <input
                type="text"
                value={conceptTested}
                onChange={(e) => setConceptTested(e.target.value)}
                placeholder="e.g. Thermodynamics"
                className="w-full px-3 py-2 rounded-[2px] bg-paper border border-rule text-ink text-xs"
              />
            </div>
          </div>

          {/* Scope Selector: Apply to all or single student */}
          <div className="p-3.5 rounded-[2px] bg-ground border border-rule space-y-2">
            <span className="text-xs font-semibold uppercase tracking-wider text-ink block font-mono">
              Application Scope
            </span>
            <div className="space-y-2">
              <label className="flex items-center gap-2.5 text-xs text-ink cursor-pointer">
                <input
                  type="radio"
                  name="applyScope"
                  checked={applyToAllStudents}
                  onChange={() => setApplyToAllStudents(true)}
                  className="w-4 h-4 text-ink focus:ring-0"
                />
                <div>
                  <span className="font-semibold block">Apply to ALL Candidates in this Assessment (Recommended)</span>
                  <span className="text-[11px] text-ink-muted block">
                    {isEditing
                      ? 'Replaces this question across every student’s exam set with this manual version.'
                      : 'Appends this question to every student’s exam set in the cohort.'}
                  </span>
                </div>
              </label>

              <label className="flex items-center gap-2.5 text-xs text-ink cursor-pointer pt-1 border-t border-rule/60">
                <input
                  type="radio"
                  name="applyScope"
                  checked={!applyToAllStudents}
                  onChange={() => setApplyToAllStudents(false)}
                  className="w-4 h-4 text-ink focus:ring-0"
                />
                <div>
                  <span className="font-semibold block">Apply ONLY to candidate: {studentName}</span>
                  <span className="text-[11px] text-ink-muted block">
                    Changes will only affect this individual student variant.
                  </span>
                </div>
              </label>
            </div>
          </div>

          {/* Action Buttons */}
          <div className="flex items-center justify-end gap-3 pt-3 border-t border-rule">
            <Button
              type="button"
              variant="secondary"
              size="md"
              onClick={onClose}
              disabled={isSubmitting}
            >
              Cancel
            </Button>
            <Button
              type="submit"
              variant="primary"
              size="md"
              disabled={isSubmitting}
              className="font-mono text-xs uppercase tracking-wider"
            >
              {isSubmitting ? (
                <>
                  <Loader2 className="w-3.5 h-3.5 mr-1.5 animate-spin" />
                  <span>Saving Question...</span>
                </>
              ) : (
                <span>{isEditing ? 'Save Question Changes' : 'Add Question to Exam'}</span>
              )}
            </Button>
          </div>
        </form>
      </div>
    </div>
  );
}
