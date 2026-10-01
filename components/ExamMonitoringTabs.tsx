'use client';

import React, { useState } from 'react';
import Link from 'next/link';
import { 
  Tv, 
  List, 
  Radio, 
  Lock, 
  Eye 
} from 'lucide-react';
import { VeyonScreenGrid, StudentScreenItem } from '@/components/VeyonScreenGrid';
import { UnlockStudentButton } from '@/components/UnlockStudentButton';
import { CopyStudentLinkButton } from '@/components/CopyStudentLinkButton';
import { BadgeMarker } from '@/components/ui/BadgeMarker';

interface ExamMonitoringTabsProps {
  examId: string;
  students: StudentScreenItem[];
  maxStrikes?: number;
}

export function ExamMonitoringTabs({
  examId,
  students,
  maxStrikes = 2
}: ExamMonitoringTabsProps) {
  const activeStudentsCount = students.filter((s) => s.status === 'IN_PROGRESS').length;
  // Default to Veyon screen grid if there are active students, otherwise table
  const [viewMode, setViewMode] = useState<'grid' | 'table'>(activeStudentsCount > 0 ? 'grid' : 'grid');

  return (
    <div className="space-y-3">
      {/* View Switcher Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2.5 pb-1">
        <div className="flex items-center gap-2">
          <div className="flex items-center gap-1 p-1 rounded-[2px] bg-paper border border-rule">
            <button
              type="button"
              onClick={() => setViewMode('grid')}
              className={`flex items-center gap-2 px-3 py-1.5 rounded-[2px] text-xs font-semibold transition ${
                viewMode === 'grid'
                  ? 'bg-ink text-paper shadow-sm'
                  : 'text-ink-muted hover:text-ink'
              }`}
            >
              <Tv className="w-3.5 h-3.5" />
              <span>Veyon Screen Grid</span>
              {activeStudentsCount > 0 && (
                <span className="flex items-center gap-1 px-1.5 py-0.2 rounded-full text-[10px] font-mono bg-emerald-500/20 text-emerald-300">
                  <Radio className="w-2 h-2 animate-pulse text-emerald-400" />
                  {activeStudentsCount} Live
                </span>
              )}
            </button>

            <button
              type="button"
              onClick={() => setViewMode('table')}
              className={`flex items-center gap-2 px-3 py-1.5 rounded-[2px] text-xs font-semibold transition ${
                viewMode === 'table'
                  ? 'bg-ink text-paper shadow-sm'
                  : 'text-ink-muted hover:text-ink'
              }`}
            >
              <List className="w-3.5 h-3.5" />
              <span>Candidate Roster Table</span>
              <span className="px-1.5 py-0.2 rounded text-[10px] font-mono bg-ground text-ink-muted">
                {students.length}
              </span>
            </button>
          </div>
        </div>

        <div className="text-[11px] font-mono text-ink-muted">
          {viewMode === 'grid' 
            ? 'Monitoring active candidate monitors in 30s intervals' 
            : `${students.length} Candidates Enrolled`}
        </div>
      </div>

      {/* VIEW 1: VEYON SCREEN GRID */}
      {viewMode === 'grid' ? (
        <VeyonScreenGrid
          examId={examId}
          initialStudents={students}
          maxStrikes={maxStrikes}
        />
      ) : (
        /* VIEW 2: CANDIDATE ROSTER TABLE */
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
                      {student.studentEmail || 'Registered Candidate'}
                    </div>
                  </td>

                  <td className="py-3 px-3 whitespace-nowrap">
                    {student.status === 'PENDING' && (
                      <span className="text-ink-muted">Ready</span>
                    )}
                    {student.status === 'IN_PROGRESS' && (
                      <span className="text-emerald-400 font-semibold flex items-center gap-1.5">
                        <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-pulse" />
                        <span>In Progress</span>
                      </span>
                    )}
                    {student.status === 'LOCKED' && (
                      <div className="space-y-1">
                        <span className="text-signal font-semibold flex items-center gap-1">
                          <Lock className="w-3 h-3" />
                          <span>LOCKED ({student.strikeCount || maxStrikes}/{maxStrikes})</span>
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
                    {(student as any).totalScore !== null && (student as any).totalScore !== undefined
                      ? `${(student as any).totalScore} / ${(student as any).maxPossibleScore || 100} pts`
                      : '—'}
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
                      {(student as any).accessToken && (
                        <CopyStudentLinkButton
                          accessToken={(student as any).accessToken}
                          studentName={student.studentName}
                        />
                      )}
                      <Link
                        href={`/teacher/exam/${examId}/preview?studentId=${student.id}`}
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
      )}
    </div>
  );
}
