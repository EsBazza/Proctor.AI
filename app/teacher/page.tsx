import React from 'react';
import Link from 'next/link';
import { getAllExamsAction } from '@/actions/exam';
import { Plus, ArrowRight } from 'lucide-react';
import { DeleteExamButton } from '@/components/DeleteExamButton';
import { Button } from '@/components/ui/Button';

export const dynamic = 'force-dynamic';

export default async function TeacherDashboardPage() {
  const result = await getAllExamsAction();
  const exams = result.success && result.exams ? result.exams : [];

  const totalExams = exams.length;
  // Estimated 12 minutes saved per enrolled student / exam generated
  const estimatedHoursSaved = (totalExams * 1.8).toFixed(1);

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 space-y-6">
      {/* Operations Ledger Header */}
      <div className="flex flex-col sm:flex-row sm:items-baseline justify-between gap-4 border-b border-rule pb-5">
        <div className="space-y-1">
          <div className="font-mono text-xs uppercase tracking-widest text-ink-muted">
            PatunAI Assessment Operations
          </div>
          <h1 className="text-2xl font-semibold tracking-tight text-ink">
            Teacher Operations Ledger
          </h1>
          <p className="text-xs text-ink-muted font-mono pt-0.5">
            Active assessments: {totalExams} | Est. {estimatedHoursSaved} hours grading fatigue saved
          </p>
        </div>

        <Link href="/teacher/create">
          <Button variant="primary" size="md" className="font-mono text-xs uppercase tracking-wider">
            <Plus className="w-3.5 h-3.5 mr-1.5" />
            <span>New Assessment</span>
          </Button>
        </Link>
      </div>

      {/* Operations Table */}
      {exams.length === 0 ? (
        <div className="rounded-[2px] bg-paper border border-rule p-12 text-center space-y-3">
          <div className="font-mono text-xs uppercase tracking-wider text-ink-muted">
            No Assessments Configured
          </div>
          <h3 className="text-base font-semibold text-ink">Assessment Roster Empty</h3>
          <p className="text-xs text-ink-muted max-w-md mx-auto leading-relaxed">
            Upload teaching materials or syllabi to generate cryptographically seeded isomorphic exam variants for your Google Classroom roster.
          </p>
          <div className="pt-2">
            <Link href="/teacher/create">
              <Button variant="primary" size="sm" className="font-mono text-xs uppercase tracking-wider">
                <Plus className="w-3.5 h-3.5 mr-1.5" />
                <span>Create Assessment</span>
              </Button>
            </Link>
          </div>
        </div>
      ) : (
        <div className="border border-rule rounded-[2px] bg-paper overflow-x-auto">
          <table className="w-full text-left border-collapse text-xs">
            <thead>
              <tr className="border-b border-rule bg-ground font-mono text-[11px] uppercase tracking-wider text-ink-muted">
                <th className="py-3 px-4 font-semibold">Access Code</th>
                <th className="py-3 px-4 font-semibold">Assessment Title</th>
                <th className="py-3 px-4 font-semibold">Subject</th>
                <th className="py-3 px-4 font-semibold">Duration</th>
                <th className="py-3 px-4 font-semibold">Language</th>
                <th className="py-3 px-4 font-semibold">Created</th>
                <th className="py-3 px-4 text-right font-semibold">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-rule">
              {exams.map((exam) => (
                <tr
                  key={exam.id}
                  className="hover:bg-ground/50 transition-colors group"
                >
                  <td className="py-3 px-4 font-mono font-semibold text-ink whitespace-nowrap">
                    {exam.accessCode}
                  </td>
                  <td className="py-3 px-4">
                    <div className="font-medium text-ink">{exam.title}</div>
                    <div className="text-[11px] text-ink-muted line-clamp-1 max-w-md">
                      {exam.lessonContent}
                    </div>
                  </td>
                  <td className="py-3 px-4 font-mono text-ink-muted whitespace-nowrap">
                    {exam.subject}
                  </td>
                  <td className="py-3 px-4 font-mono text-ink tabular-nums whitespace-nowrap">
                    {exam.durationMinutes} min
                  </td>
                  <td className="py-3 px-4 font-mono text-ink-muted uppercase whitespace-nowrap">
                    {exam.language}
                  </td>
                  <td className="py-3 px-4 font-mono text-ink-muted whitespace-nowrap">
                    {new Date(exam.createdAt).toLocaleDateString([], { month: 'short', day: 'numeric', year: 'numeric' })}
                  </td>
                  <td className="py-3 px-4 text-right whitespace-nowrap">
                    <div className="flex items-center justify-end gap-2">
                      <Link
                        href={`/teacher/exam/${exam.id}`}
                        className="inline-flex items-center gap-1 px-2.5 py-1 rounded-[2px] bg-paper border border-rule hover:border-ink/40 text-ink font-mono text-xs font-medium transition-colors"
                      >
                        <span>Live Monitor</span>
                        <ArrowRight className="w-3 h-3" />
                      </Link>
                      <DeleteExamButton
                        examId={exam.id}
                        examTitle={exam.title}
                      />
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}
