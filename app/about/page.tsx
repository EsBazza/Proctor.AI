import React from 'react';
import Image from 'next/image';
import Link from 'next/link';
import { 
  Cpu, 
  Layers, 
  Database, 
  ShieldCheck, 
  Sparkles, 
  Video, 
  GraduationCap, 
  BarChart3, 
  CheckCircle2, 
  Lock, 
  ArrowRight, 
  Code2, 
  Server, 
  Boxes, 
  Zap, 
  Check, 
  Clock,
  Terminal,
  FileSpreadsheet
} from 'lucide-react';

export const metadata = {
  title: 'About Proctor.AI — Tech Stack, Architecture & Features',
  description: 'Explore the modern technology stack, isomorphic assessment engine, and multi-frame motion forensic proctoring architecture behind Proctor.AI.',
};

export default function AboutPage() {
  const techStack = [
    {
      category: 'Frontend & UI Engineering',
      description: 'Modern, high-performance web architecture engineered for sub-second responsive interaction and zero cognitive distraction.',
      icon: Code2,
      badge: 'React 19 + Next.js 16',
      color: 'from-blue-600 to-cyan-600',
      items: [
        { name: 'Next.js 16 (App Router)', role: 'Server Components, Server Actions & Route Handlers' },
        { name: 'React 19', role: 'Concurrent rendering and optimized state primitives' },
        { name: 'Tailwind CSS v4 & OKLCH', role: 'Next-gen CSS theme tokens with guaranteed contrast ratios' },
        { name: 'Plus Jakarta Sans', role: 'Humanist geometric typography for headings & UI' },
        { name: 'Geist Mono', role: 'Precision monospace with tabular figures for telemetry & code' },
        { name: 'Lucide React', role: 'Accessible vector iconography suite' },
      ],
    },
    {
      category: 'AI & Machine Intelligence',
      description: 'Generative and vision AI pipeline powering isomorphic variant derivation, Bloom’s taxonomy equivalence, and real-time vision forensics.',
      icon: Cpu,
      badge: 'Google Gemini 2.5 Flash',
      color: 'from-indigo-600 to-purple-600',
      items: [
        { name: 'Google Gemini 2.5 Flash', role: 'Sub-second structured isomorphic question generation' },
        { name: 'Gemini Vision AI', role: 'Multi-frame visual threat categorization on 10s ring buffer' },
        { name: 'Bloom’s Taxonomy L1–L6 Engine', role: 'Cognitive objective validation ensuring difficulty parity' },
        { name: 'Automated Rubric Grader', role: 'Multi-criteria formative evaluation with tailored feedback' },
      ],
    },
    {
      category: 'Backend & Data Infrastructure',
      description: 'Relational data persistence with strict cryptographic hashing and session tokenization.',
      icon: Server,
      badge: 'PostgreSQL + Prisma ORM',
      color: 'from-emerald-600 to-teal-600',
      items: [
        { name: 'PostgreSQL', role: 'ACID-compliant relational database for exam records' },
        { name: 'Prisma ORM v6', role: 'Type-safe database client and schema migrations' },
        { name: 'NextAuth.js v5 (Auth.js)', role: 'Google OAuth 2.0 authentication and session management' },
        { name: 'Node.js Crypto (SHA-256)', role: 'Deterministic candidate variation seeding & link generation' },
      ],
    },
    {
      category: 'Institutional Integrations',
      description: 'Native bidirectional connectivity with educational ecosystems and learning management systems.',
      icon: Boxes,
      badge: 'Google Classroom API',
      color: 'from-amber-600 to-orange-600',
      items: [
        { name: 'Google Classroom API v1', role: 'Live course discovery, roster imports & student synchronization' },
        { name: 'Google CourseWork API', role: 'Automatic private assignment creation with tokenized URLs' },
        { name: 'Google Gradebook Sync', role: 'Direct one-click rubric grade release and score return' },
        { name: 'Veyon-Inspired Flight Board', role: 'Dense multi-student monitoring grid with instant lockout' },
      ],
    },
  ];

  const primaryFeatures = [
    {
      title: 'Isomorphic Question Engine',
      subtitle: 'Defeating Collusion at the Conceptual Source',
      icon: Sparkles,
      tag: 'Core Innovation',
      description: 'Traditional exam platforms rely on question order shuffling, which is immediately bypassed by students sharing prompt snippets or querying LLMs. Proctor.AI generates structurally distinct, conceptually isomorphic questions per candidate. Each student solves a completely different numerical and situational problem measuring the exact same cognitive objective.',
      stats: ['100% Anti-Collusion', 'Bloom L1–L6 Parity', 'Zero Question Leakage'],
    },
    {
      title: '10-Second Multi-Frame Forensics',
      subtitle: 'Continuous Pre/Post Incident Video Ring Buffer',
      icon: Video,
      tag: 'Proctoring Intelligence',
      description: 'Rather than recording continuous massive video files or performing invasive eye-tracking, Proctor.AI maintains a rolling 1-fps memory ring buffer. When an anomaly occurs (e.g. window blur, split screen, unauthorized keyboard shortcut), the system captures the previous 5 seconds (T-5s to T-1s), the trigger (T0), and the subsequent 5 seconds (T+1s to T+5s) alongside full keystroke telemetry for conclusive educator review.',
      stats: ['5s Pre / 5s Post Buffer', 'Gemini Vision Threat Tagging', 'Zero False Lockouts'],
    },
    {
      title: 'Bi-Directional Google Classroom Synchronization',
      subtitle: 'Native Integration with Zero Manual CSV Exports',
      icon: Layers,
      tag: 'Educator Workflow',
      description: 'Proctor.AI integrates natively into the Google Workspace for Education ecosystem. Instructors select their Classroom course to automatically import rosters, generate individual tokenized exam links as CourseWork assignments, and sync graded scores directly into their Classroom gradebook upon grade release.',
      stats: ['Instant Roster Retrieval', 'Automated CourseWork Dispatch', 'One-Click Gradebook Sync'],
    },
    {
      title: 'Teacher Flight Board & Live Grid',
      subtitle: 'Sub-Second Classroom Oversight & Instant Unlocks',
      icon: BarChart3,
      tag: 'Live Operations',
      description: 'Inspired by air traffic control flight boards and Veyon lab management, the Teacher Flight Board provides a high-density tabular matrix of all active examinees. Teachers can view live progress, inspect forensic snapshot filmstrips, issue strike warnings, or unlock students with a single click.',
      stats: ['Sub-Second Telemetry', 'Forensic Filmstrip Viewer', 'Instant Strike Override'],
    },
    {
      title: '7 Comprehensive Question Formats',
      subtitle: 'Versatility from STEM Proofs to Open Formative Essays',
      icon: FileSpreadsheet,
      tag: 'Curriculum Flexibility',
      description: 'Authors can build rich assessments featuring Multiple Choice, Multi-Select Checkboxes, Numeric Tolerance with Units, Step-by-Step Proof Derivations, Code Writing with syntax highlighting, Fill-in-the-Blank, and Open Formative Essays evaluated with AI rubrics.',
      stats: ['LaTeX Math Support', 'Tolerance Bounds (±X%)', 'Step Proof Auto-Grading'],
    },
    {
      title: 'Educator Fatigue Savings Engine',
      subtitle: 'Reclaiming 4–8 Hours per Testing Cycle',
      icon: Clock,
      tag: 'Teacher Productivity',
      description: 'Drafting high-rigor exams and grading hundreds of submissions is a leading cause of educator burnout. Proctor.AI ingests existing lecture slides, syllabi, or PDF notes and synthesizes complete isomorphic assessment suites in under 60 seconds, accompanied by instant automated formative rubric evaluation.',
      stats: ['85% Authoring Time Saved', 'Instant Rubric Synthesis', 'Zero Manual Copying'],
    },
  ];

  return (
    <div className="min-h-screen bg-slate-50/50 flex flex-col font-sans">
      {/* 1. HERO HEADER */}
      <section className="relative w-full pt-12 pb-16 lg:pt-16 lg:pb-20 bg-white border-b border-slate-200 overflow-hidden">
        <div className="absolute top-0 right-1/4 w-96 h-96 bg-[#9CC7E6]/20 rounded-full blur-3xl pointer-events-none" />
        <div className="absolute bottom-0 left-1/4 w-96 h-96 bg-[#123A63]/10 rounded-full blur-3xl pointer-events-none" />

        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 relative z-10 space-y-6">
          <div className="flex items-center gap-3.5">
            <div className="relative w-10 h-13 sm:w-12 sm:h-15 flex-shrink-0">
              <Image src="/1.png" alt="Proctor.AI" fill sizes="48px" className="object-contain" />
            </div>
            <div className="relative w-48 sm:w-56 h-7 sm:h-8 flex-shrink-0">
              <Image src="/3.png" alt="Proctor.AI" fill sizes="224px" className="object-contain" />
            </div>
          </div>



          <div className="max-w-3xl space-y-4">
            <h1 className="text-3xl sm:text-4xl lg:text-5xl font-extrabold text-[#0B1D39] tracking-tight leading-tight font-sans">
              Re-Engineering Academic Evaluation for the AI Era
            </h1>
            <p className="text-sm sm:text-base font-mono text-[#576375] leading-relaxed">
              Proctor.AI is built to solve the crisis of digital test security, educator grading fatigue, and tool fragmentation. By pairing mathematically seeded isomorphic variation with continuous 10-second multi-frame video forensics and native Google Classroom synchronization, Proctor.AI ensures fair, authentic assessment for every student.
            </p>
          </div>
        </div>
      </section>

      {/* 2. TECHNOLOGY STACK BENTO */}
      <section className="py-16 sm:py-20 bg-slate-50 border-b border-slate-200">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 space-y-12">
          <div className="max-w-2xl space-y-2">
            <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-mono font-bold uppercase tracking-wider bg-[#123A63]/10 text-[#123A63]">
              <Code2 className="w-3.5 h-3.5" />
              Production Architecture
            </span>
            <h2 className="text-2xl sm:text-3xl lg:text-4xl font-extrabold text-[#0B1D39] font-sans tracking-tight">
              The Modern Technology Stack
            </h2>
            <p className="text-xs sm:text-sm font-mono text-[#576375] leading-relaxed">
              Built on battle-tested frameworks and frontier AI APIs for performance, scalability, and airtight security.
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {techStack.map((tech) => {
              const Icon = tech.icon;
              return (
                <div
                  key={tech.category}
                  className="p-6 sm:p-8 rounded-3xl bg-white border border-[#0B1D39]/10 shadow-sm hover:shadow-md transition-all space-y-5 flex flex-col justify-between"
                >
                  <div className="space-y-4">
                    <div className="flex items-center justify-between">
                      <div className="w-12 h-12 rounded-2xl bg-[#0B1D39]/5 text-[#123A63] flex items-center justify-center">
                        <Icon className="w-6 h-6" />
                      </div>
                      <span className="px-3 py-1 rounded-full text-xs font-mono font-bold bg-[#9CC7E6]/20 text-[#123A63] border border-[#9CC7E6]/40">
                        {tech.badge}
                      </span>
                    </div>

                    <div>
                      <h3 className="text-lg sm:text-xl font-bold text-[#0B1D39] font-sans">
                        {tech.category}
                      </h3>
                      <p className="text-xs sm:text-sm font-mono text-[#576375] mt-1 leading-relaxed">
                        {tech.description}
                      </p>
                    </div>

                    {/* Stack List */}
                    <div className="space-y-2.5 pt-2 border-t border-slate-100">
                      {tech.items.map((item, idx) => (
                        <div
                          key={idx}
                          className="flex flex-col sm:flex-row sm:items-baseline justify-between gap-1 p-2.5 rounded-xl bg-slate-50/70 border border-slate-100 text-xs"
                        >
                          <span className="font-bold text-[#0B1D39] font-sans">{item.name}</span>
                          <span className="font-mono text-[#576375] text-[11px]">{item.role}</span>
                        </div>
                      ))}
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      </section>

      {/* 3. PRIMARY FEATURES DEEP DIVE */}
      <section className="py-16 sm:py-20 bg-white border-b border-slate-200">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 space-y-12">
          <div className="text-center max-w-2xl mx-auto space-y-2">
            <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-mono font-bold uppercase tracking-wider bg-[#0B1D39]/5 text-[#0B1D39]">
              <Sparkles className="w-3.5 h-3.5 text-[#2F5D8A]" />
              Core Capabilities
            </span>
            <h2 className="text-2xl sm:text-3xl lg:text-4xl font-extrabold text-[#0B1D39] font-sans tracking-tight">
              Primary System Features
            </h2>
            <p className="text-xs sm:text-sm font-mono text-[#576375] leading-relaxed">
              Every feature of Proctor.AI is purposeful, privacy-conscious, and calibrated for academic integrity.
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {primaryFeatures.map((feat) => {
              const Icon = feat.icon;
              return (
                <div
                  key={feat.title}
                  className="p-6 sm:p-7 rounded-3xl bg-slate-50/70 border border-[#0B1D39]/10 shadow-2xs hover:shadow-md transition-all space-y-4 flex flex-col justify-between"
                >
                  <div className="space-y-3">
                    <div className="flex items-center justify-between">
                      <div className="w-10 h-10 rounded-xl bg-[#123A63] text-white flex items-center justify-center">
                        <Icon className="w-5 h-5" />
                      </div>
                      <span className="font-mono text-[11px] text-[#576375] uppercase tracking-wider font-semibold">
                        {feat.tag}
                      </span>
                    </div>

                    <div>
                      <h3 className="text-base sm:text-lg font-bold text-[#0B1D39] font-sans leading-snug">
                        {feat.title}
                      </h3>
                      <div className="text-xs font-mono text-[#2F5D8A] font-semibold mt-0.5">
                        {feat.subtitle}
                      </div>
                    </div>

                    <p className="text-xs font-mono text-[#576375] leading-relaxed">
                      {feat.description}
                    </p>
                  </div>

                  <div className="pt-3 border-t border-slate-200/80 space-y-1.5">
                    {feat.stats.map((st, i) => (
                      <div key={i} className="flex items-center gap-1.5 text-xs font-mono text-[#0B1D39]">
                        <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600 flex-shrink-0" />
                        <span>{st}</span>
                      </div>
                    ))}
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      </section>

      {/* 4. ARCHITECTURE PIPELINE FLOW */}
      <section className="py-16 sm:py-20 bg-slate-50 border-b border-slate-200">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 space-y-10">
          <div className="max-w-2xl space-y-2">
            <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-mono font-bold uppercase tracking-wider bg-[#123A63]/10 text-[#123A63]">
              <Zap className="w-3.5 h-3.5" />
              End-to-End Pipeline
            </span>
            <h2 className="text-2xl sm:text-3xl lg:text-4xl font-extrabold text-[#0B1D39] font-sans tracking-tight">
              Assessment Lifecycle Architecture
            </h2>
            <p className="text-xs sm:text-sm font-mono text-[#576375] leading-relaxed">
              From syllabus ingestion to grade return in 5 automated phases.
            </p>
          </div>

          {/* Visual Step-by-Step Flow */}
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-4">
            {[
              {
                step: '01',
                name: 'Curriculum Ingestion',
                desc: 'Upload syllabus PDFs or lecture notes. Gemini extracts core learning objectives and taxonomy levels.',
              },
              {
                step: '02',
                name: 'Isomorphic Synthesis',
                desc: 'Synthesizes seed-based variants with equivalent mathematical rigor and Bloom levels.',
              },
              {
                step: '03',
                name: 'Classroom Dispatch',
                desc: 'Pushes private CourseWork assignments to Google Classroom with unique student access tokens.',
              },
              {
                step: '04',
                name: '10s Motion Forensics',
                desc: 'Continuous circular ring buffer proctoring with AI threat categorization and Flight Board monitoring.',
              },
              {
                step: '05',
                name: 'AI Grading & Return',
                desc: 'Instant rubric-based formative grading synced directly back to Google Classroom gradebook.',
              },
            ].map((phase, idx) => (
              <div
                key={phase.step}
                className="p-5 rounded-2xl bg-white border border-[#0B1D39]/10 shadow-2xs space-y-3 relative group hover:border-[#123A63]/40 transition-colors"
              >
                <div className="flex items-center justify-between">
                  <span className="text-xl font-extrabold font-mono text-[#123A63]">
                    {phase.step}
                  </span>
                  <span className="w-2 h-2 rounded-full bg-[#9CC7E6]" />
                </div>
                <h4 className="text-sm font-bold text-[#0B1D39] font-sans">
                  {phase.name}
                </h4>
                <p className="text-xs font-mono text-[#576375] leading-relaxed">
                  {phase.desc}
                </p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* 5. CTA SECTION */}
      <section className="py-16 sm:py-20 bg-white">
        <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 text-center space-y-6">
          <h2 className="text-2xl sm:text-3xl lg:text-4xl font-extrabold text-[#0B1D39] font-sans tracking-tight">
            Ready to experience Proctor.AI in your classroom?
          </h2>
          <p className="text-sm font-mono text-[#576375] max-w-xl mx-auto leading-relaxed">
            Sign in with your Google Workspace account or return home to access active examination sessions.
          </p>
          <div className="flex flex-col sm:flex-row items-center justify-center gap-4 pt-2">
            <Link
              href="/teacher"
              className="w-full sm:w-auto inline-flex items-center justify-center gap-2 px-8 py-3.5 rounded-xl bg-[#0B1D39] hover:bg-[#123A63] text-white font-bold text-sm shadow-md transition-all font-sans"
            >
              <span>Get Started</span>
              <ArrowRight className="w-4 h-4" />
            </Link>

            <Link
              href="/"
              className="w-full sm:w-auto inline-flex items-center justify-center gap-2 px-8 py-3.5 rounded-xl bg-slate-100 hover:bg-slate-200 text-[#0B1D39] font-semibold text-sm transition-colors font-sans border border-slate-200"
            >
              <span>Back to Home</span>
            </Link>
          </div>
        </div>
      </section>

      {/* FOOTER */}
      <footer className="border-t border-slate-200 bg-slate-50 py-10">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 flex flex-col sm:flex-row items-center justify-between gap-4">
          <Link href="/" className="flex items-center gap-2.5 group">
            <div className="relative w-8 h-10 flex-shrink-0">
              <Image src="/1.png" alt="Proctor.AI Emblem" fill sizes="32px" className="object-contain" />
            </div>
            <div className="relative w-44 sm:w-52 h-7 sm:h-8 flex-shrink-0">
              <Image src="/3.png" alt="Proctor.AI" fill sizes="208px" className="object-contain" />
            </div>
          </Link>

          <div className="flex items-center gap-6 text-xs font-semibold text-[#576375] font-sans">
            <Link href="/" className="hover:text-[#0B1D39] transition-colors">Home</Link>
            <Link href="/about" className="hover:text-[#0B1D39] transition-colors">About</Link>
            <Link href="/teacher" className="hover:text-[#0B1D39] transition-colors">Teacher Portal</Link>
          </div>
          <div className="text-[11px] font-mono text-[#576375]/80">
            © 2026 Proctor.AI Inc.
          </div>
        </div>
      </footer>
    </div>
  );
}
