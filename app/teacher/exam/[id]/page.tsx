import React from 'react';
import Link from 'next/link';
import { notFound } from 'next/navigation';
import { getExamDetailsAction } from '@/actions/exam';
import { CohortAnalytics } from '@/components/CohortAnalytics';
import { 
  ArrowLeft,
  Eye,
  Lock
} from 'lucide-react';
import { PublishToClassroomButton } from '@/components/PublishToClassroomButton';
import { ReleaseGradesButton } from '@/components/ReleaseGradesButton';
import { UnlockStudentButton } from '@/components/UnlockStudentButton';
import { ForensicSnapshotViewer } from '@/components/ForensicSnapshotViewer';
import { DeleteExamButton } from '@/components/DeleteExamButton';
import { CopyButton } from '@/components/CopyButton';
import { CopyStudentLinkButton } from '@/components/CopyStudentLinkButton';
import { ShareExamModal } from '@/components/ShareExamModal';
import { AdjustLockoutModal } from '@/components/AdjustLockoutModal';
import { BadgeMarker } from '@/components/ui/BadgeMarker';
import { Button } from '@/components/ui/Button';

export const dynamic = 'force-dynamic';

export default async function TeacherExamMonitorPage({
  params
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  const result = await getExamDetailsAction(id);

  if (!result.success || !result.exam) {
    notFound();
  }

  const { exam, students = [], integrityLogs = [], analytics } = result;

  const submittedCount = students.filter(
    (s) => s.status === 'SUBMITTED' || s.status === 'FLAGGED'
  ).length;

  const gradedCount = students.filter(
    (s) => s.totalScore !== null && s.totalScore !== undefined
  ).length;

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 space-y-6">
      {/* Flight Board Header */}
      <div className="space-y-4 border-b border-rule pb-5">
        <Link
          href="/teacher"
          className="inline-flex items-center gap-1.5 text-xs text-ink-muted hover:text-ink transition-colors font-mono uppercase tracking-wider"
        >
          <ArrowLeft className="w-3.5 h-3.5" />
          <span>Return to Operations Ledger</span>
        </Link>

        <div className="flex flex-col lg:flex-row lg:items-baseline justify-between gap-4">
          <div className="space-y-1">
            <div className="flex items-center gap-2 font-mono text-xs text-ink-muted flex-wrap">
              <span className="font-semibold text-ink uppercase tracking-wider">
                {exam.subject}
              </span>
              <span>/</span>
              {exam.googleCourseName && (
                <>
                  <span className="text-ink">Google Classroom: {exam.googleCourseName}</span>
                  <span>/</span>
                </>
              )}
              <span className="uppercase">{exam.language}</span>
              <span>/</span>
              <span>{exam.durationMinutes} Minutes</span>
            </div>
            <h1 className="text-2xl font-semibold tracking-tight text-ink">
              {exam.title}
            </h1>
          </div>

          {/* Quick Metrics Bar */}
          <div className="flex flex-wrap items-center gap-3">
            <div className="flex items-center gap-4 bg-paper border border-rule rounded-[2px] px-4 py-2 text-xs font-mono">
              <div className="flex items-center gap-2">
                <div>
                  <div className="text-[10px] uppercase text-ink-muted">Access PIN</div>
                  <div className="text-base font-semibold text-ink tracking-widest">{exam.accessCode}</div>
                </div>
                <CopyButton
                  text={exam.accessCode}
                  iconOnly
                  title="Copy 6-digit exam Access PIN"
                  className="p-1 rounded-[2px] hover:bg-ground text-ink-muted hover:text-ink"
                />
              </div>
              <div className="h-7 w-px bg-rule" />
              <div>
                <div className="text-[10px] uppercase text-ink-muted">Progress</div>
                <div className="text-base font-semibold text-ink tabular-nums">{submittedCount} / {students.length}</div>
              </div>
            </div>

            <ShareExamModal exam={exam} students={students} />

            <AdjustLockoutModal examId={exam.id} currentMaxStrikes={exam.maxStrikes || 2} />

            <Link href={`/teacher/exam/${exam.id}/preview`}>
              <Button variant="secondary" size="md" className="font-mono text-xs">
                <Eye className="w-3.5 h-3.5 mr-1.5" />
                <span>Manage &amp; Edit Questions</span>
              </Button>
            </Link>

            {exam.googleCourseId && (
              <>
                <PublishToClassroomButton
                  examId={exam.id}
                  hasCourseWork={!!exam.googleCourseWorkId}
                  googleCourseName={exam.googleCourseName}
                />
                <ReleaseGradesButton
                  examId={exam.id}
                  hasGoogleClassroom={!!exam.googleCourseId}
                  gradedCount={gradedCount}
                />
              </>
            )}

            <DeleteExamButton
              examId={exam.id}
              examTitle={exam.title}
              hasGoogleClassroom={!!exam.googleCourseId}
              variant="full"
              redirectOnDelete
            />
          </div>
        </div>
      </div>

      {/* Roster & Live Integrity Split */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
        {/* Student Roster Table (8 cols) */}
        <div className="lg:col-span-8 space-y-3">
          <div className="flex items-center justify-between font-mono text-xs">
            <h2 className="font-semibold text-ink uppercase tracking-wider">
              Enrolled Candidate Flight Board
            </h2>
            <span className="text-ink-muted">{students.length} Candidates Enrolled</span>
          </div>

          <div className="border border-rule rounded-[2px] bg-paper overflow-x-auto">
            <table className="w-full text-left border-collapse text-xs">
              <thead>
                <tr className="border-b border-rule bg-ground font-mono text-[11px] uppercase tracking-wider text-ink-muted">
                  <th className="py-2.5 px-3.5 font-semibold">Candidate</th>
                  <th className="py-2.5 px-3 font-semibold">Status</th>
                  <th className="py-2.5 px-3 font-semibold">Score</th>
                  <th className="py-2.5 px-3 font-semibold">Integrity</th>
                  <th className="py-2.5 px-3.5 text-right font-semibold">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-rule font-mono">
                {students.map((student) => (
                  <tr key={student.id} className="hover:bg-ground/40 transition-colors">
                    <td className="py-3 px-3.5 font-sans">
                      <div className="font-medium text-ink">{student.studentName}</div>
                      <div className="text-[11px] text-ink-muted font-mono mt-0.5">
                        {student.studentEmail || `Seed PIN: ${student.accessCode}`}
                      </div>
                    </td>

                    <td className="py-3 px-3 whitespace-nowrap">
                      {student.status === 'PENDING' && (
                        <span className="text-ink-muted">Ready</span>
                      )}
                      {student.status === 'IN_PROGRESS' && (
                        <span className="text-ink font-semibold">In Progress</span>
                      )}
                      {student.status === 'LOCKED' && (
                        <div className="space-y-1">
                          <span className="text-signal font-semibold flex items-center gap-1">
                            <Lock className="w-3 h-3" />
                            <span>LOCKED ({student.strikeCount || exam.maxStrikes || 2}/{exam.maxStrikes || 2})</span>
                          </span>
                          <div>
                            <UnlockStudentButton studentExamId={student.id} studentName={student.studentName} />
                          </div>
                        </div>
                      )}
                      {student.status === 'SUBMITTED' && (
                        <span className="text-verified font-medium">Submitted</span>
                      )}
                      {student.status === 'FLAGGED' && (
                        <span className="text-signal font-semibold">Flagged</span>
                      )}
                    </td>

                    <td className="py-3 px-3 font-semibold text-ink tabular-nums whitespace-nowrap">
                      {student.totalScore !== null ? `${student.totalScore} / ${student.maxPossibleScore} pts` : '—'}
                    </td>

                    <td className="py-3 px-3 whitespace-nowrap">
                      {student.integrityAlertsCount > 0 ? (
                        <BadgeMarker level="suspicious" label={`${student.integrityAlertsCount} Alert(s)`} />
                      ) : (
                        <BadgeMarker level="verified" label="Clean" />
                      )}
                    </td>

                    <td className="py-3 px-3.5 text-right whitespace-nowrap">
                      <div className="flex items-center justify-end gap-1.5">
                        <CopyStudentLinkButton
                          accessToken={student.accessToken}
                          studentName={student.studentName}
                        />
                        <Link
                          href={`/teacher/exam/${exam.id}/preview?studentId=${student.id}`}
                          className="inline-flex items-center gap-1 px-2 py-1 rounded-[2px] bg-paper border border-rule hover:border-ink/40 text-ink text-[11px] transition-colors"
                          title="Inspect question variant"
                        >
                          <Eye className="w-3 h-3 text-ink-muted" />
                          <span>Variant</span>
                        </Link>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>

        {/* Live Integrity Incident Feed (4 cols) */}
        <div className="lg:col-span-4 space-y-3">
          <div className="flex items-center justify-between font-mono text-xs">
            <h2 className="font-semibold text-ink uppercase tracking-wider">
              Forensic Log Stream
            </h2>
            <span className="text-ink-muted">{integrityLogs.length} Events</span>
          </div>

          <div className="border border-rule rounded-[2px] bg-paper p-3.5 max-h-[580px] overflow-y-auto">
            <ForensicSnapshotViewer logs={integrityLogs} />
          </div>
        </div>
      </div>

      {/* Cohort Analytics & Equivalence */}
      <div className="pt-6 border-t border-rule space-y-4">
        <div className="font-mono text-xs uppercase tracking-wider text-ink-muted">
          Cohort Mastery &amp; Performance Distribution
        </div>
        <CohortAnalytics
          analytics={analytics}
          totalStudents={students.length}
          submittedCount={submittedCount}
        />
      </div>
    </div>
  );
}
