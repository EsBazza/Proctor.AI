import React from 'react';
import Image from 'next/image';
import Link from 'next/link';
import { redirect } from 'next/navigation';
import { auth, signIn } from '@/lib/auth';
import { HeroCarousel } from '@/components/HeroCarousel';
import { 
  ShieldCheck, 
  Cpu, 
  Video, 
  GraduationCap, 
  ArrowRight, 
  CheckCircle2, 
  Layers, 
  BarChart3, 
  Clock, 
  FileText
} from 'lucide-react';
import StudentCodeInput from './StudentCodeInput';



export default async function HomePage({
  searchParams
}: {
  searchParams: Promise<{ callbackUrl?: string; code?: string }>;
}) {
  const session = await auth();
  const { callbackUrl, code } = await searchParams;

  const hasValidTarget =
    callbackUrl &&
    callbackUrl !== '/' &&
    !callbackUrl.endsWith(':3000/') &&
    !callbackUrl.endsWith(':3000') &&
    (callbackUrl.startsWith('/exam') || callbackUrl.startsWith('/teacher'));

  if (session && hasValidTarget) {
    redirect(callbackUrl);
  }

  return (
    <div className="min-h-screen bg-white flex flex-col font-sans selection:bg-[#0B1D39] selection:text-white">
      {/* 1. HERO SECTION (Full-Width Carousel Background with Centered Content) */}
      <HeroCarousel>
        <div className="flex flex-col items-center justify-center space-y-6 max-w-3xl mx-auto">
          {/* Centered Logo Lockup: 1.png (Emblem) + 3.png (Textual Logo) */}
          <div className="flex items-center justify-center gap-3.5 sm:gap-5 transition-transform hover:scale-[1.01]">
            <div className="relative w-14 h-18 sm:w-20 sm:h-24 lg:w-24 lg:h-28 flex-shrink-0 drop-shadow-md">
              <Image
                src="/1.png"
                alt="Proctor.AI Emblem"
                fill
                sizes="(max-width: 640px) 56px, (max-width: 1024px) 80px, 96px"
                priority
                className="object-contain"
              />
            </div>
            <div className="relative w-60 sm:w-80 lg:w-96 h-9 sm:h-12 lg:h-14 flex-shrink-0 drop-shadow-sm">
              <Image
                src="/3.png"
                alt="Proctor.AI"
                fill
                sizes="(max-width: 640px) 240px, (max-width: 1024px) 320px, 384px"
                priority
                className="object-contain"
              />
            </div>
          </div>


          {/* Official Tagline */}
          <div className="space-y-3 text-center">
            <h2 className="text-xl sm:text-2xl lg:text-3xl font-extrabold text-[#123A63] tracking-tight font-sans">
              “Smarter Assessments. Stronger Integrity.”
            </h2>
            <p className="text-sm sm:text-base font-mono text-[#576375] max-w-2xl mx-auto leading-relaxed">
              Cryptographically seeded isomorphic examinations measuring identical Bloom’s Taxonomy objectives with real-time 10-second multi-frame motion forensics and native Google Classroom synchronization.
            </p>
          </div>

          {/* Centered Action Center (Teacher Portal CTA) */}
          <div className="w-full max-w-md space-y-4 pt-2">
            {/* Primary Teacher Google Sign-In CTA */}
            {!session ? (
              <form
                action={async () => {
                  'use server';
                  await signIn('google', { redirectTo: '/teacher' });
                }}
              >
                <button
                  type="submit"
                  className="w-full flex items-center justify-center gap-3 px-6 py-4 rounded-xl bg-[#0B1D39] hover:bg-[#123A63] text-white font-bold text-sm sm:text-base shadow-lg hover:shadow-xl transition-all duration-200 active:scale-[0.99] font-sans group cursor-pointer border border-[#0B1D39]"
                >
                  <svg className="w-4 h-4 bg-white p-0.5 rounded" viewBox="0 0 24 24" aria-hidden="true">
                    <path
                      fill="#4285F4"
                      d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"
                    />
                    <path
                      fill="#34A853"
                      d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"
                    />
                    <path
                      fill="#FBBC05"
                      d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.06H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.94l2.85-2.22.81-.63z"
                    />
                    <path
                      fill="#EA4335"
                      d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.06l3.66 2.84c.87-2.6 3.3-4.52 6.16-4.52z"
                    />
                  </svg>
                  <span>Get Started</span>
                  <ArrowRight className="w-4 h-4 transition-transform group-hover:translate-x-1" />
                </button>

              </form>
            ) : session.user?.role === 'TEACHER' ? (
              <div className="p-4 rounded-xl bg-white border border-slate-200 shadow-sm flex items-center justify-between gap-3 text-left">
                <div>
                  <div className="text-xs font-bold text-[#0B1D39] font-sans">Teacher Session Active</div>
                  <div className="text-[11px] font-mono text-[#576375] truncate">{session.user?.email}</div>
                </div>
                <Link
                  href="/teacher"
                  className="px-4 py-2 rounded-lg bg-[#123A63] hover:bg-[#0B1D39] text-white text-xs font-bold font-sans transition-colors inline-flex items-center gap-1.5"
                >
                  <span>Open Ledger</span>
                  <ArrowRight className="w-3.5 h-3.5" />
                </Link>
              </div>
            ) : (
              <StudentCodeInput initialCode={code || ''} userEmail={session.user?.email} variant="hero" />
            )}
          </div>


          {/* Centered Trust Metadata Strip */}
          <div className="flex flex-wrap items-center justify-center gap-4 sm:gap-8 pt-2 text-xs font-mono text-[#576375]">
            <div className="flex items-center gap-1.5">
              <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600" />
              <span>0% Peer & LLM Collusion</span>
            </div>
            <div className="flex items-center gap-1.5">
              <CheckCircle2 className="w-3.5 h-3.5 text-[#2F5D8A]" />
              <span>10s Continuous Ring Buffer</span>
            </div>
            <div className="flex items-center gap-1.5">
              <CheckCircle2 className="w-3.5 h-3.5 text-[#123A63]" />
              <span>Google Classroom Native</span>
            </div>
          </div>
        </div>
      </HeroCarousel>

      {/* 2. CORE SUPERPOWERS BENTO GRID */}
      <section className="py-16 sm:py-20 bg-slate-50 border-b border-slate-200">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 space-y-12">
          {/* Section Header */}
          <div className="text-center max-w-2xl mx-auto space-y-2">
            <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-mono font-bold uppercase tracking-wider bg-[#123A63]/10 text-[#123A63]">
              <Cpu className="w-3.5 h-3.5" />
              Comprehensive Platform Capabilities
            </span>
            <h2 className="text-2xl sm:text-3xl lg:text-4xl font-extrabold text-[#0B1D39] font-sans tracking-tight">
              Designed for Rigor, Fairness, and Speed
            </h2>
            <p className="text-xs sm:text-sm font-mono text-[#576375] leading-relaxed">
              Every feature eliminates testing loopholes while respecting student privacy and educator time.
            </p>
          </div>

          {/* 3 Best Feature Cards with Smooth White Blur Transition */}
          <div className="relative">
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 pb-12">
              {/* Feature 1: Isomorphic Engine */}
              <div className="p-6 sm:p-7 rounded-3xl bg-white border border-slate-200 shadow-2xs hover:shadow-md transition-all space-y-4 flex flex-col justify-between group">
                <div className="space-y-3">
                  <div className="w-12 h-12 rounded-2xl bg-[#123A63]/10 text-[#123A63] flex items-center justify-center group-hover:scale-110 transition-transform">
                    <Cpu className="w-6 h-6" />
                  </div>
                  <h3 className="text-lg font-bold text-[#0B1D39] font-sans">
                    Isomorphic Variant Synthesis
                  </h3>
                  <p className="text-xs sm:text-sm font-mono text-[#576375] leading-relaxed">
                    Generates distinct numerical, contextual, and scenario-based exam variations seeded per student. Every problem measures the exact same Bloom’s Taxonomy cognitive level.
                  </p>
                </div>
                <div className="pt-3 border-t border-slate-100 flex items-center justify-between text-xs font-mono text-[#123A63] font-semibold">
                  <span>Bloom L1 through L6</span>
                  <span className="text-emerald-600">✓ 0% Answer Leaks</span>
                </div>
              </div>

              {/* Feature 2: 10s Multi-Frame Forensics */}
              <div className="p-6 sm:p-7 rounded-3xl bg-white border border-slate-200 shadow-2xs hover:shadow-md transition-all space-y-4 flex flex-col justify-between group">
                <div className="space-y-3">
                  <div className="w-12 h-12 rounded-2xl bg-rose-50 text-rose-600 flex items-center justify-center group-hover:scale-110 transition-transform">
                    <Video className="w-6 h-6" />
                  </div>
                  <h3 className="text-lg font-bold text-[#0B1D39] font-sans">
                    10s Multi-Frame Forensic Buffer
                  </h3>
                  <p className="text-xs sm:text-sm font-mono text-[#576375] leading-relaxed">
                    Continuous circular ring buffer stores 5 seconds pre-event (T-5s to T-1s), records the trigger (T0), and 5 seconds post-event (T+1s to T+5s) with keystroke telemetry.
                  </p>
                </div>
                <div className="pt-3 border-t border-slate-100 flex items-center justify-between text-xs font-mono text-rose-600 font-semibold">
                  <span>T-5s to T+5s Filmstrip</span>
                  <span>Zero False Positives</span>
                </div>
              </div>

              {/* Feature 3: Google Classroom Sync */}
              <div className="p-6 sm:p-7 rounded-3xl bg-white border border-slate-200 shadow-2xs hover:shadow-md transition-all space-y-4 flex flex-col justify-between group">
                <div className="space-y-3">
                  <div className="w-12 h-12 rounded-2xl bg-emerald-50 text-emerald-600 flex items-center justify-center group-hover:scale-110 transition-transform">
                    <Layers className="w-6 h-6" />
                  </div>
                  <h3 className="text-lg font-bold text-[#0B1D39] font-sans">
                    Bi-Directional Google Classroom
                  </h3>
                  <p className="text-xs sm:text-sm font-mono text-[#576375] leading-relaxed">
                    Native integration fetches class rosters, creates private coursework assignments with unique candidate links, and automatically pushes grades into your official gradebook.
                  </p>
                </div>
                <div className="pt-3 border-t border-slate-100 flex items-center justify-between text-xs font-mono text-emerald-600 font-semibold">
                  <span>1-Click Grade Push</span>
                  <span>Zero Secondary Logins</span>
                </div>
              </div>
            </div>

            {/* Smooth White Blur Transition & Centered Show More Button */}
            <div className="absolute inset-x-0 bottom-0 h-36 bg-gradient-to-t from-slate-50 via-slate-50/90 to-transparent flex items-end justify-center pb-2 pointer-events-none">
              <Link
                href="/about"
                className="pointer-events-auto inline-flex items-center gap-2 px-6 py-3 rounded-full bg-white hover:bg-slate-100 text-[#0B1D39] font-bold text-xs sm:text-sm shadow-md hover:shadow-lg border border-slate-200 transition-all font-sans group hover:scale-[1.02] active:scale-[0.98]"
              >
                <span>Show More</span>
                <ArrowRight className="w-4 h-4 transition-transform group-hover:translate-x-1" />
              </Link>
            </div>
          </div>

        </div>
      </section>

      {/* 3. CALL TO ACTION BANNER */}
      <section className="py-16 sm:py-20 bg-white">

        <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 text-center space-y-6">
          <h2 className="text-3xl sm:text-4xl font-extrabold text-[#0B1D39] font-sans tracking-tight">
            Elevate Assessment Rigor in Your Classroom Today
          </h2>
          <p className="text-sm sm:text-base font-mono text-[#576375] max-w-xl mx-auto leading-relaxed">
            Connect your Google Classroom, upload your curriculum materials, and launch cheat-proof isomorphic examinations.
          </p>

          <div className="flex flex-col sm:flex-row items-center justify-center gap-4 pt-4">
            <Link
              href="/teacher"
              className="w-full sm:w-auto inline-flex items-center justify-center gap-2.5 px-8 py-4 rounded-xl bg-[#0B1D39] hover:bg-[#123A63] text-white font-bold text-sm shadow-md hover:shadow-lg transition-all font-sans"
            >
              <span>Get Started</span>
              <ArrowRight className="w-4 h-4" />
            </Link>

            <Link
              href="/about"
              className="w-full sm:w-auto inline-flex items-center justify-center gap-2 px-8 py-4 rounded-xl bg-slate-100 hover:bg-slate-200 text-[#0B1D39] font-semibold text-sm transition-colors font-sans border border-slate-200"
            >
              <span>Explore Tech Stack & Architecture</span>
            </Link>
          </div>
        </div>
      </section>

      {/* 6. SYSTEM FOOTER */}
      <footer className="border-t border-slate-200 bg-slate-50 py-12">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 flex flex-col sm:flex-row items-center justify-between gap-6">
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
            <Link href="/about" className="hover:text-[#0B1D39] transition-colors">About & Tech Stack</Link>
            <Link href="/teacher" className="hover:text-[#0B1D39] transition-colors">Teacher Portal</Link>
          </div>

          <div className="text-[11px] font-mono text-[#576375]/80">
            © 2026 Proctor.AI Inc. All rights reserved.
          </div>
        </div>
      </footer>
    </div>
  );
}
