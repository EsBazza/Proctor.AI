'use client';

import React, { useState } from 'react';
import { useRouter } from 'next/navigation';
import { 
  Plus, 
  Edit3, 
  Trash2, 
  CheckCircle2, 
  BrainCircuit, 
  Cpu, 
  FileText, 
  Sparkles, 
  HelpCircle,
  Columns,
  ListFilter
} from 'lucide-react';
import { Button } from '@/components/ui/Button';
import { QuestionEditorModal, QuestionData } from './QuestionEditorModal';
import { DeleteQuestionModal } from './DeleteQuestionModal';

interface TeacherQuestionListProps {
  examId: string;
  studentExamId: string;
  studentName: string;
  questions: QuestionData[];
}

export function TeacherQuestionList({
  examId,
  studentExamId,
  studentName,
  questions
}: TeacherQuestionListProps) {
  const router = useRouter();

  // Modals state
  const [editorOpen, setEditorOpen] = useState(false);
  const [editingQuestion, setEditingQuestion] = useState<QuestionData | null>(null);

  const [deleteOpen, setDeleteOpen] = useState(false);
  const [deletingQuestion, setDeletingQuestion] = useState<QuestionData | null>(null);

  const handleOpenAdd = () => {
    setEditingQuestion(null);
    setEditorOpen(true);
  };

  const handleOpenEdit = (q: QuestionData) => {
    setEditingQuestion(q);
    setEditorOpen(true);
  };

  const handleOpenDelete = (q: QuestionData) => {
    setDeletingQuestion(q);
    setDeleteOpen(true);
  };

  const handleRefresh = () => {
    router.refresh();
  };

  const totalPoints = questions.reduce((acc, q) => acc + (q.maxPoints || 0), 0);

  const getFormatLabel = (type: string) => {
    switch (type) {
      case 'MCQ': return 'Multiple Choice';
      case 'TRUE_FALSE': return 'True or False';
      case 'SHORT_ANSWER': return 'Short Answer';
      case 'ESSAY': return 'Essay Analysis';
      case 'FILL_IN_BLANK': return 'Fill in the Blank';
      case 'MATCHING': return 'Matching Type';
      case 'IDENTIFICATION': return 'Identification';
      default: return type;
    }
  };

  return (
    <div className="space-y-6">
      {/* Question Header & Controls */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-rule pb-4">
        <div>
          <h2 className="text-lg font-bold text-ink flex items-center gap-2">
            <Cpu className="w-5 h-5 text-ink" />
            <span>Questions &amp; Master Rubrics ({questions.length} Items)</span>
          </h2>
          <p className="text-xs text-ink-muted mt-0.5">
            Educators can manually add, edit, or remove questions across the exam or for this candidate.
          </p>
        </div>

        <div className="flex items-center gap-3">
          <span className="text-xs font-mono font-semibold text-ink-muted bg-ground px-3 py-1.5 rounded-[2px] border border-rule">
            Total Value: {totalPoints} pts
          </span>
          <Button
            type="button"
            variant="primary"
            size="sm"
            onClick={handleOpenAdd}
            className="font-mono text-xs uppercase tracking-wider"
          >
            <Plus className="w-3.5 h-3.5 mr-1" />
            <span>Add Question</span>
          </Button>
        </div>
      </div>

      {/* Empty State */}
      {questions.length === 0 ? (
        <div className="rounded-[2px] bg-paper border border-rule p-12 text-center space-y-3">
          <HelpCircle className="w-8 h-8 text-ink-muted mx-auto" />
          <h3 className="text-base font-semibold text-ink">No Questions in Assessment</h3>
          <p className="text-xs text-ink-muted max-w-sm mx-auto">
            Click &quot;Add Question&quot; to author manual questions across any of the 7 supported formats.
          </p>
          <Button
            type="button"
            variant="primary"
            size="sm"
            onClick={handleOpenAdd}
            className="font-mono text-xs uppercase"
          >
            <Plus className="w-3.5 h-3.5 mr-1" />
            <span>Add First Question</span>
          </Button>
        </div>
      ) : (
        <div className="space-y-5">
          {questions.map((q, idx) => {
            const isMCQ = q.type === 'MCQ';
            const isTF = q.type === 'TRUE_FALSE';
            const isMatching = q.type === 'MATCHING';
            const isFill = q.type === 'FILL_IN_BLANK';
            const isIdent = q.type === 'IDENTIFICATION';
            const isEssay = q.type === 'ESSAY';
            const isShort = q.type === 'SHORT_ANSWER';

            return (
              <div
                key={q.id || idx}
                className="rounded-[2px] bg-paper border border-rule p-6 space-y-4 shadow-sm hover:border-rule/80 transition group"
              >
                {/* Card Top Metadata & Action Buttons */}
                <div className="flex flex-wrap items-center justify-between gap-2 border-b border-rule/80 pb-3">
                  <div className="flex items-center gap-2 flex-wrap">
                    <span className="px-2.5 py-1 rounded-[2px] bg-ground border border-rule text-ink font-mono font-bold text-xs uppercase tracking-wider">
                      Question {q.questionIndex || idx + 1}
                    </span>
                    <span className="px-2 py-0.5 rounded-[2px] bg-ground text-ink text-xs font-semibold">
                      {getFormatLabel(q.type)}
                    </span>
                    {q.conceptTested && (
                      <span className="px-2 py-0.5 rounded-[2px] text-[11px] font-medium bg-ground/60 text-ink-muted">
                        Concept: {q.conceptTested}
                      </span>
                    )}
                  </div>

                  <div className="flex items-center gap-3">
                    <span className="px-2 py-0.5 rounded text-[10px] font-mono font-bold uppercase tracking-wider bg-ground text-ink">
                      {q.difficulty || 'MEDIUM'}
                    </span>
                    <span className="px-2.5 py-1 rounded-[2px] bg-ground border border-rule font-mono text-xs font-bold text-ink-muted">
                      {q.maxPoints} pts
                    </span>

                    {/* Edit & Delete Buttons */}
                    <div className="flex items-center gap-1.5 ml-1">
                      <button
                        type="button"
                        onClick={() => handleOpenEdit(q)}
                        className="inline-flex items-center gap-1 px-2.5 py-1 rounded-[2px] bg-ground hover:bg-ink hover:text-paper border border-rule text-ink text-xs transition font-mono"
                        title="Edit question prompt, options, format, or points"
                      >
                        <Edit3 className="w-3 h-3" />
                        <span>Edit</span>
                      </button>

                      <button
                        type="button"
                        onClick={() => handleOpenDelete(q)}
                        className="inline-flex items-center gap-1 px-2 py-1 rounded-[2px] bg-ground hover:bg-signal/10 hover:border-signal/40 border border-rule text-ink hover:text-signal text-xs transition font-mono"
                        title="Delete question"
                      >
                        <Trash2 className="w-3 h-3" />
                      </button>
                    </div>
                  </div>
                </div>

                {/* Question Prompt */}
                <p className="text-ink text-base font-semibold leading-relaxed">
                  {q.prompt}
                </p>

                {/* 1. MCQ Display */}
                {isMCQ && q.options && Array.isArray(q.options) && (
                  <div className="space-y-2 pt-1">
                    <div className="text-[11px] uppercase font-bold tracking-wider text-ink-muted mb-1 font-mono">
                      Answer Choices (Master Correct Choice Highlighted):
                    </div>
                    <div className="grid grid-cols-1 gap-2">
                      {q.options.map((opt: string, optIdx: number) => {
                        const isCorrectOption =
                          opt.trim().toLowerCase() === q.correctAnswer?.trim().toLowerCase() ||
                          opt.trim().toLowerCase().startsWith(q.correctAnswer?.trim().toLowerCase().charAt(0) + ')');

                        return (
                          <div
                            key={optIdx}
                            className={`p-3 rounded-[2px] border flex items-center justify-between text-xs transition ${
                              isCorrectOption
                                ? 'bg-emerald-950/20 border-emerald-500/40 text-emerald-900 font-semibold'
                                : 'bg-ground/40 border-rule text-ink'
                            }`}
                          >
                            <span className="leading-relaxed">{opt}</span>
                            {isCorrectOption && (
                              <span className="shrink-0 inline-flex items-center gap-1 px-2 py-0.5 rounded-full bg-emerald-500/20 text-verified text-[10px] font-bold">
                                <CheckCircle2 className="w-3.5 h-3.5 text-verified" />
                                <span>Correct Answer</span>
                              </span>
                            )}
                          </div>
                        );
                      })}
                    </div>
                  </div>
                )}

                {/* 2. TRUE_FALSE Display */}
                {isTF && (
                  <div className="space-y-2 pt-1">
                    <div className="text-[11px] uppercase font-bold tracking-wider text-ink-muted mb-1 font-mono">
                      Truth Value:
                    </div>
                    <div className="flex items-center gap-3">
                      {(['TRUE', 'FALSE'] as const).map((val) => {
                        const isCorrect = q.correctAnswer?.toUpperCase().includes(val);
                        return (
                          <div
                            key={val}
                            className={`px-4 py-2 rounded-[2px] border text-xs font-mono font-bold flex items-center gap-1.5 ${
                              isCorrect
                                ? 'bg-emerald-950/20 border-emerald-500/40 text-verified'
                                : 'bg-ground/40 border-rule text-ink-muted'
                            }`}
                          >
                            {isCorrect && <CheckCircle2 className="w-3.5 h-3.5 text-verified" />}
                            <span>{val}</span>
                          </div>
                        );
                      })}
                    </div>
                  </div>
                )}

                {/* 3. FILL_IN_BLANK & IDENTIFICATION Display */}
                {(isFill || isIdent) && (
                  <div className="rounded-[2px] bg-ground/50 border border-rule p-4 space-y-1.5 text-xs">
                    <div className="flex items-center gap-1.5 text-ink font-bold uppercase tracking-wider text-[11px] font-mono">
                      <CheckCircle2 className="w-4 h-4 text-verified" />
                      <span>Expected Term / Target Key:</span>
                    </div>
                    <p className="font-mono text-sm font-bold text-verified">
                      {q.correctAnswer}
                    </p>
                  </div>
                )}

                {/* 4. MATCHING TYPE Display */}
                {isMatching && q.options && typeof q.options === 'object' && (
                  <div className="space-y-2.5 pt-1">
                    <div className="text-[11px] uppercase font-bold tracking-wider text-ink-muted mb-1 font-mono">
                      Matching Columns &amp; Pairs:
                    </div>
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 text-xs">
                      <div className="p-3 rounded-[2px] bg-ground/40 border border-rule space-y-1.5">
                        <span className="font-bold text-ink uppercase tracking-wider text-[11px] block font-mono">Column A:</span>
                        {(q.options.columnA || []).map((item: string, i: number) => (
                          <div key={i} className="font-mono text-ink text-xs">{item}</div>
                        ))}
                      </div>
                      <div className="p-3 rounded-[2px] bg-ground/40 border border-rule space-y-1.5">
                        <span className="font-bold text-ink uppercase tracking-wider text-[11px] block font-mono">Column B:</span>
                        {(q.options.columnB || []).map((item: string, i: number) => (
                          <div key={i} className="font-mono text-ink text-xs">{item}</div>
                        ))}
                      </div>
                    </div>
                    <div className="p-2.5 rounded-[2px] bg-emerald-950/10 border border-emerald-500/30 text-xs font-mono text-verified">
                      <strong>Target Pairing:</strong> {q.correctAnswer}
                    </div>
                  </div>
                )}

                {/* 5. SHORT_ANSWER & ESSAY Display */}
                {(isShort || isEssay) && (
                  <div className="rounded-[2px] bg-paper border border-rule p-4 space-y-1.5 text-xs">
                    <div className="flex items-center gap-1.5 text-ink font-bold uppercase tracking-wider text-[11px]">
                      <BrainCircuit className="w-4 h-4 text-ink" />
                      <span>Master Grading Rubric &amp; Benchmark:</span>
                    </div>
                    <p className="text-ink leading-relaxed whitespace-pre-wrap pt-0.5">
                      {q.correctAnswer}
                    </p>
                  </div>
                )}
              </div>
            );
          })}
        </div>
      )}

      {/* Editor Modal */}
      <QuestionEditorModal
        isOpen={editorOpen}
        onClose={() => setEditorOpen(false)}
        examId={examId}
        studentExamId={studentExamId}
        studentName={studentName}
        existingQuestion={editingQuestion}
        onSuccess={handleRefresh}
      />

      {/* Delete Confirmation Modal */}
      {deletingQuestion && (
        <DeleteQuestionModal
          isOpen={deleteOpen}
          onClose={() => {
            setDeleteOpen(false);
            setDeletingQuestion(null);
          }}
          examId={examId}
          studentExamId={studentExamId}
          studentName={studentName}
          questionId={deletingQuestion.id || ''}
          questionIndex={deletingQuestion.questionIndex || 1}
          promptSnippet={deletingQuestion.prompt || ''}
          onSuccess={handleRefresh}
        />
      )}
    </div>
  );
}
