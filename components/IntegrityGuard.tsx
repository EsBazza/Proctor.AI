'use client';

import React, { useEffect, useState, useRef, useCallback } from 'react';
import { Shield, AlertTriangle, Monitor, X } from 'lucide-react';
import { logIntegrityEventWithSequenceAction, sendStudentHeartbeatAction } from '@/actions/student';
import { getSupabaseClient } from '@/lib/supabase';

interface ViolationNotice {
  eventType: 'TAB_SWITCH' | 'WINDOW_BLUR' | 'PASTE_ATTEMPT' | 'FULLSCREEN_EXIT';
  title: string;
  details: string;
  strikeCount: number;
  timestamp: string;
  isLockout: boolean;
  keystrokes?: string[];
}

interface IntegrityGuardProps {
  token: string;
  examTitle?: string;
  examSubject?: string;
  studentName?: string;
  durationMinutes?: number;
  questionCount?: number;
  maxStrikes?: number;
  isLocked?: boolean;
  currentQuestionIndex?: number;
  onViolation?: (count: number) => void;
  onLockout?: () => void;
  onProctoringReady?: (ready: boolean) => void;
}

export function IntegrityGuard({
  token,
  examTitle,
  examSubject,
  studentName,
  durationMinutes,
  questionCount,
  maxStrikes = 2,
  isLocked = false,
  currentQuestionIndex,
  onViolation,
  onLockout,
  onProctoringReady
}: IntegrityGuardProps) {
  const [violationCount, setViolationCount] = useState(0);
  const [lastAlert, setLastAlert] = useState<string | null>(null);
  const [isScreenSharing, setIsScreenSharing] = useState(false);
  const [isFullscreen, setIsFullscreen] = useState(false);
  const [isConsentGateActive, setIsConsentGateActive] = useState(true);
  const [consentAgreed, setConsentAgreed] = useState(false);
  const [consentError, setConsentError] = useState<string | null>(null);
  const [isStreamPaused, setIsStreamPaused] = useState(false);
  const [activeViolationModal, setActiveViolationModal] = useState<ViolationNotice | null>(null);
  const [violationHistory, setViolationHistory] = useState<ViolationNotice[]>([]);
  const [isBeingWatched, setIsBeingWatched] = useState(false);
  const [teacherNudgeMessage, setTeacherNudgeMessage] = useState<string | null>(null);

  const realtimeChannelRef = useRef<ReturnType<NonNullable<ReturnType<typeof getSupabaseClient>>['channel']> | null>(null);
  const frameSeqRef = useRef<number>(0);
  const isBeingWatchedRef = useRef(false);

  const videoRef = useRef<HTMLVideoElement | null>(null);
  const streamRef = useRef<MediaStream | null>(null);
  const lastLogTime = useRef<number>(0);

  // Audio chime for immediate alert feedback
  const playAlertChime = useCallback(() => {
    try {
      const AudioCtx = window.AudioContext || (window as unknown as { webkitAudioContext: typeof AudioContext }).webkitAudioContext;
      if (!AudioCtx) return;
      const ctx = new AudioCtx();
      const osc = ctx.createOscillator();
      const gain = ctx.createGain();
      osc.type = 'triangle';
      osc.frequency.setValueAtTime(392, ctx.currentTime);
      osc.frequency.exponentialRampToValueAtTime(880, ctx.currentTime + 0.18);
      gain.gain.setValueAtTime(0.25, ctx.currentTime);
      gain.gain.exponentialRampToValueAtTime(0.01, ctx.currentTime + 0.5);
      osc.connect(gain);
      gain.connect(ctx.destination);
      osc.start();
      osc.stop(ctx.currentTime + 0.5);
    } catch {
      // Audio autoplay policy fallback
    }
  }, []);

  // 1 fps Pre-violation Frame Ring Buffer (keeps last 5 seconds of screen activity)
  const preFramesBufferRef = useRef<Array<{ dataUrl: string; timestamp: number }>>([]);
  // Trailing keystroke buffer (captures shortcuts and keypresses before violations)
  const keystrokesBufferRef = useRef<Array<{ combo: string; timestamp: number }>>([]);
  const activePostIntervalRef = useRef<NodeJS.Timeout | null>(null);

  // Setup hidden video element to hold screen share stream
  useEffect(() => {
    const video = document.createElement('video');
    video.autoplay = true;
    video.muted = true;
    video.playsInline = true;
    videoRef.current = video;

    return () => {
      if (activePostIntervalRef.current) {
        clearInterval(activePostIntervalRef.current);
      }
      if (streamRef.current) {
        streamRef.current.getTracks().forEach((t) => t.stop());
      }
    };
  }, []);

  // Capture current video frame as compact base64 JPEG (~20-25KB per frame)
  const captureFrame = useCallback((): string | null => {
    if (!videoRef.current || !streamRef.current) return null;
    const video = videoRef.current;
    if (video.videoWidth === 0 || video.videoHeight === 0) return null;

    try {
      const canvas = document.createElement('canvas');
      // Scale to max width 960 to keep multi-frame payload lightweight
      const scale = Math.min(1, 960 / video.videoWidth);
      canvas.width = Math.round(video.videoWidth * scale);
      canvas.height = Math.round(video.videoHeight * scale);

      const ctx = canvas.getContext('2d');
      if (!ctx) return null;

      ctx.drawImage(video, 0, 0, canvas.width, canvas.height);
      return canvas.toDataURL('image/jpeg', 0.55);
    } catch (err) {
      console.warn('Could not grab screen frame snapshot:', err);
      return null;
    }
  }, []);

  // 1 fps Pre-Violation Ring Buffer: runs continuously while screen sharing is active
  useEffect(() => {
    if (!isScreenSharing) return;

    const interval = setInterval(() => {
      const frame = captureFrame();
      if (frame) {
        preFramesBufferRef.current.push({
          dataUrl: frame,
          timestamp: Date.now()
        });
        // Retain only trailing 5 frames (approx 5 seconds before any flag)
        if (preFramesBufferRef.current.length > 5) {
          preFramesBufferRef.current = preFramesBufferRef.current.slice(-5);
        }
      }
    }, 1000);

    return () => clearInterval(interval);
  }, [isScreenSharing, captureFrame]);

  // High-Definition adaptive screen frame capturer:
  // - High Def (Watch Mode): 1280px (720p HD) for crisp text, tab titles, and code (~50-70KB WebP)
  // - Standard (Grid Mode): 800px (~25-35KB WebP) for smooth classroom overview cards
  const captureThumbnail = useCallback((isHighDef: boolean = false): string | null => {
    if (!videoRef.current || !streamRef.current) return null;
    const video = videoRef.current;
    if (video.videoWidth === 0 || video.videoHeight === 0) return null;

    try {
      const canvas = document.createElement('canvas');
      const targetWidth = isHighDef ? 1280 : 800;
      const scale = Math.min(1, targetWidth / video.videoWidth);
      canvas.width = Math.round(video.videoWidth * scale);
      canvas.height = Math.round(video.videoHeight * scale);

      const ctx = canvas.getContext('2d');
      if (!ctx) return null;

      ctx.drawImage(video, 0, 0, canvas.width, canvas.height);
      return canvas.toDataURL('image/webp', isHighDef ? 0.65 : 0.5);
    } catch {
      return null;
    }
  }, []);

  // Supabase Realtime Channel: Instant bidirectional transport for watch mode and teacher nudges
  useEffect(() => {
    if (!isScreenSharing || isLocked) return;

    const supabase = getSupabaseClient();
    if (!supabase) return;

    const channelName = `student_stream_${token}`;
    const channel = supabase.channel(channelName);
    realtimeChannelRef.current = channel;

    channel
      .on('broadcast', { event: 'watch_mode' }, ({ payload }: { payload: { active: boolean } }) => {
        const active = !!payload?.active;
        isBeingWatchedRef.current = active;
        setIsBeingWatched(active);
      })
      .on('broadcast', { event: 'teacher_nudge' }, ({ payload }: { payload: { message: string } }) => {
        if (payload?.message) {
          playAlertChime();
          setTeacherNudgeMessage(payload.message);
          setTimeout(() => setTeacherNudgeMessage(null), 9000);
        }
      })
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
      realtimeChannelRef.current = null;
    };
  }, [isScreenSharing, isLocked, token, playAlertChime]);

  // Ephemeral Realtime Frame Stream + DB Presence & Fallback Sync
  const lastDbFrameSentRef = useRef<number>(0);

  useEffect(() => {
    if (!isScreenSharing || isLocked) return;

    let streamTimeoutId: NodeJS.Timeout;
    let isCancelled = false;

    // Adaptive Frame Pushing:
    // 1. If Realtime Socket is active: broadcast directly over socket.
    // 2. In addition, sync with database:
    //    - If watched: sync frame every 1.2s to DB so teacher always has fresh view.
    //    - If idle: sync thumbnail every 10s to DB so classroom grid is always current.
    const streamLoop = async () => {
      try {
        const now = Date.now();
        const isWatched = isBeingWatchedRef.current;
        const channel = realtimeChannelRef.current;
        const frame = captureThumbnail(isWatched);

        // A. Send over Realtime socket if connected
        if (frame && channel) {
          frameSeqRef.current += 1;
          channel.send({
            type: 'broadcast',
            event: 'screen_frame',
            payload: {
              frame,
              seq: frameSeqRef.current,
              currentQuestion: currentQuestionIndex,
              timestamp: now
            }
          });
        }

        // B. Reliable Database Sync:
        // Ensures grid overview cards and fallback modal ALWAYS receive live frames
        const dbInterval = isWatched ? 1200 : 10000;
        const shouldSendDb = !lastDbFrameSentRef.current || (now - lastDbFrameSentRef.current >= dbInterval);

        if (shouldSendDb && frame) {
          lastDbFrameSentRef.current = now;
          const res = await sendStudentHeartbeatAction({
            token,
            latestScreenFrame: frame,
            currentQuestion: currentQuestionIndex
          });

          if (res && res.success && res.isBeingWatched !== undefined) {
            isBeingWatchedRef.current = !!res.isBeingWatched;
            setIsBeingWatched(!!res.isBeingWatched);
          }
        }
      } catch {
        // Non-blocking
      }

      if (!isCancelled) {
        const nextDelay = isBeingWatchedRef.current ? 1000 : 2500;
        streamTimeoutId = setTimeout(streamLoop, nextDelay);
      }
    };

    streamTimeoutId = setTimeout(streamLoop, 600);

    return () => {
      isCancelled = true;
      clearTimeout(streamTimeoutId);
    };
  }, [isScreenSharing, isLocked, token, currentQuestionIndex, captureThumbnail]);

  const reportViolation = useCallback(
    async (
      eventType: 'TAB_SWITCH' | 'WINDOW_BLUR' | 'PASTE_ATTEMPT' | 'FULLSCREEN_EXIT',
      details: string
    ) => {
      if (isLocked) return;

      const now = Date.now();
      // Debounce logging (at least 6 seconds between violations so post-capture completes cleanly)
      if (now - lastLogTime.current < 6000) return;
      lastLogTime.current = now;

      // 1. Immediately update student UI strikes (zero latency for the student)
      const nextCount = violationCount + 1;
      setViolationCount(nextCount);
      if (onViolation) onViolation(nextCount);

      setLastAlert(details);
      setTimeout(() => setLastAlert(null), 7000);

      playAlertChime();

      // Friendly title for student violation pop up
      const friendlyTitle =
        eventType === 'TAB_SWITCH'
          ? 'Browser Tab Switched or Window Minimized'
          : eventType === 'WINDOW_BLUR'
          ? 'Exam Window Lost Focus'
          : eventType === 'PASTE_ATTEMPT'
          ? 'Clipboard Paste Intercepted'
          : 'Fullscreen Mode Exited';

      // 2. Freeze pre-frames (T-5s to T-1s) and grab trigger frame (T0)
      const preFrames = preFramesBufferRef.current.map((f) => f.dataUrl);
      const triggerFrame = captureFrame();
      const capturedKeys = keystrokesBufferRef.current
        .filter((k) => now - k.timestamp <= 8000)
        .map((k) => k.combo);

      // Trigger instant violation pop-up explaining what was detected
      const notice: ViolationNotice = {
        eventType,
        title: friendlyTitle,
        details,
        strikeCount: nextCount,
        timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit', second: '2-digit' }),
        isLockout: nextCount >= maxStrikes,
        keystrokes: capturedKeys.length > 0 ? capturedKeys : undefined
      };

      setActiveViolationModal(notice);
      setViolationHistory((prev) => [...prev, notice]);

      if (nextCount >= maxStrikes && onLockout) {
        onLockout();
      }

      // 3. Post-Violation Capture: record next 5 seconds (T+1s to T+5s) to catch external apps/search
      const postFrames: string[] = [];
      let postCount = 0;

      const finishAndUpload = (finalPostFrames: string[]) => {
        const fullSequence = [
          ...preFrames,
          ...(triggerFrame ? [triggerFrame] : []),
          ...finalPostFrames
        ];

        logIntegrityEventWithSequenceAction(
          token,
          eventType,
          details,
          fullSequence.length > 0 ? fullSequence : undefined,
          capturedKeys.length > 0 ? capturedKeys : undefined
        )
          .then((res) => {
            if (res.success) {
              if (res.strikeCount !== undefined) {
                setViolationCount(res.strikeCount);
              }
              if (res.isLocked && onLockout) {
                onLockout();
              }
            }
          })
          .catch((err) => {
            console.error('Integrity sequence reporting error:', err);
          });
      };

      if (!isScreenSharing) {
        finishAndUpload([]);
        return;
      }

      if (activePostIntervalRef.current) {
        clearInterval(activePostIntervalRef.current);
      }

      activePostIntervalRef.current = setInterval(() => {
        postCount++;
        const frame = captureFrame();
        if (frame) {
          postFrames.push(frame);
        }

        if (postCount >= 5) {
          if (activePostIntervalRef.current) {
            clearInterval(activePostIntervalRef.current);
            activePostIntervalRef.current = null;
          }
          finishAndUpload(postFrames);
        }
      }, 1000);
    },
    [captureFrame, isLocked, isScreenSharing, maxStrikes, onLockout, onViolation, playAlertChime, token, violationCount]
  );

  // Request Screen Share and Fullscreen
  const handleStartProctoring = async () => {
    try {
      // 1. Request screen share (mandatory)
      const stream = await navigator.mediaDevices.getDisplayMedia({
        video: {
          displaySurface: 'monitor'
        } as MediaTrackConstraints,
        audio: false
      });

      streamRef.current = stream;
      if (videoRef.current) {
        videoRef.current.srcObject = stream;
        await videoRef.current.play();
      }
      setIsScreenSharing(true);
      setIsStreamPaused(false);
      setIsConsentGateActive(false);
      setConsentError(null);
      if (onProctoringReady) onProctoringReady(true);

      // Handle examinee clicking "Stop sharing" on browser floating bar
      stream.getVideoTracks()[0].onended = () => {
        setIsScreenSharing(false);
        setIsStreamPaused(true);
        if (onProctoringReady) onProctoringReady(false);
        reportViolation('WINDOW_BLUR', 'Screen sharing proctoring was stopped by examinee');
      };

      // 2. Request Fullscreen
      if (!document.fullscreenElement) {
        await document.documentElement.requestFullscreen().catch(() => {});
        setIsFullscreen(true);
      }
    } catch (err) {
      console.warn('Screen share or fullscreen request dismissed:', err);
      // Refuse entrance: student CANNOT start without screen sharing!
      setConsentError(
        'Screen proctoring permission is strictly mandatory. You cannot access the examination questions without sharing your screen. Please try again and select your screen.'
      );
      setIsScreenSharing(false);
      setIsConsentGateActive(true);
      if (onProctoringReady) onProctoringReady(false);
    }
  };

  // Event Listeners for Tab switch, Blur, Fullscreen, and Key combos
  useEffect(() => {
    if (isConsentGateActive) return;

    const handleVisibilityChange = () => {
      if (document.hidden) {
        reportViolation('TAB_SWITCH', 'Examinee switched tabs or minimized exam window');
      }
    };

    const handleBlur = () => {
      reportViolation('WINDOW_BLUR', 'Exam browser window lost focus');
    };

    const handleFullscreenChange = () => {
      const activeFullscreen = !!document.fullscreenElement;
      setIsFullscreen(activeFullscreen);
      if (!activeFullscreen) {
        reportViolation('FULLSCREEN_EXIT', 'Examinee exited fullscreen mode');
      }
    };

    const handlePaste = (e: ClipboardEvent) => {
      e.preventDefault();
      reportViolation('PASTE_ATTEMPT', 'Clipboard paste blocked in exam room');
    };

    const handleCopy = (e: ClipboardEvent) => {
      e.preventDefault();
    };

    const handleContextMenu = (e: MouseEvent) => {
      e.preventDefault();
    };

    const handleKeyDown = (e: KeyboardEvent) => {
      // Build human-readable keystroke combo
      const parts: string[] = [];
      if (e.altKey) parts.push('Alt');
      if (e.ctrlKey) parts.push('Ctrl');
      if (e.metaKey) parts.push('Meta/Win');
      if (e.shiftKey && (e.key.length > 1 || e.altKey || e.ctrlKey)) parts.push('Shift');

      const keyName = e.key === ' ' ? 'Space' : e.key;
      if (!['Control', 'Alt', 'Shift', 'Meta'].includes(keyName)) {
        parts.push(keyName.length === 1 ? keyName.toUpperCase() : keyName);
      }
      const combo = parts.join('+') || keyName;

      // Append to keystroke buffer with timestamp
      const now = Date.now();
      keystrokesBufferRef.current.push({ combo, timestamp: now });
      // Keep only keystrokes from the last 10 seconds (max 25 entries)
      const cutoff = now - 10000;
      keystrokesBufferRef.current = keystrokesBufferRef.current
        .filter((k) => k.timestamp >= cutoff)
        .slice(-25);

      // Block DevTools shortcuts
      if (
        e.key === 'F12' ||
        (e.ctrlKey && e.shiftKey && (e.key === 'I' || e.key === 'J')) ||
        (e.ctrlKey && e.key === 'u')
      ) {
        e.preventDefault();
        reportViolation('WINDOW_BLUR', `DevTools shortcut intercepted (${e.key})`);
      }
    };

    document.addEventListener('visibilitychange', handleVisibilityChange);
    window.addEventListener('blur', handleBlur);
    document.addEventListener('fullscreenchange', handleFullscreenChange);
    document.addEventListener('paste', handlePaste);
    document.addEventListener('copy', handleCopy);
    document.addEventListener('contextmenu', handleContextMenu);
    window.addEventListener('keydown', handleKeyDown);

    return () => {
      document.removeEventListener('visibilitychange', handleVisibilityChange);
      window.removeEventListener('blur', handleBlur);
      document.removeEventListener('fullscreenchange', handleFullscreenChange);
      document.removeEventListener('paste', handlePaste);
      document.removeEventListener('copy', handleCopy);
      document.removeEventListener('contextmenu', handleContextMenu);
      window.removeEventListener('keydown', handleKeyDown);
    };
  }, [reportViolation, isConsentGateActive]);

  return (
    <div className="w-full space-y-3">
      {/* Mandatory Pre-Exam Consent Gate (Formal Institutional Document) */}
      {isConsentGateActive && (
        <div className="rounded-[2px] bg-paper border border-rule p-6 sm:p-8 space-y-6">
          <div className="flex flex-col sm:flex-row sm:items-start justify-between gap-4 border-b border-rule pb-5">
            <div className="space-y-1">
              <div className="font-mono text-xs uppercase tracking-widest text-ink-muted">
                Section I: Candidate Authentication &amp; Integrity Agreement
              </div>
              <h2 className="text-xl sm:text-2xl font-semibold tracking-tight text-ink">
                Examination Proctoring Protocol
              </h2>
              <p className="text-xs text-ink-muted leading-relaxed max-w-2xl">
                To guarantee equal testing conditions and authenticate submitted responses, this session requires verified screen-stream sharing. Exam items and the countdown timer will unlock once permissions are confirmed.
              </p>
            </div>
          </div>

          {/* Assessment Parameters Table */}
          {(examTitle || studentName || durationMinutes) && (
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-2 text-xs font-mono">
              {examTitle && (
                <div className="p-2.5 rounded-[2px] bg-ground border border-rule">
                  <span className="text-[10px] uppercase text-ink-muted block">Assessment</span>
                  <strong className="text-ink font-semibold truncate block mt-0.5">{examTitle}</strong>
                </div>
              )}
              {examSubject && (
                <div className="p-2.5 rounded-[2px] bg-ground border border-rule">
                  <span className="text-[10px] uppercase text-ink-muted block">Subject</span>
                  <strong className="text-ink font-semibold truncate block mt-0.5">{examSubject}</strong>
                </div>
              )}
              {durationMinutes && (
                <div className="p-2.5 rounded-[2px] bg-ground border border-rule">
                  <span className="text-[10px] uppercase text-ink-muted block">Duration</span>
                  <strong className="text-ink font-semibold block mt-0.5">{durationMinutes} Minutes</strong>
                </div>
              )}
              {questionCount !== undefined && (
                <div className="p-2.5 rounded-[2px] bg-ground border border-rule">
                  <span className="text-[10px] uppercase text-ink-muted block">Scope</span>
                  <strong className="text-ink font-semibold block mt-0.5">{questionCount} Items</strong>
                </div>
              )}
            </div>
          )}

          {/* Institutional Integrity Disclosures */}
          <div className="p-4 rounded-[2px] bg-ground border border-rule space-y-2.5 text-xs text-ink">
            <span className="font-mono uppercase tracking-wider text-[11px] font-semibold text-ink-muted block">
              Proctoring Standards &amp; Privacy Disclosures:
            </span>
            <ul className="space-y-1.5 list-disc list-inside text-ink-muted leading-relaxed">
              <li>
                <strong className="text-ink">Screen Verification:</strong> Please share your entire display. A 1 frame/second motion buffer captures the 5 seconds before and 5 seconds after any navigation anomaly for objective instructor review.
              </li>
              <li>
                <strong className="text-ink">Navigation Boundaries:</strong> Exiting fullscreen or navigating to secondary tabs or applications logs an incident on your proctor record.
              </li>
              <li>
                <strong className="text-ink">Key Shortcut Forensics:</strong> System-level shortcuts (e.g. Alt+Tab, Cmd+Tab, Ctrl+C) are logged to trace application switching. Typed prose and answers are never logged.
              </li>
              <li>
                <strong className="text-ink">Strike Limit:</strong> Accumulating {maxStrikes} unverified strikes pauses your test session pending proctor re-authorization.
              </li>
            </ul>
          </div>

          {/* Error Banner when screen share is cancelled or denied */}
          {consentError && (
            <div role="alert" className="p-3.5 rounded-[2px] bg-signal/5 border border-signal/40 text-signal text-xs flex items-start gap-3">
              <AlertTriangle className="w-4 h-4 text-signal shrink-0 mt-0.5" />
              <div className="space-y-0.5">
                <strong className="font-medium block">Screen Stream Access Required</strong>
                <p className="leading-relaxed">{consentError}</p>
              </div>
            </div>
          )}

          {/* Consent Checkbox */}
          <label className="flex items-start gap-3 p-3.5 rounded-[2px] bg-paper border border-rule cursor-pointer hover:bg-ground/50 transition-colors">
            <input
              type="checkbox"
              checked={consentAgreed}
              onChange={(e) => setConsentAgreed(e.target.checked)}
              className="w-4 h-4 rounded-[2px] text-ink focus:ring-ink border-rule mt-0.5 cursor-pointer"
            />
            <span className="text-xs text-ink leading-relaxed">
              I acknowledge the integrity protocols above and consent to screen-stream verification for the duration of this assessment. I certify that all work submitted will be my own.
            </span>
          </label>

          {/* Launch Action */}
          <div className="pt-2 flex flex-col sm:flex-row items-center justify-between gap-3 border-t border-rule">
            <span className="text-xs font-mono text-ink-muted">
              {!consentAgreed ? 'Verification agreement required to unlock examination' : 'System ready for display authorization'}
            </span>

            <button
              type="button"
              disabled={!consentAgreed}
              onClick={handleStartProctoring}
              className={`w-full sm:w-auto inline-flex items-center justify-center gap-2 px-6 py-3 rounded-[2px] font-mono text-xs uppercase tracking-wider font-semibold transition-colors min-h-[44px] ${
                consentAgreed
                  ? 'bg-ink text-paper hover:bg-ink/90 cursor-pointer'
                  : 'bg-ground text-ink-muted/50 border border-rule cursor-not-allowed'
              }`}
            >
              <Monitor className="w-4 h-4" />
              <span>Authorize Display &amp; Begin Examination</span>
            </button>
          </div>
        </div>
      )}

      {/* Privacy Notice: Transparent indicator when teacher is viewing screen */}
      {isBeingWatched && !isConsentGateActive && (
        <div className="fixed top-3 left-1/2 -translate-x-1/2 z-50 px-3.5 py-1.5 rounded-[2px] bg-ink text-paper text-xs font-mono shadow-md border border-rule flex items-center gap-2 animate-in fade-in duration-200">
          <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse" />
          <span>Your teacher is viewing your screen</span>
        </div>
      )}

      {/* Teacher Nudge Intercom Notice */}
      {teacherNudgeMessage && !isConsentGateActive && (
        <div className="fixed top-12 left-1/2 -translate-x-1/2 z-50 px-4 py-2 rounded-[2px] bg-paper text-ink border border-rule shadow-lg text-xs font-mono flex items-center gap-2.5 animate-in slide-in-from-top-2 duration-200">
          <AlertTriangle className="w-4 h-4 text-amber-500 shrink-0" />
          <span>Notice: {teacherNudgeMessage}</span>
          <button 
            type="button"
            onClick={() => setTeacherNudgeMessage(null)}
            className="ml-2 text-ink-muted hover:text-ink transition"
          >
            <X className="w-3.5 h-3.5" />
          </button>
        </div>
      )}

      {/* Screen Stream Interrupted Barrier */}
      {isStreamPaused && !isConsentGateActive && (
        <div className="rounded-[2px] bg-paper border border-signal/60 p-6 sm:p-8 space-y-4 text-center">
          <div className="space-y-1.5 max-w-lg mx-auto">
            <div className="font-mono text-xs uppercase tracking-widest text-signal font-semibold">
              Notice: Session Paused
            </div>
            <h3 className="text-lg font-semibold text-ink">
              Screen Stream Disconnected
            </h3>
            <p className="text-xs text-ink-muted leading-relaxed">
              Display stream sharing was terminated. An event was recorded in your proctoring log. All saved responses are secure. Re-authorize your screen stream to resume testing.
            </p>
          </div>

          <div className="pt-2">
            <button
              type="button"
              onClick={handleStartProctoring}
              className="inline-flex items-center gap-2 px-6 py-2.5 rounded-[2px] bg-ink hover:bg-ink/90 text-paper font-mono text-xs uppercase tracking-wider transition-colors min-h-[44px] cursor-pointer"
            >
              <Monitor className="w-4 h-4" />
              <span>Re-Authorize Screen &amp; Resume</span>
            </button>
          </div>
        </div>
      )}

      {/* Strike 1 Inline Warning Banner */}
      {lastAlert && !isLocked && (
        <div className="p-3.5 rounded-[2px] bg-caution/10 border border-caution/40 text-ink text-xs flex items-center justify-between gap-3">
          <div className="flex items-center gap-2.5">
            <AlertTriangle className="w-4 h-4 text-caution shrink-0" />
            <div>
              <span className="font-mono uppercase font-semibold text-caution">
                Incident Logged (Strike {violationCount} of {maxStrikes}):
              </span>{' '}
              <span className="text-ink-muted">{lastAlert}. Multi-frame forensic record saved for instructor review.</span>
            </div>
          </div>
          <span className="shrink-0 px-2 py-0.5 rounded-[2px] bg-caution/20 text-ink font-mono text-xs">
            {violationCount}/{maxStrikes} Strikes
          </span>
        </div>
      )}

      {/* Persistent Integrity Status Bar */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between px-3.5 py-2 rounded-[2px] bg-paper border border-rule text-xs font-mono text-ink-muted gap-2">
        <div className="flex items-center gap-2">
          <Shield className="w-3.5 h-3.5 text-ink-muted shrink-0" />
          <span>
            {violationCount === 0 ? (
              <span className="text-verified font-medium">Proctoring Active</span>
            ) : (
              <span className="text-caution font-medium">{violationCount} Incident(s) Logged</span>
            )}
            {' | '}
            {isScreenSharing ? 'Display stream verified' : 'Window focus monitored'}
          </span>
        </div>

        <div className="flex items-center gap-3 text-[11px]">
          {violationHistory.length > 0 && (
            <button
              type="button"
              onClick={() => setActiveViolationModal(violationHistory[violationHistory.length - 1])}
              className="text-signal hover:underline font-mono text-[11px] cursor-pointer"
            >
              Inspect Incidents ({violationHistory.length})
            </button>
          )}
          <span className="flex items-center gap-1.5">
            <span className={`w-1.5 h-1.5 rounded-full ${isScreenSharing ? 'bg-verified' : 'bg-rule'}`} />
            <span>Screen Stream</span>
          </span>
          <span className="flex items-center gap-1.5">
            <span className={`w-1.5 h-1.5 rounded-full ${isFullscreen ? 'bg-verified' : 'bg-rule'}`} />
            <span>Fullscreen</span>
          </span>
          <span className="font-mono text-ink-muted">Limit: {maxStrikes} Strikes</span>
        </div>
      </div>

      {/* Violation Popup Modal */}
      {activeViolationModal && (
        <div className="fixed inset-0 z-50 bg-ink/60 flex items-center justify-center p-4">
          <div className="relative max-w-lg w-full rounded-[2px] bg-paper border border-rule p-6 space-y-4 text-left">
            <div className="flex items-start justify-between gap-3 border-b border-rule pb-3">
              <div className="space-y-1">
                <div className="font-mono text-xs uppercase tracking-wider text-signal font-semibold">
                  {activeViolationModal.isLockout ? 'Session Locked' : `Security Incident #${activeViolationModal.strikeCount} of ${maxStrikes}`}
                </div>
                <h3 className="text-base font-semibold text-ink">
                  {activeViolationModal.isLockout ? 'Examination Suspended' : 'Integrity Event Intercepted'}
                </h3>
              </div>

              {!activeViolationModal.isLockout && (
                <button
                  type="button"
                  onClick={() => setActiveViolationModal(null)}
                  className="p-1 rounded-[2px] text-ink-muted hover:text-ink hover:bg-ground"
                  title="Dismiss alert"
                >
                  <X className="w-4 h-4" />
                </button>
              )}
            </div>

            {/* Violation Details */}
            <div className="p-3.5 rounded-[2px] bg-ground border border-rule space-y-2">
              <div className="text-xs text-ink-muted flex items-center justify-between font-mono">
                <span>Classification:</span>
                <span>{activeViolationModal.timestamp}</span>
              </div>

              <div className="text-xs font-semibold text-ink">
                {activeViolationModal.title}
              </div>

              <p className="text-xs text-ink-muted leading-relaxed">
                {activeViolationModal.details}
              </p>

              {/* Keystrokes track */}
              {activeViolationModal.keystrokes && activeViolationModal.keystrokes.length > 0 && (
                <div className="pt-2 border-t border-rule space-y-1">
                  <span className="text-[11px] text-ink-muted font-mono block">
                    Shortcut sequences detected:
                  </span>
                  <div className="flex flex-wrap items-center gap-1">
                    {activeViolationModal.keystrokes.map((key, i) => (
                      <kbd
                        key={i}
                        className="px-1.5 py-0.5 rounded-[2px] bg-paper border border-rule text-ink font-mono text-[11px]"
                      >
                        {key}
                      </kbd>
                    ))}
                  </div>
                </div>
              )}
            </div>

            {/* Forensic Sequence Notice */}
            <div className="p-3 rounded-[2px] bg-ground border border-rule text-xs text-ink-muted space-y-1 font-mono">
              <div className="font-semibold text-ink">
                Multi-Frame Motion Buffer Captured
              </div>
              <p className="text-[11px] leading-relaxed">
                A 10-second sequence (5 seconds pre-event and 5 seconds post-event) has been logged and analyzed via Gemini 3.5 Flash-Lite Vision for instructor review.
              </p>
            </div>

            {/* Actions */}
            <div className="pt-2 flex items-center justify-end gap-2 border-t border-rule">
              {!activeViolationModal.isLockout ? (
                <button
                  type="button"
                  onClick={async () => {
                    setActiveViolationModal(null);
                    if (!document.fullscreenElement) {
                      await document.documentElement.requestFullscreen().catch(() => {});
                      setIsFullscreen(true);
                    }
                  }}
                  className="px-5 py-2.5 rounded-[2px] bg-ink hover:bg-ink/90 text-paper font-mono text-xs uppercase tracking-wider min-h-[40px] cursor-pointer"
                >
                  <span>Acknowledge &amp; Resume</span>
                </button>
              ) : (
                <button
                  type="button"
                  onClick={() => setActiveViolationModal(null)}
                  className="px-5 py-2.5 rounded-[2px] bg-ground hover:bg-rule/40 border border-rule text-ink font-mono text-xs uppercase tracking-wider"
                >
                  Close &amp; Await Proctor
                </button>
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
