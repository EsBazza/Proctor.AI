'use client';

import React, { useState, useEffect, useRef, useCallback } from 'react';
import { 
  Monitor, 
  Maximize2, 
  Minimize2, 
  RefreshCw, 
  Lock, 
  AlertTriangle, 
  Eye, 
  Radio, 
  X, 
  ExternalLink,
  Tv,
  ZoomIn,
  ZoomOut,
  RotateCcw
} from 'lucide-react';
import Link from 'next/link';
import { 
  getLiveExamScreensAction, 
  setStudentWatchModeAction, 
  getSingleStudentLiveScreenAction 
} from '@/actions/exam';
import { UnlockStudentButton } from '@/components/UnlockStudentButton';
import { getSupabaseClient } from '@/lib/supabase';
import { FormattedTime } from '@/components/ui/FormattedTime';

export interface StudentScreenItem {
  id: string;
  studentName: string;
  studentEmail?: string | null;
  accessToken?: string | null;
  status: string;
  latestScreenFrame?: string | null;
  lastActiveAt?: string | null;
  currentQuestion?: number | null;
  strikeCount?: number;
  integrityAlertsCount?: number;
  isBeingWatched?: boolean;
  totalScore?: number | null;
  maxPossibleScore?: number;
}

interface VeyonScreenGridProps {
  examId: string;
  initialStudents: StudentScreenItem[];
  maxStrikes?: number;
}

export function VeyonScreenGrid({
  examId,
  initialStudents,
  maxStrikes = 2
}: VeyonScreenGridProps) {
  const [students, setStudents] = useState<StudentScreenItem[]>(initialStudents);
  const [isRefreshing, setIsRefreshing] = useState(false);
  const [secondsUntilRefresh, setSecondsUntilRefresh] = useState(15);
  const [statusFilter, setStatusFilter] = useState<'ALL' | 'IN_PROGRESS' | 'LOCKED' | 'FLAGGED'>('ALL');
  
  // Focused student live inspection state
  const [inspectedStudentId, setInspectedStudentId] = useState<string | null>(null);
  const [focusedStudent, setFocusedStudent] = useState<StudentScreenItem | null>(null);
  const [isFullscreenModal, setIsFullscreenModal] = useState(false);
  const [zoomLevel, setZoomLevel] = useState<number>(1);

  // Realtime Socket & Canvas Telemetry State
  const canvasRef = useRef<HTMLCanvasElement | null>(null);
  const inspectChannelRef = useRef<ReturnType<NonNullable<ReturnType<typeof getSupabaseClient>>['channel']> | null>(null);
  const lastFrameSeqRef = useRef<number>(0);
  const lastFrameTimeRef = useRef<number>(0);
  const [frameAge, setFrameAge] = useState<number>(0);
  const [resolutionText, setResolutionText] = useState<string>('1280x720');
  const [streamState, setStreamState] = useState<'LIVE' | 'DELAYED' | 'STALE' | 'OFFLINE'>('LIVE');
  const [isNudgeOpen, setIsNudgeOpen] = useState(false);
  const [nudgeToast, setNudgeToast] = useState<string | null>(null);

  // Background 15-second grid sweep
  const fetchAllScreens = useCallback(async () => {
    setIsRefreshing(true);
    try {
      const res = await getLiveExamScreensAction(examId);
      if (res.success && res.screens) {
        setStudents(res.screens);
      }
    } catch (err) {
      console.warn('Error refreshing screens:', err);
    } finally {
      setIsRefreshing(false);
      setSecondsUntilRefresh(15);
    }
  }, [examId]);

  // 15-second periodic grid polling
  useEffect(() => {
    const countdown = setInterval(() => {
      setSecondsUntilRefresh((prev) => {
        if (prev <= 1) {
          fetchAllScreens();
          return 15;
        }
        return prev - 1;
      });
    }, 1000);

    return () => clearInterval(countdown);
  }, [fetchAllScreens]);

  // Paint Base64 frame onto canvas atomically using HTMLImageElement
  const paintFrameToCanvas = useCallback((frameDataUrl: string) => {
    if (!frameDataUrl) return;
    try {
      const img = new Image();
      img.onload = () => {
        if (canvasRef.current) {
          const canvas = canvasRef.current;
          const targetW = img.naturalWidth || 1280;
          const targetH = img.naturalHeight || 720;
          if (canvas.width !== targetW || canvas.height !== targetH) {
            canvas.width = targetW;
            canvas.height = targetH;
          }
          const ctx = canvas.getContext('2d');
          if (ctx) {
            ctx.drawImage(img, 0, 0);
          }
        }
        lastFrameTimeRef.current = Date.now();
        setResolutionText(`${img.naturalWidth || 1280}x${img.naturalHeight || 720}`);
        setStreamState('LIVE');
      };
      img.src = frameDataUrl;
    } catch {
      // Non-blocking canvas paint fallback
    }
  }, []);

  // Automatically paint whenever focusedStudent.latestScreenFrame is updated
  useEffect(() => {
    if (focusedStudent?.latestScreenFrame) {
      paintFrameToCanvas(focusedStudent.latestScreenFrame);
    }
  }, [focusedStudent?.latestScreenFrame, paintFrameToCanvas]);

  // Handle opening live inspection modal for a specific student
  const handleOpenInspect = useCallback(async (student: StudentScreenItem) => {
    const startTime = Date.now();
    setInspectedStudentId(student.id);
    setFocusedStudent(student);
    setZoomLevel(1);
    lastFrameSeqRef.current = 0;
    lastFrameTimeRef.current = startTime;
    setFrameAge(0);
    setStreamState('LIVE');

    // 1. Tell student client to accelerate frame stream via DB fallback
    setStudentWatchModeAction(student.id, true);

    // 2. Connect to private Supabase Realtime channel for instant sub-200ms socket streaming
    const supabase = getSupabaseClient();
    if (supabase) {
      const channelToken = student.accessToken || student.id;
      const channel = supabase.channel(`student_stream_${channelToken}`);
      inspectChannelRef.current = channel;

      channel
        .on('broadcast', { event: 'screen_frame' }, async ({ payload }: { payload: { frame?: string; seq?: number } }) => {
          if (!payload?.frame) return;
          if (typeof payload.seq === 'number') {
            if (payload.seq <= lastFrameSeqRef.current) return;
            lastFrameSeqRef.current = payload.seq;
          }
          await paintFrameToCanvas(payload.frame);
        })
        .subscribe((status) => {
          if (status === 'SUBSCRIBED') {
            channel.send({
              type: 'broadcast',
              event: 'watch_mode',
              payload: { active: true }
            });
          }
        });
    }

    // 3. Immediate initial fetch and paint
    try {
      const res = await getSingleStudentLiveScreenAction(student.id);
      if (res.success && res.student) {
        setFocusedStudent(res.student as StudentScreenItem);
        if (res.student.latestScreenFrame) {
          paintFrameToCanvas(res.student.latestScreenFrame);
        }
      } else if (student.latestScreenFrame) {
        paintFrameToCanvas(student.latestScreenFrame);
      }
    } catch {
      if (student.latestScreenFrame) {
        paintFrameToCanvas(student.latestScreenFrame);
      }
    }
  }, [paintFrameToCanvas]);

  // Handle closing live inspection modal
  const handleCloseInspect = useCallback(async () => {
    const studentIdToClose = inspectedStudentId;
    if (inspectChannelRef.current) {
      inspectChannelRef.current.send({
        type: 'broadcast',
        event: 'watch_mode',
        payload: { active: false }
      });
      const supabase = getSupabaseClient();
      if (supabase) {
        supabase.removeChannel(inspectChannelRef.current);
      }
      inspectChannelRef.current = null;
    }

    if (studentIdToClose) {
      await setStudentWatchModeAction(studentIdToClose, false);
    }
    setInspectedStudentId(null);
    setFocusedStudent(null);
    setIsFullscreenModal(false);
    setZoomLevel(1);
    setIsNudgeOpen(false);
  }, [inspectedStudentId]);

  // Send calm canned nudge message directly to student over realtime channel
  const handleSendNudge = useCallback((message: string) => {
    if (inspectChannelRef.current) {
      inspectChannelRef.current.send({
        type: 'broadcast',
        event: 'teacher_nudge',
        payload: { message }
      });
    }
    setIsNudgeOpen(false);
    setNudgeToast('Notice transmitted to candidate');
    setTimeout(() => setNudgeToast(null), 4000);
  }, []);

  // Frame age calculator ticker (runs every 500ms while inspecting)
  useEffect(() => {
    if (!inspectedStudentId) return;

    const interval = setInterval(() => {
      const last = lastFrameTimeRef.current;
      if (last > 0) {
        const age = (Date.now() - last) / 1000;
        setFrameAge(age);
        if (age > 10) setStreamState('STALE');
        else if (age > 3.5) setStreamState('DELAYED');
        else setStreamState('LIVE');
      }
    }, 500);

    return () => clearInterval(interval);
  }, [inspectedStudentId]);

  // Fallback 1-second DB polling while inspecting
  useEffect(() => {
    if (!inspectedStudentId) return;

    let isMounted = true;
    const interval = setInterval(async () => {
      try {
        const res = await getSingleStudentLiveScreenAction(inspectedStudentId);
        if (isMounted && res.success && res.student) {
          setFocusedStudent((prev) => {
            if (!prev) return res.student as StudentScreenItem;
            return {
              ...prev,
              ...res.student
            };
          });
          if (res.student.latestScreenFrame) {
            paintFrameToCanvas(res.student.latestScreenFrame);
          }
        }
      } catch (err) {
        console.warn('Fallback stream poll notice:', err);
      }
    }, 1000);

    return () => {
      isMounted = false;
      clearInterval(interval);
    };
  }, [inspectedStudentId, paintFrameToCanvas]);

  // Close on Escape key
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape' && inspectedStudentId) {
        handleCloseInspect();
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [inspectedStudentId, handleCloseInspect]);

  // Filter students
  const filteredStudents = students.filter((s) => {
    if (statusFilter === 'ALL') return true;
    return s.status === statusFilter;
  });

  const inProgressCount = students.filter((s) => s.status === 'IN_PROGRESS').length;
  const lockedCount = students.filter((s) => s.status === 'LOCKED').length;

  return (
    <div className="space-y-4">
      {/* Veyon Header Toolbar */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 p-3.5 rounded-[2px] bg-paper border border-rule">
        <div className="flex items-center gap-3">
          <div className="w-8 h-8 rounded-[2px] bg-ground border border-rule flex items-center justify-center text-ink">
            <Tv className="w-4 h-4 text-ink" />
          </div>
          <div>
            <div className="text-xs font-bold text-ink uppercase tracking-wider flex items-center gap-2">
              <span>Live Classroom Flight Board</span>
              <span className="flex items-center gap-1 px-2 py-0.2 rounded-full text-[10px] font-mono bg-emerald-500/10 text-emerald-400 border border-emerald-500/20">
                <Radio className="w-2.5 h-2.5 animate-pulse text-emerald-400" />
                Veyon Architecture
              </span>
            </div>
            <div className="text-[11px] text-ink-muted">
              Auto-syncs all candidate screens every 30s. Click any screen to stream live (1–2s updates).
            </div>
          </div>
        </div>

        <div className="flex items-center gap-2.5 flex-wrap">
          {/* Status Filters */}
          <div className="flex items-center gap-1 p-0.5 rounded-[2px] bg-ground border border-rule text-xs">
            <button
              type="button"
              onClick={() => setStatusFilter('ALL')}
              className={`px-2.5 py-1 rounded-[2px] text-[11px] font-mono transition ${
                statusFilter === 'ALL'
                  ? 'bg-ink text-paper font-semibold'
                  : 'text-ink-muted hover:text-ink'
              }`}
            >
              All ({students.length})
            </button>
            <button
              type="button"
              onClick={() => setStatusFilter('IN_PROGRESS')}
              className={`px-2.5 py-1 rounded-[2px] text-[11px] font-mono transition flex items-center gap-1 ${
                statusFilter === 'IN_PROGRESS'
                  ? 'bg-emerald-500 text-ink font-semibold'
                  : 'text-ink-muted hover:text-ink'
              }`}
            >
              <span className="w-1.5 h-1.5 rounded-full bg-emerald-400"></span>
              Active ({inProgressCount})
            </button>
            <button
              type="button"
              onClick={() => setStatusFilter('LOCKED')}
              className={`px-2.5 py-1 rounded-[2px] text-[11px] font-mono transition flex items-center gap-1 ${
                statusFilter === 'LOCKED'
                  ? 'bg-signal text-paper font-semibold'
                  : 'text-ink-muted hover:text-ink'
              }`}
            >
              <Lock className="w-3 h-3" />
              Locked ({lockedCount})
            </button>
          </div>

          {/* Manual Refresh & Sweep Countdown */}
          <button
            type="button"
            onClick={fetchAllScreens}
            disabled={isRefreshing}
            className="flex items-center gap-1.5 px-3 py-1.5 rounded-[2px] bg-ground hover:bg-slate-800 border border-rule text-ink text-xs font-mono transition disabled:opacity-50"
            title="Refresh all student screens now"
          >
            <RefreshCw className={`w-3 h-3 ${isRefreshing ? 'animate-spin text-ink' : 'text-ink-muted'}`} />
            <span>{isRefreshing ? 'Syncing...' : `Next: ${secondsUntilRefresh}s`}</span>
          </button>
        </div>
      </div>

      {/* Grid of Student Screen Thumbnails */}
      {filteredStudents.length === 0 ? (
        <div className="p-10 rounded-[2px] bg-paper border border-dashed border-rule text-center space-y-2">
          <Monitor className="w-8 h-8 text-ink-muted mx-auto" />
          <div className="text-xs text-ink font-medium">No candidates match current status filter.</div>
          <div className="text-[11px] text-ink-muted">Screens will populate automatically when examinees share screen and start.</div>
        </div>
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
          {filteredStudents.map((student) => {
            const hasActiveFrame = !!student.latestScreenFrame;
            const isLive = student.status === 'IN_PROGRESS';
            const isLocked = student.status === 'LOCKED';
            const isSubmitted = student.status === 'SUBMITTED';

            return (
              <div
                key={student.id}
                onClick={() => handleOpenInspect(student)}
                className={`group relative rounded-[2px] border bg-paper text-xs overflow-hidden cursor-pointer transition-all duration-300 hover:-translate-y-1 hover:shadow-xl hover:border-ink/60 flex flex-col justify-between ${
                  isLocked
                    ? 'border-signal/70 ring-1 ring-signal/30'
                    : (student.integrityAlertsCount ?? 0) > 0
                    ? 'border-amber-500/50'
                    : 'border-rule'
                }`}
              >
                {/* Screen Header Bar */}
                <div className="p-2.5 bg-ground border-b border-rule flex items-center justify-between gap-2">
                  <div className="flex items-center gap-2 min-w-0">
                    <span
                      className={`w-2 h-2 rounded-full shrink-0 ${
                        isLive
                          ? 'bg-emerald-400 animate-pulse'
                          : isLocked
                          ? 'bg-signal'
                          : isSubmitted
                          ? 'bg-blue-400'
                          : 'bg-slate-500'
                      }`}
                    />
                    <div className="font-semibold text-ink truncate max-w-[140px]" title={student.studentName}>
                      {student.studentName}
                    </div>
                  </div>

                  <div className="flex items-center gap-1.5 shrink-0">
                    {student.currentQuestion && (
                      <span className="px-1.5 py-0.5 rounded text-[10px] font-mono bg-paper border border-rule text-ink">
                        Q#{student.currentQuestion}
                      </span>
                    )}

                    {isLocked && (
                      <span className="px-1.5 py-0.5 rounded text-[10px] font-bold bg-signal text-paper flex items-center gap-0.5">
                        <Lock className="w-2.5 h-2.5" />
                        <span>LOCK</span>
                      </span>
                    )}
                  </div>
                </div>

                {/* Screen Thumbnail Viewport */}
                <div className="relative aspect-video w-full bg-ground/80 flex items-center justify-center overflow-hidden">
                  {hasActiveFrame ? (
                    <img
                      src={student.latestScreenFrame!}
                      alt={`${student.studentName}'s active screen`}
                      className="w-full h-full object-cover group-hover:scale-[1.02] transition-transform duration-200"
                      loading="lazy"
                    />
                  ) : (
                    <div className="flex flex-col items-center justify-center gap-1.5 text-ink-muted p-4 text-center">
                      <Monitor className="w-6 h-6 text-slate-700" />
                      <span className="text-[10px] font-mono">
                        {isSubmitted ? 'Exam Finished' : 'Waiting for Screen Stream'}
                      </span>
                    </div>
                  )}

                  {/* Hover Overlay with Live Inspect Cue */}
                  <div className="absolute inset-0 bg-ground/70 backdrop-blur-[1px] opacity-0 group-hover:opacity-100 transition-opacity flex flex-col items-center justify-center gap-1.5 text-paper">
                    <Maximize2 className="w-5 h-5 text-ink" />
                    <span className="text-[11px] font-semibold text-ink">Click for Live Stream</span>
                    <span className="text-[9px] text-ink-muted font-mono">(Accelerates to 1–2s updates)</span>
                  </div>

                  {/* Integrity Warning Badge if flagged */}
                  {(student.integrityAlertsCount ?? 0) > 0 && (
                    <div className="absolute top-2 left-2 px-1.5 py-0.5 rounded bg-signal/90 backdrop-blur-sm text-paper text-[10px] font-bold font-mono flex items-center gap-1 shadow">
                      <AlertTriangle className="w-3 h-3 text-paper" />
                      <span>{student.integrityAlertsCount} STRIKE{(student.integrityAlertsCount ?? 0) > 1 ? 'S' : ''}</span>
                    </div>
                  )}
                </div>

                {/* Screen Footer Bar */}
                <div className="p-2.5 bg-paper flex items-center justify-between text-[10px] font-mono text-ink-muted border-t border-rule">
                  <div>
                    {student.lastActiveAt ? (
                      <span>Active: <FormattedTime date={student.lastActiveAt} format="time" /></span>
                    ) : (
                      <span>No pulse yet</span>
                    )}
                  </div>

                  <div className="flex items-center gap-1 text-ink group-hover:text-ink transition-colors font-sans font-medium text-[11px]">
                    <Eye className="w-3 h-3" />
                    <span>Inspect</span>
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      )}

      {/* FOCUSED STUDENT LIVE INSPECTION MODAL (Veyon Remote View) */}
      {inspectedStudentId && focusedStudent && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-2 sm:p-4 bg-ground/90 backdrop-blur-md animate-in fade-in duration-150">
          <div
            className={`w-full bg-ground border border-rule rounded-[2px] shadow-2xl flex flex-col overflow-hidden transition-all duration-150 ${
              isFullscreenModal
                ? 'fixed inset-0 z-50 w-screen h-screen rounded-none border-none'
                : 'w-[96vw] max-w-[1600px] h-[92vh] max-h-[96vh]'
            }`}
          >
            {/* Modal Header */}
            <div className="p-3 bg-paper border-b border-rule flex items-center justify-between gap-3 shrink-0">
              <div className="flex items-center gap-3 min-w-0">
                <span className="w-2.5 h-2.5 rounded-full bg-emerald-400 animate-pulse shrink-0" />
                <div className="min-w-0">
                  <div className="text-sm font-bold text-ink flex items-center gap-2">
                    <span className="truncate">{focusedStudent.studentName}</span>
                    <span className="px-2 py-0.5 rounded-full text-[10px] font-mono bg-emerald-500/10 text-emerald-400 border border-emerald-500/20 shrink-0 flex items-center gap-1">
                      <Radio className="w-2.5 h-2.5 animate-pulse text-emerald-400" />
                      LIVE HD (1s Pulse)
                    </span>
                  </div>
                  <div className="text-[11px] text-ink-muted font-mono truncate">
                    {focusedStudent.studentEmail || 'Candidate'} {focusedStudent.currentQuestion ? `• Working on Question #${focusedStudent.currentQuestion}` : ''}
                  </div>
                </div>
              </div>

              <div className="flex items-center gap-2 shrink-0">
                {/* Zoom Controls */}
                <div className="hidden sm:flex items-center gap-1 px-2 py-1 rounded bg-ground border border-rule text-xs font-mono">
                  <button
                    type="button"
                    onClick={() => setZoomLevel((z) => Math.max(1, Math.round((z - 0.25) * 100) / 100))}
                    disabled={zoomLevel <= 1}
                    className="p-1 rounded text-ink-muted hover:text-ink disabled:opacity-30 transition"
                    title="Zoom Out"
                  >
                    <ZoomOut className="w-3.5 h-3.5" />
                  </button>
                  <span className="px-1 text-[11px] font-semibold text-ink min-w-[38px] text-center">
                    {Math.round(zoomLevel * 100)}%
                  </span>
                  <button
                    type="button"
                    onClick={() => setZoomLevel((z) => Math.min(3, Math.round((z + 0.25) * 100) / 100))}
                    disabled={zoomLevel >= 3}
                    className="p-1 rounded text-ink-muted hover:text-ink disabled:opacity-30 transition"
                    title="Zoom In"
                  >
                    <ZoomIn className="w-3.5 h-3.5" />
                  </button>
                  {zoomLevel > 1 && (
                    <button
                      type="button"
                      onClick={() => setZoomLevel(1)}
                      className="p-1 rounded text-ink-muted hover:text-ink transition border-l border-rule pl-1.5 ml-0.5"
                      title="Reset to Fit (100%)"
                    >
                      <RotateCcw className="w-3 h-3" />
                    </button>
                  )}
                </div>

                {/* Teacher Intercom Nudge Action */}
                <div className="relative">
                  <button
                    type="button"
                    onClick={() => setIsNudgeOpen((prev) => !prev)}
                    className="inline-flex items-center gap-1.5 px-2.5 py-1.5 rounded-[2px] bg-paper hover:bg-ground border border-rule text-ink text-xs font-mono transition"
                    title="Send calm prompt to candidate screen"
                  >
                    <Radio className="w-3.5 h-3.5 text-amber-500" />
                    <span>Nudge</span>
                  </button>

                  {isNudgeOpen && (
                    <div className="absolute right-0 top-full mt-1 w-72 bg-paper border border-rule shadow-xl rounded-[2px] p-2 z-50 text-xs font-mono space-y-1 animate-in fade-in duration-100">
                      <div className="text-[10px] uppercase text-ink-muted px-2 py-1 font-semibold">
                        Transmit Prompt to Candidate
                      </div>
                      <button
                        type="button"
                        onClick={() => handleSendNudge('Please return to your exam tab and maintain full screen.')}
                        className="w-full text-left px-2 py-1.5 rounded-[1px] hover:bg-ground text-ink text-[11px] transition"
                      >
                        • Return to exam tab &amp; full screen
                      </button>
                      <button
                        type="button"
                        onClick={() => handleSendNudge('Ensure your face is clearly visible to your camera.')}
                        className="w-full text-left px-2 py-1.5 rounded-[1px] hover:bg-ground text-ink text-[11px] transition"
                      >
                        • Ensure camera view is centered
                      </button>
                      <button
                        type="button"
                        onClick={() => handleSendNudge('Quiet workspace required: avoid secondary audio or whispering.')}
                        className="w-full text-left px-2 py-1.5 rounded-[1px] hover:bg-ground text-ink text-[11px] transition"
                      >
                        • Maintain quiet room integrity
                      </button>
                    </div>
                  )}
                </div>

                {focusedStudent.status === 'LOCKED' && (
                  <UnlockStudentButton
                    studentExamId={focusedStudent.id}
                    studentName={focusedStudent.studentName}
                  />
                )}

                <Link
                  href={`/teacher/exam/${examId}/preview?studentId=${focusedStudent.id}`}
                  className="hidden sm:inline-flex items-center gap-1 px-2.5 py-1.5 rounded-[2px] bg-paper hover:bg-slate-800 border border-rule text-ink text-xs font-medium transition"
                  target="_blank"
                >
                  <ExternalLink className="w-3.5 h-3.5 text-ink-muted" />
                  <span>View Variant</span>
                </Link>

                <button
                  type="button"
                  onClick={() => setIsFullscreenModal((prev) => !prev)}
                  className="p-1.5 rounded-[2px] bg-paper hover:bg-slate-800 border border-rule text-ink-muted hover:text-ink transition"
                  title={isFullscreenModal ? 'Exit Fullscreen' : 'Fullscreen Theater View'}
                >
                  {isFullscreenModal ? <Minimize2 className="w-4 h-4" /> : <Maximize2 className="w-4 h-4" />}
                </button>

                <button
                  type="button"
                  onClick={handleCloseInspect}
                  className="p-1.5 rounded-[2px] bg-paper hover:bg-rose-950/40 border border-rule hover:border-rose-500/40 text-ink-muted hover:text-rose-400 transition"
                  title="Close Remote View (ESC)"
                >
                  <X className="w-4 h-4" />
                </button>
              </div>
            </div>

            {/* Modal Screen Display Viewport (Atomic Canvas Painting) */}
            <div className="flex-1 bg-black/95 p-2 sm:p-4 flex items-center justify-center overflow-auto min-h-[350px] relative select-none">
              {focusedStudent.latestScreenFrame ? (
                <div 
                  className="w-full h-full flex items-center justify-center overflow-auto"
                  style={{ cursor: zoomLevel > 1 ? 'grab' : 'default' }}
                >
                  <canvas
                    ref={canvasRef}
                    className="w-auto h-auto max-w-full max-h-[82vh] object-contain rounded shadow-2xl transition-transform duration-150"
                    style={{
                      transform: `scale(${zoomLevel})`,
                      transformOrigin: 'center center'
                    }}
                  />
                </div>
              ) : (
                <div className="flex flex-col items-center justify-center py-20 gap-3 text-ink-muted">
                  <Monitor className="w-12 h-12 text-slate-700 animate-pulse" />
                  <div className="text-sm text-ink font-medium">Waiting for candidate&apos;s screen transmission...</div>
                  <div className="text-xs text-ink-muted font-mono">
                    Ensure student has accepted screen sharing on their browser.
                  </div>
                </div>
              )}

              {/* Honest Monospace Telemetry HUD (Quiet Instrument style) */}
              <div className="absolute top-3 right-3 px-3 py-1 rounded-[2px] bg-paper/95 backdrop-blur-sm border border-rule text-ink text-[11px] font-mono flex items-center gap-2.5 shadow-md">
                <span className="flex items-center gap-1.5">
                  <span 
                    className={`w-2 h-2 rounded-full ${
                      streamState === 'LIVE' ? 'bg-emerald-500' : streamState === 'DELAYED' ? 'bg-amber-500' : 'bg-rose-500'
                    }`} 
                  />
                  <span className="font-semibold text-ink uppercase tracking-wider">{streamState}</span>
                </span>
                <span className="text-rule">|</span>
                <span>{resolutionText}</span>
                <span className="text-rule">|</span>
                <span>1.0 fps</span>
                <span className="text-rule">|</span>
                <span>frame age {frameAge.toFixed(1)}s</span>
              </div>

              {/* Nudge Confirmation Toast */}
              {nudgeToast && (
                <div className="absolute bottom-4 left-1/2 -translate-x-1/2 px-3 py-1.5 rounded-[2px] bg-ink text-paper text-xs font-mono shadow-lg border border-rule animate-in fade-in duration-150">
                  {nudgeToast}
                </div>
              )}
            </div>

            {/* Modal Footer Flight Bar */}
            <div className="p-3 bg-ground border-t border-rule flex flex-col sm:flex-row sm:items-center justify-between gap-2 text-xs font-mono shrink-0">
              <div className="flex items-center gap-3 text-ink-muted flex-wrap">
                <span>
                  Status: <strong className={focusedStudent.status === 'IN_PROGRESS' ? 'text-verified' : 'text-signal'}>{focusedStudent.status}</strong>
                </span>
                <span>•</span>
                <span>
                  Strikes: <strong className={(focusedStudent.strikeCount ?? 0) > 0 ? 'text-signal' : 'text-verified'}>{focusedStudent.strikeCount ?? 0} / {maxStrikes}</strong>
                </span>
                {focusedStudent.lastActiveAt && (
                  <>
                    <span>•</span>
                    <span>Last Stream Pulse: <FormattedTime date={focusedStudent.lastActiveAt} format="time" /></span>
                  </>
                )}
              </div>

              <div className="text-[11px] text-ink-muted flex items-center gap-3">
                <span className="hidden sm:inline">Use Zoom controls or Fullscreen icon for maximum detail</span>
                <span>•</span>
                <span>Press <kbd className="px-1.5 py-0.5 rounded bg-paper border border-rule text-ink font-mono">ESC</kbd> to exit</span>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
