'use client';

import React, { useState } from 'react';
import { Sparkles, ArrowRight, CheckCircle2, ShieldAlert, Cpu, RefreshCw, Layers } from 'lucide-react';

interface IsomorphicExample {
  subject: string;
  topic: string;
  bloomLevel: string;
  studentA: {
    name: string;
    seed: string;
    prompt: string;
    numbers: string;
    correctAnswer: string;
    cognitiveSteps: string[];
  };
  studentB: {
    name: string;
    seed: string;
    prompt: string;
    numbers: string;
    correctAnswer: string;
    cognitiveSteps: string[];
  };
  equivalenceExplanation: string;
}

const EXAMPLES: IsomorphicExample[] = [
  {
    subject: 'Physics & Calculus',
    topic: 'Kinematics & Instantaneous Acceleration',
    bloomLevel: 'Bloom L4 (Analyze & Differentiate)',
    studentA: {
      name: 'Student A (Roster #08)',
      seed: 'SEED_0x4082_ALPHA',
      prompt: 'A high-altitude meteorological rocket ascends vertically with velocity v(t) = 4t² + 18 m/s. Determine the instantaneous acceleration at timestamp t = 4 seconds.',
      numbers: 'v(t) = 4t² + 18, t = 4s',
      correctAnswer: '32.0 m/s²',
      cognitiveSteps: ['Differentiate velocity to acceleration: a(t) = d/dt (4t² + 18) = 8t', 'Substitute t = 4s: a(4) = 8(4) = 32 m/s²'],
    },
    studentB: {
      name: 'Student B (Roster #24)',
      seed: 'SEED_0x9147_BETA',
      prompt: 'An electric test vehicle accelerates horizontally along a track with velocity v(t) = 6t² + 12 m/s. Determine the instantaneous acceleration at timestamp t = 3 seconds.',
      numbers: 'v(t) = 6t² + 12, t = 3s',
      correctAnswer: '36.0 m/s²',
      cognitiveSteps: ['Differentiate velocity to acceleration: a(t) = d/dt (6t² + 12) = 12t', 'Substitute t = 3s: a(3) = 12(3) = 36 m/s²'],
    },
    equivalenceExplanation: 'Both isomorphic variants evaluate the power rule derivative of a second-order polynomial plus constant, testing the exact same conceptual mastery with zero chance of peer answer-copying.',
  },
  {
    subject: 'Computer Science',
    topic: 'Time Complexity & Algorithmic Recurrence',
    bloomLevel: 'Bloom L5 (Evaluate & Analyze)',
    studentA: {
      name: 'Student A (Roster #08)',
      seed: 'SEED_0x4082_ALPHA',
      prompt: 'Analyze a divide-and-conquer algorithm with recurrence relation T(n) = 2T(n/2) + O(n). Using the Master Theorem, state the tight asymptotic bound Θ.',
      numbers: 'a = 2, b = 2, f(n) = O(n)',
      correctAnswer: 'Θ(n log n)',
      cognitiveSteps: ['Compute log_b(a) = log_2(2) = 1', 'Compare with f(n) = n^1 → Case 2 of Master Theorem: T(n) = Θ(n log n)'],
    },
    studentB: {
      name: 'Student B (Roster #24)',
      seed: 'SEED_0x9147_BETA',
      prompt: 'Analyze a quad-tree spatial indexing algorithm with recurrence relation T(n) = 4T(n/2) + O(n²). Using the Master Theorem, state the tight asymptotic bound Θ.',
      numbers: 'a = 4, b = 2, f(n) = O(n²)',
      correctAnswer: 'Θ(n² log n)',
      cognitiveSteps: ['Compute log_b(a) = log_2(4) = 2', 'Compare with f(n) = n^2 → Case 2 of Master Theorem: T(n) = Θ(n² log n)'],
    },
    equivalenceExplanation: 'Both problems test Case 2 of the Master Theorem requiring logarithmic factor multiplication, keeping cognitive difficulty identical across differing constants.',
  },
];

export function IsomorphicDemo() {
  const [selectedExampleIndex, setSelectedExampleIndex] = useState(0);
  const [activeTab, setActiveTab] = useState<'both' | 'studentA' | 'studentB'>('both');

  const example = EXAMPLES[selectedExampleIndex];

  return (
    <div className="w-full bg-white rounded-3xl border border-[#0B1D39]/15 shadow-xl overflow-hidden">
      {/* Interactive Top Control Bar */}
      <div className="p-4 sm:p-6 bg-slate-50 border-b border-slate-200 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2">
            <span className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-xs font-semibold bg-[#123A63] text-white">
              <Cpu className="w-3.5 h-3.5" />
              Live Isomorphic Engine Simulator
            </span>
            <span className="font-mono text-xs text-[#576375] hidden md:inline">
              Seed Hash Equivalence
            </span>
          </div>
          <h3 className="text-base sm:text-lg font-bold text-[#0B1D39] mt-1.5 font-sans">
            {example.subject}: {example.topic}
          </h3>
        </div>

        {/* Switch Topic Buttons */}
        <div className="flex items-center gap-2">
          {EXAMPLES.map((ex, idx) => (
            <button
              key={ex.subject}
              onClick={() => setSelectedExampleIndex(idx)}
              className={`px-3 py-1.5 rounded-lg text-xs font-semibold transition-all font-sans ${
                selectedExampleIndex === idx
                  ? 'bg-[#0B1D39] text-white shadow-sm'
                  : 'bg-white text-[#576375] hover:text-[#0B1D39] border border-slate-200'
              }`}
            >
              {ex.subject.split(' ')[0]}
            </button>
          ))}
        </div>
      </div>

      {/* Body Content */}
      <div className="p-4 sm:p-6 space-y-6">
        {/* Cognitive Taxonomy Alignment Header */}
        <div className="flex flex-wrap items-center justify-between gap-2 p-3 bg-emerald-50 rounded-xl border border-emerald-200 text-xs font-mono">
          <div className="flex items-center gap-2 text-emerald-900 font-semibold">
            <CheckCircle2 className="w-4 h-4 text-emerald-600" />
            <span>Target Cognitive Rigor: <strong className="text-emerald-950 font-bold">{example.bloomLevel}</strong></span>
          </div>
          <span className="text-emerald-700 font-bold">100% Anti-Cheat Cryptographic Isolation</span>
        </div>

        {/* Side-by-Side Student Comparison Cards */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {/* Student A Card */}
          <div className="p-5 rounded-2xl bg-slate-50/80 border-2 border-[#123A63]/20 space-y-4 hover:border-[#123A63]/50 transition-colors">
            <div className="flex items-center justify-between border-b border-slate-200 pb-3">
              <div className="flex items-center gap-2">
                <div className="w-6 h-6 rounded-md bg-[#123A63] text-white flex items-center justify-center font-mono text-xs font-bold">
                  A
                </div>
                <div>
                  <div className="text-xs font-bold text-[#0B1D39] font-sans">{example.studentA.name}</div>
                  <div className="text-[10px] font-mono text-[#576375]">{example.studentA.seed}</div>
                </div>
              </div>
              <span className="font-mono text-[11px] px-2 py-0.5 rounded bg-blue-100 text-blue-800 font-semibold">
                Variant Alpha
              </span>
            </div>

            <div className="space-y-2">
              <div className="text-[11px] uppercase tracking-wider font-mono text-[#576375] font-semibold">
                Generated Question Prompt:
              </div>
              <p className="text-sm font-sans text-[#0B1D39] leading-relaxed bg-white p-3.5 rounded-xl border border-slate-200 shadow-2xs">
                &ldquo;{example.studentA.prompt}&rdquo;
              </p>
            </div>

            <div className="space-y-1.5 font-mono text-xs">
              <div className="flex items-center justify-between text-[#576375] border-b border-slate-200/80 pb-1.5">
                <span>Variables:</span>
                <span className="font-bold text-[#0B1D39]">{example.studentA.numbers}</span>
              </div>
              <div className="flex items-center justify-between text-emerald-800 font-semibold pt-1">
                <span>Unique Solution Key:</span>
                <span className="font-bold text-sm bg-emerald-100/80 text-emerald-900 px-2 py-0.5 rounded">
                  {example.studentA.correctAnswer}
                </span>
              </div>
            </div>
          </div>

          {/* Student B Card */}
          <div className="p-5 rounded-2xl bg-slate-50/80 border-2 border-[#2F5D8A]/20 space-y-4 hover:border-[#2F5D8A]/50 transition-colors">
            <div className="flex items-center justify-between border-b border-slate-200 pb-3">
              <div className="flex items-center gap-2">
                <div className="w-6 h-6 rounded-md bg-[#2F5D8A] text-white flex items-center justify-center font-mono text-xs font-bold">
                  B
                </div>
                <div>
                  <div className="text-xs font-bold text-[#0B1D39] font-sans">{example.studentB.name}</div>
                  <div className="text-[10px] font-mono text-[#576375]">{example.studentB.seed}</div>
                </div>
              </div>
              <span className="font-mono text-[11px] px-2 py-0.5 rounded bg-sky-100 text-sky-800 font-semibold">
                Variant Beta
              </span>
            </div>

            <div className="space-y-2">
              <div className="text-[11px] uppercase tracking-wider font-mono text-[#576375] font-semibold">
                Generated Question Prompt:
              </div>
              <p className="text-sm font-sans text-[#0B1D39] leading-relaxed bg-white p-3.5 rounded-xl border border-slate-200 shadow-2xs">
                &ldquo;{example.studentB.prompt}&rdquo;
              </p>
            </div>

            <div className="space-y-1.5 font-mono text-xs">
              <div className="flex items-center justify-between text-[#576375] border-b border-slate-200/80 pb-1.5">
                <span>Variables:</span>
                <span className="font-bold text-[#0B1D39]">{example.studentB.numbers}</span>
              </div>
              <div className="flex items-center justify-between text-emerald-800 font-semibold pt-1">
                <span>Unique Solution Key:</span>
                <span className="font-bold text-sm bg-emerald-100/80 text-emerald-900 px-2 py-0.5 rounded">
                  {example.studentB.correctAnswer}
                </span>
              </div>
            </div>
          </div>
        </div>

        {/* Equivalence Summary Box */}
        <div className="p-4 bg-[#0B1D39]/5 rounded-2xl border border-[#0B1D39]/10 space-y-1.5">
          <div className="flex items-center gap-2 text-xs font-bold text-[#0B1D39] uppercase tracking-wider font-mono">
            <Sparkles className="w-3.5 h-3.5 text-[#2F5D8A]" />
            <span>AI Equivalence & Integrity Proof</span>
          </div>
          <p className="text-xs sm:text-sm text-[#576375] leading-relaxed font-sans">
            {example.equivalenceExplanation}
          </p>
        </div>
      </div>
    </div>
  );
}
