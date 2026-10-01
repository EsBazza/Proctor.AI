'use client';

import React, { useState, useEffect } from 'react';
import { 
  Sparkles, 
  Cpu, 
  CheckCircle2, 
  Loader2, 
  ShieldCheck, 
  BookOpen, 
  Users, 
  Layers, 
  Terminal,
  Activity
} from 'lucide-react';

interface AIExamGenerationModalProps {
  isOpen: boolean;
  title: string;
  subject: string;
  candidateCount: number;
  questionCount: number;
  maxStrikes: number;
  questionTypes: string[];
}

interface PipelineStage {
  id: number;
  title: string;
  subtitle: string;
  icon: React.ComponentType<{ className?: string }>;
  startSecond: number;
  targetPercent: number;
}

const PIPELINE_STAGES: PipelineStage[] = [
  {
    id: 1,
    title: 'Curriculum & Source Ingestion',
    subtitle: 'Tokenizing syllabus, documents & core pedagogical anchors with Gemini 3.5 Flash',
    icon: BookOpen,
    startSecond: 0,
    targetPercent: 22
  },
  {
    id: 2,
    title: 'Pedagogical Blueprinting',
    subtitle: 'Structuring cognitive depth, Bloom taxonomy levels & multi-type question matrices',
    icon: Layers,
    startSecond: 3,
    targetPercent: 46
  },
  {
    id: 3,
    title: 'Anti-Collusion Variant Generation',
    subtitle: 'Crafting unique isomorphic stems, varied numerical parameters & distinct distractors per student',
    icon: Users,
    startSecond: 7,
    targetPercent: 74
  },
  {
    id: 4,
    title: 'Rubric & Scoring Calibration',
    subtitle: 'Synthesizing automated grading keys, essay criteria & point distribution formulas',
    icon: Cpu,
    startSecond: 13,
    targetPercent: 90
  },
  {
    id: 5,
    title: 'Security Minting & Flight Board Init',
    subtitle: 'Generating candidate access tokens and preparing real-time telemetry matrix',
    icon: ShieldCheck,
    startSecond: 18,
    targetPercent: 98
  }
];

export function AIExamGenerationModal({
  isOpen,
  title,
  subject,
  candidateCount,
  questionCount,
  maxStrikes,
  questionTypes
}: AIExamGenerationModalProps) {
  const [secondsElapsed, setSecondsElapsed] = useState(0);
  const [currentStageIdx, setCurrentStageIdx] = useState(0);
  const [simulatedProgress, setSimulatedProgress] = useState(5);
  const [terminalLogs, setTerminalLogs] = useState<string[]>([]);

  useEffect(() => {
    if (!isOpen) {
      setSecondsElapsed(0);
      setCurrentStageIdx(0);
      setSimulatedProgress(5);
      setTerminalLogs([]);
      return;
    }

    const startTime = Date.now();

    // Initial log messages
    const formattedTypes = questionTypes.join(', ');
    setTerminalLogs([
      `[00:00.1] [INITIALIZE] Initializing Gemini 3.5 Flash AI Engine...`,
      `[00:00.4] [PAYLOAD] Target: "${title || 'Assessment'}" | Subject: "${subject || 'General'}"`,
      `[00:00.8] [ROSTER] Roster loaded: ${candidateCount} candidates | ${questionCount} questions per exam`,
      `[00:01.2] [INTEGRITY] Proctored threshold set to ${maxStrikes} strikes per session.`,
      `[00:01.8] [ARCH] Configured question distribution: [${formattedTypes}]`
    ]);

    const timer = setInterval(() => {
      const elapsed = Math.floor((Date.now() - startTime) / 1000);
      setSecondsElapsed(elapsed);

      // Determine active stage based on elapsed time
      let activeIdx = 0;
      for (let i = PIPELINE_STAGES.length - 1; i >= 0; i--) {
        if (elapsed >= PIPELINE_STAGES[i].startSecond) {
          activeIdx = i;
          break;
        }
      }
      setCurrentStageIdx(activeIdx);

      // Smooth progress calculation asymptotically approaching 98%
      const stage = PIPELINE_STAGES[activeIdx];
      const nextStage = PIPELINE_STAGES[activeIdx + 1];
      let progress = stage.targetPercent;
      if (nextStage) {
        const stageDuration = nextStage.startSecond - stage.startSecond;
        const progressInStage = (elapsed - stage.startSecond) / stageDuration;
        progress = stage.targetPercent + Math.min(progressInStage, 0.95) * (nextStage.targetPercent - stage.targetPercent);
      } else {
        // Final stage crawl from 90% to 98%
        progress = Math.min(98, 90 + (elapsed - stage.startSecond) * 0.8);
      }
      setSimulatedProgress(Math.min(98, Math.round(progress)));

      // Dynamic stream logs based on time milestones
      if (elapsed === 4) {
        setTerminalLogs((prev) => [
          ...prev,
          `[00:04.0] [BLUEPRINT] Building Bloom's Taxonomy cognitive matrix across ${questionCount} questions...`
        ]);
      } else if (elapsed === 7) {
        setTerminalLogs((prev) => [
          ...prev,
          `[00:07.0] [ANTI-COLLUSION] Commencing isomorphic variant branching for ${candidateCount} candidates...`
        ]);
      } else if (elapsed === 10) {
        setTerminalLogs((prev) => [
          ...prev,
          `[00:10.2] [SYNTHESIS] Perturbing numerical stems and answer permutations to prevent peer collusion...`
        ]);
      } else if (elapsed === 14) {
        setTerminalLogs((prev) => [
          ...prev,
          `[00:14.0] [CALIBRATION] Formulating evaluation rubrics and automated grading answer keys...`
        ]);
      } else if (elapsed === 18) {
        setTerminalLogs((prev) => [
          ...prev,
          `[00:18.5] [SECURITY] Sealing exam integrity hashes and generating secure session tokens...`
        ]);
      } else if (elapsed === 22) {
        setTerminalLogs((prev) => [
          ...prev,
          `[00:22.0] [PERSISTENCE] Writing isomorphic exam sets to PostgreSQL database...`
        ]);
      }
    }, 1000);

    return () => clearInterval(timer);
  }, [isOpen, title, subject, candidateCount, questionCount, maxStrikes, questionTypes]);

  if (!isOpen) return null;

  const currentStage = PIPELINE_STAGES[currentStageIdx];

  const formatTimer = (secs: number) => {
    const m = Math.floor(secs / 60);
    const s = secs % 60;
    return `${m.toString().padStart(2, '0')}:${s.toString().padStart(2, '0')}s`;
  };

  return (
    <div 
      className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-ink/75 backdrop-blur-md animate-in fade-in duration-300"
      role="dialog"
      aria-modal="true"
    >
      <div className="relative w-full max-w-2xl bg-paper rounded-[3px] border border-rule shadow-2xl overflow-hidden animate-in zoom-in-95 duration-300">
        
        {/* Top Animated Progress Indicator Bar */}
        <div className="h-1.5 w-full bg-ground overflow-hidden relative">
          <div 
            className="h-full bg-gradient-to-r from-amber-500 via-indigo-500 to-emerald-500 transition-all duration-700 ease-out"
            style={{ width: `${simulatedProgress}%` }}
          />
          <div className="absolute inset-0 animate-shimmer" />
        </div>

        {/* Modal Header with Neural Core Orb */}
        <div className="p-6 pb-4 border-b border-rule bg-ground/50">
          <div className="flex items-start justify-between gap-4">
            <div className="flex items-center gap-3.5">
              {/* Outer Pulsing Neural Avatar */}
              <div className="relative flex items-center justify-center w-12 h-12 rounded-[2px] bg-ink text-paper shadow-md">
                <div className="absolute -inset-1 rounded-[2px] bg-gradient-to-tr from-indigo-500 to-amber-500 opacity-40 animate-pulse-glow" />
                <Cpu className="w-6 h-6 relative z-10 animate-float-slow text-paper" />
                <span className="absolute -top-1 -right-1 flex h-3 w-3">
                  <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75"></span>
                  <span className="relative inline-flex rounded-full h-3 w-3 bg-emerald-500"></span>
                </span>
              </div>

              <div>
                <div className="flex items-center gap-2">
                  <h2 className="text-base font-bold text-ink tracking-tight flex items-center gap-1.5">
                    AI Generating Personalized Exams
                  </h2>
                  <span className="px-2 py-0.5 rounded-[2px] bg-indigo-500/10 text-indigo-700 text-[10px] font-mono font-semibold uppercase tracking-wider border border-indigo-500/20">
                    Gemini 3.5 Flash
                  </span>
                </div>
                <p className="text-xs text-ink-muted mt-0.5">
                  Synthesizing <span className="font-semibold text-ink">{candidateCount} unique isomorphic variant{candidateCount !== 1 ? 's' : ''}</span> for &ldquo;{title || 'Assessment'}&rdquo;
                </p>
              </div>
            </div>

            {/* Elapsed Timer Counter */}
            <div className="flex flex-col items-end shrink-0">
              <span className="text-[10px] uppercase tracking-wider font-mono text-ink-muted">Elapsed Time</span>
              <span className="font-mono text-base font-bold text-ink tabular-nums">
                {formatTimer(secondsElapsed)}
              </span>
            </div>
          </div>
        </div>

        {/* Modal Body: Active Stage Spotlight */}
        <div className="p-6 space-y-6">
          {/* Main Active State Card */}
          <div className="p-4 rounded-[2px] bg-ground/80 border border-rule/80 relative overflow-hidden">
            <div className="flex items-center gap-3">
              <div className="w-9 h-9 rounded-[2px] bg-ink/5 border border-ink/10 flex items-center justify-center shrink-0">
                <currentStage.icon className="w-4 h-4 text-ink animate-neural-pulse" />
              </div>
              <div className="flex-1 min-w-0">
                <div className="flex items-center justify-between text-xs">
                  <span className="font-mono font-semibold text-ink uppercase tracking-wider">
                    Stage {currentStage.id} of {PIPELINE_STAGES.length}: {currentStage.title}
                  </span>
                  <span className="font-mono text-xs text-ink-muted">{simulatedProgress}%</span>
                </div>
                <p className="text-xs text-ink-muted mt-0.5 leading-relaxed truncate">
                  {currentStage.subtitle}
                </p>
              </div>
            </div>

            {/* Micro Progress bar inside stage */}
            <div className="mt-3.5 h-1.5 w-full bg-paper rounded-[1px] border border-rule/50 overflow-hidden">
              <div 
                className="h-full bg-ink transition-all duration-500 ease-out"
                style={{ width: `${simulatedProgress}%` }}
              />
            </div>
          </div>

          {/* Stepper Grid (All 5 Stages) */}
          <div className="space-y-2">
            <div className="flex items-center justify-between text-[11px] font-mono text-ink-muted uppercase tracking-wider px-1">
              <span>Pipeline Stages</span>
              <span className="flex items-center gap-1">
                <Activity className="w-3 h-3 text-emerald-600 animate-pulse" />
                Active Synthesis
              </span>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-5 gap-2">
              {PIPELINE_STAGES.map((stage, idx) => {
                const isComplete = idx < currentStageIdx;
                const isCurrent = idx === currentStageIdx;

                return (
                  <div 
                    key={stage.id}
                    className={`p-2.5 rounded-[2px] border text-left transition-all duration-300 ${
                      isComplete 
                        ? 'bg-emerald-500/5 border-emerald-500/30 text-emerald-900' 
                        : isCurrent 
                          ? 'bg-ink text-paper border-ink shadow-sm' 
                          : 'bg-ground/40 border-rule/60 text-ink-muted/70 opacity-60'
                    }`}
                  >
                    <div className="flex items-center justify-between mb-1.5">
                      <span className="font-mono text-[10px] font-bold">0{stage.id}</span>
                      {isComplete ? (
                        <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600" />
                      ) : isCurrent ? (
                        <Loader2 className="w-3.5 h-3.5 text-paper animate-spin" />
                      ) : (
                        <div className="w-2 h-2 rounded-full bg-rule" />
                      )}
                    </div>
                    <div className={`text-[11px] font-semibold leading-tight line-clamp-2 ${isCurrent ? 'text-paper' : ''}`}>
                      {stage.title}
                    </div>
                  </div>
                );
              })}
            </div>
          </div>

          {/* Live AI Reasoning Terminal Stream */}
          <div className="space-y-1.5">
            <div className="flex items-center justify-between text-[11px] font-mono text-ink-muted px-1">
              <span className="flex items-center gap-1.5">
                <Terminal className="w-3.5 h-3.5" />
                <span>AI Orchestrator Thought Stream</span>
              </span>
              <span className="text-[10px] text-ink-muted">Live Stream</span>
            </div>

            <div className="bg-ink text-paper font-mono text-[11px] rounded-[2px] p-3 max-h-32 overflow-y-auto space-y-1 scrollbar-thin border border-rule shadow-inner">
              {terminalLogs.map((log, index) => (
                <div key={index} className="leading-relaxed flex items-start gap-1.5 animate-in fade-in slide-in-from-bottom-1 duration-200">
                  <span className="text-emerald-400 select-none">&gt;</span>
                  <span className={index === terminalLogs.length - 1 ? 'text-amber-300 font-medium' : 'text-slate-300'}>
                    {log}
                  </span>
                </div>
              ))}
              <div className="flex items-center gap-1.5 text-emerald-400 animate-pulse pt-1">
                <span>&gt;</span>
                <span className="inline-block w-1.5 h-3.5 bg-emerald-400 align-middle" />
              </div>
            </div>
          </div>
        </div>

        {/* Modal Footer Safeguard Warning */}
        <div className="p-4 bg-ground border-t border-rule flex flex-col sm:flex-row items-center justify-between gap-3 text-xs text-ink-muted">
          <div className="flex items-center gap-2 text-ink">
            <Sparkles className="w-4 h-4 text-amber-500 shrink-0 animate-spin-slow" />
            <span className="text-[11px]">
              Crafting individualized cognitive variants takes roughly 15–25s.
            </span>
          </div>
          <span className="text-[11px] font-mono text-ink-muted shrink-0">
            Please keep this tab active
          </span>
        </div>

      </div>
    </div>
  );
}
