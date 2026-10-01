'use client';

import React, { useState, useEffect, useMemo } from 'react';
import {
  X,
  Play,
  Pause,
  RotateCcw,
  ChevronLeft,
  ChevronRight,
  Film,
  Keyboard,
  Clock,
  CheckCircle,
  AlertOctagon
} from 'lucide-react';
import { IntegrityLogRecord } from '@/lib/db';
import { BadgeMarker, ThreatLevel } from '@/components/ui/BadgeMarker';
import { Button } from '@/components/ui/Button';

interface ForensicSnapshotViewerProps {
  logs: (IntegrityLogRecord & { studentName?: string })[];
}

export function ForensicSnapshotViewer({ logs }: ForensicSnapshotViewerProps) {
  const [selectedLog, setSelectedLog] = useState<(IntegrityLogRecord & { studentName?: string }) | null>(null);
  const [activeFrameIndex, setActiveFrameIndex] = useState(0);
  const [isPlaying, setIsPlaying] = useState(false);
  const [playbackSpeed, setPlaybackSpeed] = useState<number>(800);
  const [adjudicationStatus, setAdjudicationStatus] = useState<Record<string, 'DISMISSED' | 'CONFIRMED'>>({});

  // Parse frames array from selected log
  const parsedFrames: string[] = useMemo(() => {
    if (!selectedLog) return [];
    if (selectedLog.framesBase64) {
      try {
        const arr = JSON.parse(selectedLog.framesBase64);
        if (Array.isArray(arr) && arr.length > 0) return arr;
      } catch (err) {
        console.warn('Failed to parse framesBase64 JSON:', err);
      }
    }
    if (selectedLog.screenshotBase64) {
      return [selectedLog.screenshotBase64];
    }
    return [];
  }, [selectedLog]);

  // Parse keystrokes from selected log
  const parsedKeystrokes: string[] = useMemo(() => {
    if (!selectedLog?.keystrokesLog) return [];
    try {
      const arr = JSON.parse(selectedLog.keystrokesLog);
      if (Array.isArray(arr)) return arr;
    } catch {
      // ignore
    }
    return [];
  }, [selectedLog]);

  const handleSelectLog = (log: (IntegrityLogRecord & { studentName?: string })) => {
    setSelectedLog(log);
    let count = 0;
    if (log.framesBase64) {
      try {
        const arr = JSON.parse(log.framesBase64);
        if (Array.isArray(arr)) count = arr.length;
      } catch {
        // ignore
      }
    } else if (log.screenshotBase64) {
      count = 1;
    }
    const flagIdx = count > 0 ? Math.min(Math.floor(count / 2), count - 1) : 0;
    setActiveFrameIndex(flagIdx);
    setIsPlaying(false);
  };

  const handleCloseModal = () => {
    setSelectedLog(null);
    setIsPlaying(false);
  };

  useEffect(() => {
    if (!isPlaying || parsedFrames.length <= 1) return;

    const timer = setInterval(() => {
      setActiveFrameIndex((prev) => (prev + 1) % parsedFrames.length);
    }, playbackSpeed);

    return () => clearInterval(timer);
  }, [isPlaying, parsedFrames.length, playbackSpeed]);

  if (logs.length === 0) {
    return (
      <div className="py-10 text-center text-xs font-mono text-ink-muted">
        No integrity incidents recorded. All student examination sessions are clean.
      </div>
    );
  }

  const getFrameRelativeLabel = (index: number, total: number) => {
    if (total <= 1) return 'T 0.0s (Snapshot)';
    const center = Math.floor(total / 2);
    const diff = index - center;
    if (diff === 0) return 'T 0.0s [FLAG TRIGGER]';
    if (diff < 0) return `T ${diff}.0s [PRE-FLAG]`;
    return `T +${diff}.0s [POST-FLAG]`;
  };

  return (
    <>
      <div className="space-y-3">
        {logs.map((log) => {
          const rawThreat = (log.threatRank || 'SUSPICIOUS').toLowerCase() as ThreatLevel;
          const status = adjudicationStatus[log.id];

          let frameCount = 0;
          if (log.framesBase64) {
            try {
              const parsed = JSON.parse(log.framesBase64);
              if (Array.isArray(parsed)) frameCount = parsed.length;
            } catch {}
          } else if (log.screenshotBase64) {
            frameCount = 1;
          }

          let keys: string[] = [];
          if (log.keystrokesLog) {
            try {
              keys = JSON.parse(log.keystrokesLog);
            } catch {}
          }

          return (
            <div
              key={log.id}
              className="p-3.5 rounded-[2px] border border-rule bg-paper space-y-2.5 text-xs font-mono"
            >
              <div className="flex items-start justify-between gap-2 border-b border-rule pb-2">
                <div className="flex items-center gap-2">
                  <BadgeMarker level={rawThreat} />
                  <strong className="text-ink font-semibold">{log.studentName || 'Candidate'}</strong>
                </div>

                <div className="flex items-center gap-2 text-[11px] text-ink-muted">
                  {status ? (
                    <span className={`font-semibold uppercase ${status === 'CONFIRMED' ? 'text-signal' : 'text-verified'}`}>
                      [{status}]
                    </span>
                  ) : null}
                  <span>
                    {new Date(log.timestamp).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit', second: '2-digit' })}
                  </span>
                </div>
              </div>

              <div className="text-ink-muted leading-relaxed font-sans text-xs">
                {log.details || `Logged incident: ${log.eventType}`}
              </div>

              {/* Keystrokes Log */}
              {keys.length > 0 && (
                <div className="flex flex-wrap items-center gap-1.5 text-[11px] pt-0.5">
                  <span className="text-ink-muted flex items-center gap-1">
                    <Keyboard className="w-3 h-3" />
                    <span>Keys:</span>
                  </span>
                  {keys.slice(-6).map((k, i) => (
                    <kbd
                      key={i}
                      className="px-1.5 py-0.5 rounded-[2px] bg-ground border border-rule text-ink font-mono text-[10px]"
                    >
                      {k}
                    </kbd>
                  ))}
                  {keys.length > 6 && (
                    <span className="text-ink-muted text-[10px]">+{keys.length - 6} more</span>
                  )}
                </div>
              )}

              {/* AI Triage Snippet */}
              {log.aiAnalysis && (
                <div className="p-2 rounded-[2px] bg-ground border border-rule text-[11px] text-ink-muted leading-relaxed">
                  <span className="font-semibold text-ink font-mono uppercase text-[10px] block mb-0.5">
                    AI Triage Note:
                  </span>
                  <span>{log.aiAnalysis}</span>
                </div>
              )}

              {/* Inspect Button */}
              {frameCount > 0 && (
                <div className="pt-1 flex items-center justify-between">
                  <button
                    type="button"
                    onClick={() => handleSelectLog(log)}
                    className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-[2px] bg-ground hover:bg-rule/40 border border-rule text-ink font-mono text-[11px] font-medium transition-colors"
                  >
                    <Film className="w-3 h-3 text-ink-muted" />
                    <span>Inspect Forensics ({frameCount} frames)</span>
                  </button>
                  <span className="text-[10px] text-ink-muted font-mono flex items-center gap-1">
                    <Clock className="w-3 h-3" />
                    <span>10s Motion Buffer</span>
                  </span>
                </div>
              )}
            </div>
          );
        })}
      </div>

      {/* Hero Modal: Forensic Inspection Filmstrip */}
      {selectedLog && parsedFrames.length > 0 && (
        <div className="fixed inset-0 z-50 bg-ink/75 flex items-center justify-center p-4">
          <div className="relative max-w-4xl w-full rounded-[2px] bg-paper border border-rule overflow-hidden flex flex-col max-h-[92vh]">
            {/* Modal Header */}
            <div className="px-6 py-4 border-b border-rule flex items-center justify-between bg-ground">
              <div className="space-y-0.5">
                <div className="font-mono text-xs uppercase tracking-wider text-ink-muted">
                  Incident Forensics Filmstrip
                </div>
                <h3 className="text-base font-semibold text-ink">
                  {selectedLog.studentName} — {selectedLog.eventType}
                </h3>
              </div>

              <button
                type="button"
                onClick={handleCloseModal}
                className="p-1 rounded-[2px] text-ink-muted hover:text-ink hover:bg-paper"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            {/* Modal Body */}
            <div className="p-6 overflow-y-auto space-y-5">
              {/* Screen Frame Display Area */}
              <div className="relative rounded-[2px] overflow-hidden border border-rule bg-ground">
                {/* eslint-disable-next-line @next/next/no-img-element */}
                <img
                  src={parsedFrames[activeFrameIndex]}
                  alt={`Violation sequence frame ${activeFrameIndex + 1}`}
                  className="w-full h-auto object-contain max-h-[48vh] mx-auto select-none"
                />

                {/* Overlaid Timestamp & Frame Counter Badge */}
                <div className="absolute top-3 left-3 px-2.5 py-1 rounded-[2px] bg-ink text-paper font-mono text-xs font-medium flex items-center gap-2">
                  <span>{getFrameRelativeLabel(activeFrameIndex, parsedFrames.length)}</span>
                </div>

                <div className="absolute top-3 right-3 px-2 py-1 rounded-[2px] bg-ink/80 text-paper font-mono text-[11px]">
                  Frame {activeFrameIndex + 1} of {parsedFrames.length}
                </div>
              </div>

              {/* Filmstrip Scrubber Controls */}
              {parsedFrames.length > 1 && (
                <div className="p-4 rounded-[2px] bg-ground border border-rule space-y-3 font-mono">
                  {/* Top Control Bar */}
                  <div className="flex flex-wrap items-center justify-between gap-3 text-xs">
                    <div className="flex items-center gap-2">
                      <Button
                        type="button"
                        onClick={() => setIsPlaying(!isPlaying)}
                        variant="primary"
                        size="sm"
                        className="font-mono text-xs"
                      >
                        {isPlaying ? (
                          <span className="inline-flex items-center gap-1.5">
                            <Pause className="w-3 h-3 fill-current" />
                            <span>Pause</span>
                          </span>
                        ) : (
                          <span className="inline-flex items-center gap-1.5">
                            <Play className="w-3 h-3 fill-current" />
                            <span>Play</span>
                          </span>
                        )}
                      </Button>

                      <button
                        type="button"
                        onClick={() => {
                          setIsPlaying(false);
                          setActiveFrameIndex((prev) => (prev > 0 ? prev - 1 : parsedFrames.length - 1));
                        }}
                        className="p-1.5 rounded-[2px] bg-paper border border-rule text-ink hover:bg-ground"
                        title="Step backward"
                      >
                        <ChevronLeft className="w-3.5 h-3.5" />
                      </button>

                      <button
                        type="button"
                        onClick={() => {
                          setIsPlaying(false);
                          setActiveFrameIndex((prev) => (prev < parsedFrames.length - 1 ? prev + 1 : 0));
                        }}
                        className="p-1.5 rounded-[2px] bg-paper border border-rule text-ink hover:bg-ground"
                        title="Step forward"
                      >
                        <ChevronRight className="w-3.5 h-3.5" />
                      </button>

                      <button
                        type="button"
                        onClick={() => {
                          setIsPlaying(false);
                          setActiveFrameIndex(Math.floor(parsedFrames.length / 2));
                        }}
                        className="inline-flex items-center gap-1 px-2.5 py-1 rounded-[2px] bg-paper border border-rule text-ink text-xs hover:bg-ground"
                      >
                        <RotateCcw className="w-3 h-3 text-signal" />
                        <span>Reset to Flag</span>
                      </button>
                    </div>

                    <div className="flex items-center gap-1.5 text-xs text-ink-muted">
                      <span>Rate:</span>
                      {[
                        { label: '0.5x', speed: 1400 },
                        { label: '1x', speed: 800 },
                        { label: '2x', speed: 400 }
                      ].map((item) => (
                        <button
                          key={item.label}
                          type="button"
                          onClick={() => setPlaybackSpeed(item.speed)}
                          className={`px-2 py-0.5 rounded-[2px] border text-xs ${
                            playbackSpeed === item.speed
                              ? 'bg-ink text-paper border-ink font-semibold'
                              : 'bg-paper text-ink border-rule hover:bg-ground'
                          }`}
                        >
                          {item.label}
                        </button>
                      ))}
                    </div>
                  </div>

                  {/* Filmstrip Track */}
                  <div className="space-y-1.5 pt-1">
                    <div className="flex items-center justify-between text-[10px] text-ink-muted font-mono">
                      <span>← 5s Pre-Event (Exam View)</span>
                      <span className="font-semibold text-signal">[FLAG TRIGGER]</span>
                      <span>5s Post-Event (External Activity) →</span>
                    </div>

                    <div className="grid grid-cols-11 gap-1">
                      {parsedFrames.map((_, idx) => {
                        const center = Math.floor(parsedFrames.length / 2);
                        const isFlag = idx === center;
                        const isCurrent = idx === activeFrameIndex;

                        let label = `${idx - center}s`;
                        if (isFlag) label = 'FLAG';
                        else if (idx > center) label = `+${idx - center}s`;

                        return (
                          <button
                            key={idx}
                            type="button"
                            onClick={() => {
                              setIsPlaying(false);
                              setActiveFrameIndex(idx);
                            }}
                            className={`py-1.5 px-1 rounded-[2px] text-[10px] font-mono flex flex-col items-center justify-center transition-colors border ${
                              isCurrent
                                ? 'bg-ink text-paper border-ink font-bold ring-1 ring-ink'
                                : isFlag
                                ? 'bg-paper text-signal border-signal/60 font-semibold'
                                : 'bg-paper text-ink border-rule hover:bg-ground'
                            }`}
                          >
                            <span>#{idx + 1}</span>
                            <span className="text-[9px] opacity-80">{label}</span>
                          </button>
                        );
                      })}
                    </div>
                  </div>
                </div>
              )}

              {/* Synchronized Keystroke Track */}
              {parsedKeystrokes.length > 0 && (
                <div className="p-3.5 rounded-[2px] bg-ground border border-rule space-y-2 font-mono text-xs">
                  <div className="flex items-center justify-between text-ink-muted">
                    <span className="flex items-center gap-1.5 font-semibold text-ink">
                      <Keyboard className="w-3.5 h-3.5" />
                      <span>Pre-Incident Keystroke Shortcuts</span>
                    </span>
                    <span className="text-[10px]">
                      Captured within 8s buffer
                    </span>
                  </div>

                  <div className="flex flex-wrap items-center gap-1.5 pt-0.5">
                    {parsedKeystrokes.map((keyCombo, idx) => (
                      <div key={idx} className="flex items-center gap-1">
                        <kbd className="px-2 py-0.5 rounded-[2px] bg-paper border border-rule text-ink font-mono text-xs">
                          {keyCombo}
                        </kbd>
                        {idx < parsedKeystrokes.length - 1 && (
                          <span className="text-ink-muted text-xs">➔</span>
                        )}
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {/* AI Triage Box (Explicitly Labeled) */}
              {selectedLog.aiAnalysis && (
                <div className="p-4 rounded-[2px] bg-ground border border-rule space-y-2">
                  <div className="flex items-center justify-between font-mono text-xs">
                    <div className="font-semibold text-ink uppercase tracking-wider">
                      AI Triage — Not An Adjudication Finding
                    </div>

                    {selectedLog.threatRank && (
                      <BadgeMarker level={(selectedLog.threatRank.toLowerCase() as ThreatLevel) || 'suspicious'} />
                    )}
                  </div>

                  <p className="text-xs text-ink leading-relaxed font-sans bg-paper p-3 rounded-[2px] border border-rule">
                    {selectedLog.aiAnalysis}
                  </p>
                </div>
              )}
            </div>

            {/* Adjudication Action Footer */}
            <div className="px-6 py-3.5 border-t border-rule bg-ground flex flex-col sm:flex-row items-center justify-between gap-3">
              <div className="text-xs font-mono text-ink-muted">
                {parsedFrames.length} synchronized frames | Instructor verification required
              </div>

              <div className="flex items-center gap-2">
                <Button
                  type="button"
                  variant="secondary"
                  size="sm"
                  onClick={() => {
                    setAdjudicationStatus((prev) => ({ ...prev, [selectedLog.id]: 'DISMISSED' }));
                    handleCloseModal();
                  }}
                  className="font-mono text-xs text-verified"
                >
                  <CheckCircle className="w-3.5 h-3.5 mr-1" />
                  <span>Dismiss Flag</span>
                </Button>

                <Button
                  type="button"
                  variant="secondary"
                  size="sm"
                  onClick={() => {
                    setAdjudicationStatus((prev) => ({ ...prev, [selectedLog.id]: 'CONFIRMED' }));
                    handleCloseModal();
                  }}
                  className="font-mono text-xs text-signal"
                >
                  <AlertOctagon className="w-3.5 h-3.5 mr-1" />
                  <span>Confirm Violation</span>
                </Button>

                <Button
                  type="button"
                  variant="primary"
                  size="sm"
                  onClick={handleCloseModal}
                  className="font-mono text-xs uppercase"
                >
                  <span>Close</span>
                </Button>
              </div>
            </div>
          </div>
        </div>
      )}
    </>
  );
}
