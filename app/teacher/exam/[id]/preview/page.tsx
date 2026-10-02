import React from 'react';
import Link from 'next/link';
import { notFound } from 'next/navigation';
import { getTeacherExamPreviewAction } from '@/actions/exam';
import { 
  ArrowLeft, 
  ChevronLeft, 
  ChevronRight, 
  ExternalLink, 
  Eye, 
  GraduationCap, 
  Key, 
  ShieldCheck, 
  Users,
  Clock,
  Globe,
  Shield
} from 'lucide-react';
import { CopyStudentLinkButton } from '@/components/CopyStudentLinkButton';
import { TeacherQuestionList } from '@/components/TeacherQuestionList';

export const dynamic = 'force-dynamic';

export default async function TeacherExamPreviewPage({
  params,
  searchParams
}: {
  params: Promise<{ id: string }>;
  searchParams: Promise<{ studentId?: string }>;
}) {
  const { id } = await params;
  const { studentId } = await searchParams;

  const result = await getTeacherExamPreviewAction(id, studentId);

  if (!result.success || !result.exam || !result.selectedStudent) {
    notFound();
  }

  const { exam, students = [], selectedStudent, questions = [] } = result;

  // Find index of currently selected student
  const currentIndex = students.findIndex((s) => s.id === selectedStudent.id);
  const prevStudent = currentIndex > 0 ? students[currentIndex - 1] : null;
  const nextStudent = currentIndex < students.length - 1 ? students[currentIndex + 1] : null;

  return (
    <div className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8 py-10 space-y-8">
      {/* Top Navigation & Breadcrumbs */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-rule pb-5">
        <Link
          href={`/teacher/exam/${exam.id}`}
          className="inline-flex items-center gap-2 text-xs font-semibold text-ink-muted hover:text-ink transition"
        >
          <ArrowLeft className="w-4 h-4" />
          <span>Back to Live Monitor</span>
        </Link>

        {exam.googleCourseWorkUrl && (
          <a
            href={exam.googleCourseWorkUrl}
            target="_blank"
            rel="noopener noreferrer"
            className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-[2px] bg-emerald-500/10 hover:bg-emerald-500/20 text-verified border border-emerald-500/30 text-xs font-semibold transition"
          >
            <GraduationCap className="w-4 h-4 text-verified" />
            <span>View in Google Classroom</span>
            <ExternalLink className="w-3 h-3 ml-0.5" />
          </a>
        )}
      </div>

      {/* Exam Header */}
      <div className="rounded-[2px] bg-paper border border-rule p-6 sm:p-8 shadow-xl space-y-4">
        <div className="flex flex-wrap items-center gap-2">
          <span className="px-2.5 py-1 rounded-md bg-ground border border-rule text-ink text-xs font-mono font-semibold">
            {exam.subject}
          </span>
          <span className="px-2.5 py-1 rounded-md bg-ground border border-rule text-ink text-xs flex items-center gap-1">
            <Globe className="w-3.5 h-3.5 text-ink-muted" />
            <span>{exam.language}</span>
          </span>
          <span className="px-2.5 py-1 rounded-md bg-ground border border-rule text-ink text-xs flex items-center gap-1">
            <Clock className="w-3.5 h-3.5 text-ink-muted" />
            <span>{exam.durationMinutes} min</span>
          </span>
          <span className="px-2.5 py-1 rounded-md bg-ground border border-rule text-ink text-xs flex items-center gap-1 font-mono">
            <Shield className="w-3.5 h-3.5 text-signal" />
            <span>Policy: {exam.maxStrikes || 2} Flags</span>
          </span>
          <div className="ml-auto flex items-center gap-1.5 px-3 py-1 rounded-md bg-ground border border-rule text-ink font-mono text-xs font-bold">
            <Key className="w-3.5 h-3.5 text-amber-400" />
            <span>Access Code: {exam.accessCode}</span>
          </div>
        </div>

        <div>
          <div className="flex items-center gap-2 text-ink text-xs font-bold uppercase tracking-wider mb-1">
            <Eye className="w-4 h-4" />
            <span>Teacher Exam Variant Inspection</span>
          </div>
          <h1 className="text-2xl sm:text-3xl font-extrabold text-ink tracking-tight">
            {exam.title}
          </h1>
        </div>

        {/* Safe Inspection Notice */}
        <div className="p-3.5 rounded-[2px] bg-ground border border-rule flex items-center gap-3 text-xs text-ink-muted">
          <ShieldCheck className="w-4 h-4 text-verified shrink-0" />
          <span>
            <strong>Safe Educator Preview:</strong> Viewing student variants on this page is read-only. It does not start timers, mark exams in progress, or log integrity events.
          </span>
        </div>
      </div>

      {/* Student Variant Switcher Bar */}
      <div className="rounded-[2px] bg-paper border border-rule p-5 space-y-4 shadow-lg">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
          <div className="flex items-center gap-2">
            <Users className="w-4 h-4 text-ink" />
            <span className="text-xs font-bold uppercase tracking-wider text-ink">
              Select Student Variant ({currentIndex + 1} of {students.length}):
            </span>
          </div>

          <div className="flex items-center gap-2">
            {prevStudent ? (
              <Link
                href={`/teacher/exam/${exam.id}/preview?studentId=${prevStudent.id}`}
                className="inline-flex items-center gap-1 px-3 py-1.5 rounded-[2px] bg-ground hover:bg-slate-700 text-ink hover:text-ink text-xs font-medium transition"
              >
                <ChevronLeft className="w-3.5 h-3.5" />
                <span>Prev</span>
              </Link>
            ) : (
              <span className="inline-flex items-center gap-1 px-3 py-1.5 rounded-[2px] bg-ground text-slate-600 text-xs font-medium cursor-not-allowed">
                <ChevronLeft className="w-3.5 h-3.5" />
                <span>Prev</span>
              </span>
            )}

            {nextStudent ? (
              <Link
                href={`/teacher/exam/${exam.id}/preview?studentId=${nextStudent.id}`}
                className="inline-flex items-center gap-1 px-3 py-1.5 rounded-[2px] bg-ground hover:bg-slate-700 text-ink hover:text-ink text-xs font-medium transition"
              >
                <span>Next</span>
                <ChevronRight className="w-3.5 h-3.5" />
              </Link>
            ) : (
              <span className="inline-flex items-center gap-1 px-3 py-1.5 rounded-[2px] bg-ground text-slate-600 text-xs font-medium cursor-not-allowed">
                <span>Next</span>
                <ChevronRight className="w-3.5 h-3.5" />
              </span>
            )}
          </div>
        </div>

        {/* Student Pills Carousel / Wrap */}
        <div className="flex items-center gap-2 overflow-x-auto pb-1 pt-1 no-scrollbar">
          {students.map((st) => {
            const isSelected = st.id === selectedStudent.id;
            return (
              <Link
                key={st.id}
                href={`/teacher/exam/${exam.id}/preview?studentId=${st.id}`}
                className={`px-3.5 py-2 rounded-[2px] text-xs font-medium whitespace-nowrap transition flex items-center gap-2 border shrink-0 ${
                  isSelected
                    ? 'bg-ink text-paper border-ink font-semibold'
                    : 'bg-paper text-ink border-rule hover:bg-ground/60'
                }`}
              >
                <span>{st.studentName}</span>
                {st.status === 'SUBMITTED' && (
                  <span className="w-1.5 h-1.5 rounded-full bg-emerald-400" />
                )}
                {st.status === 'IN_PROGRESS' && (
                  <span className="w-1.5 h-1.5 rounded-full bg-blue-400 animate-pulse" />
                )}
              </Link>
            );
          })}
        </div>
      </div>

      {/* Active Student Variant Banner */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between p-5 rounded-[2px] bg-paper border border-rule gap-4">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-[2px] bg-ink text-paper flex items-center justify-center font-bold text-sm uppercase shrink-0">
            {selectedStudent.studentName.charAt(0)}
          </div>
          <div>
            <div className="text-ink font-bold text-sm sm:text-base">
              Personalized Isomorphic Variant for: {selectedStudent.studentName}
            </div>
            {selectedStudent.studentEmail && (
              <div className="text-ink-muted font-mono text-xs">
                {selectedStudent.studentEmail}
              </div>
            )}
          </div>
        </div>

        <div className="flex flex-wrap items-center gap-2 sm:justify-end">
          {/* Unique Student PIN */}
          <div className="flex items-center gap-1.5 px-3 py-1.5 rounded-[2px] bg-ground border border-rule text-ink font-mono text-xs font-bold">
            <Key className="w-3.5 h-3.5 text-amber-400" />
            <span>Student PIN: {selectedStudent.accessCode}</span>
          </div>

          {/* Student Direct Link */}
          <CopyStudentLinkButton
            accessToken={selectedStudent.accessToken}
            studentName={selectedStudent.studentName}
          />

          <a
            href={`/exam/${selectedStudent.accessToken}`}
            target="_blank"
            rel="noopener noreferrer"
            className="inline-flex items-center gap-1 px-3 py-1.5 rounded-[2px] bg-ground hover:bg-slate-700 text-ink border border-rule text-xs font-medium transition"
            title="Open student exam link in new tab"
          >
            <span>Direct Link</span>
            <ExternalLink className="w-3 h-3 text-ink-muted" />
          </a>

          {/* Individual Classroom CourseWork Link if available */}
          {selectedStudent.googleCourseWorkUrl && (
            <a
              href={selectedStudent.googleCourseWorkUrl}
              target="_blank"
              rel="noopener noreferrer"
              className="inline-flex items-center gap-1 px-3 py-1.5 rounded-[2px] bg-emerald-500/10 hover:bg-emerald-500/20 text-verified border border-emerald-500/30 text-xs font-semibold transition"
            >
              <GraduationCap className="w-3.5 h-3.5 text-verified" />
              <span>Student Classroom Post</span>
              <ExternalLink className="w-3 h-3 ml-0.5" />
            </a>
          )}

          <span className="px-2.5 py-1.5 rounded-[2px] text-xs font-semibold bg-paper border border-rule text-ink font-mono">
            {selectedStudent.status}
          </span>
        </div>
      </div>

      {/* Question Variant Cards & Educator Editing Engine */}
      <TeacherQuestionList
        examId={exam.id}
        studentExamId={selectedStudent.id}
        studentName={selectedStudent.studentName}
        questions={questions}
      />

      {/* Bottom Navigation */}
      <div className="flex items-center justify-between pt-6 border-t border-rule">
        <Link
          href={`/teacher/exam/${exam.id}`}
          className="inline-flex items-center gap-2 px-5 py-2.5 rounded-[2px] bg-ground hover:bg-slate-700 text-ink text-xs font-semibold transition"
        >
          <ArrowLeft className="w-4 h-4" />
          <span>Return to Live Monitor</span>
        </Link>

        {nextStudent && (
          <Link
            href={`/teacher/exam/${exam.id}/preview?studentId=${nextStudent.id}`}
            className="inline-flex items-center gap-2 px-5 py-2.5 rounded-[2px] bg-ink hover:bg-ink/90 text-paper text-xs font-mono uppercase tracking-wider font-semibold transition-colors"
          >
            <span>Inspect Next Student ({nextStudent.studentName})</span>
            <ChevronRight className="w-4 h-4" />
          </Link>
        )}
      </div>
    </div>
  );
}
