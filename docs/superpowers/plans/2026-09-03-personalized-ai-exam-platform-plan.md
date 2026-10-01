# AI-Powered Personalized Exam & Integrity Analytics Platform
## Implementation Plan

* **Date:** 2026-09-03
* **Target:** Hackathon MVP Prototype (8-Minute Live Pitch Optimized)
* **Tech Stack:** Next.js 16 (App Router, Server Actions, Tailwind CSS, Lucide Icons), Prisma 8 / 7 (SQLite database), Google Gemini 3.6 Flash (`@google/genai` / `@google/generative-ai`), Client-side Integrity Event Listeners.

---

## Proposed Phases & Task Breakdown

### Phase 1: Project Scaffolding & Database Layer
- [ ] Task 1.1: Initialize Next.js 16 App Router project with TypeScript and Tailwind CSS.
- [ ] Task 1.2: Install core packages (`@prisma/client`, `prisma`, `@google/genai` / `@google/generative-ai`, `lucide-react`, `clsx`, `tailwind-merge`, `canvas-confetti`).
- [ ] Task 1.3: Configure `prisma/schema.prisma` with SQLite provider and models (`Exam`, `StudentExam`, `QuestionVariant`, `IntegrityLog`, `ExamAnalytics`).
- [ ] Task 1.4: Run Prisma migrations and generate client (`npx prisma db push && npx prisma generate`).
- [ ] Task 1.5: Set up database client utility (`lib/db.ts`).

---

### Phase 2: AI Engine, Prompts & Stage-Safe Fallback Layer
- [ ] Task 2.1: Implement Gemini 3.6 Flash client (`lib/gemini.ts`):
  - Isomorphic variant generator per student name & learning objectives.
  - Multi-language support prompt adaptation (`English`, `Tagalog`, `Bisaya`).
  - Automated rubric grading & rationale generator for short answers.
  - Cohort-level learning gap synthesis generator.
- [ ] Task 2.2: Implement Stage-Safe Fallback Engine (`lib/fallback-data.ts`):
  - Pre-computed isomorphic variants and AI grading feedback for 3 demo presets (*Biology: Photosynthesis*, *Philippine History: Katipunan*, *Computer Science: Big-O*).
  - Ensures the 8-minute live pitch runs seamlessly even without internet / API keys.
- [ ] Task 2.3: Implement Teacher Fatigue calculation utility (`lib/fatigue.ts`).

---

### Phase 3: Server Actions & Business Logic
- [ ] Task 3.1: `actions/exam.ts`:
  - `createExamAction`: Ingests lesson text or preset, queries Gemini / Fallback to generate isomorphic variants for each student in the roster, persists to SQLite, and returns exam ID + student access tokens.
  - `getExamDetailsAction`: Fetches full exam status, roster overview, and integrity logs for teacher monitoring.
- [ ] Task 3.2: `actions/student.ts`:
  - `getStudentExamAction`: Retrieves student's specific variant by token.
  - `submitStudentExamAction`: Auto-grades student answers (MCQ matching + Gemini short-answer eval), logs score, and marks status as `SUBMITTED`.
  - `logIntegrityEventAction`: Records tab-switches, blur events, or paste attempts with timestamp.
- [ ] Task 3.3: `actions/analytics.ts`:
  - `generateCohortAnalyticsAction`: Synthesizes class-wide mastery and misconceptions using Gemini.
  - `simulateClassCompletionAction`: Instantly populates realistic responses for remaining demo students to immediately unlock class-wide analytics during live demo.

---

### Phase 4: UI Components & Demo Utilities
- [ ] Task 4.1: `DemoSwitcherToolbar` (`components/DemoSwitcherToolbar.tsx`):
  - Floating pitch navigation bar enabling instant 1-click jumps between Teacher View, Student A (Alice - English), Student B (Bob - Tagalog/Bisaya), and "⚡ Simulate All Submissions".
- [ ] Task 4.2: `TeacherFatigueBanner` (`components/TeacherFatigueBanner.tsx`):
  - Highlight card displaying estimated manual authoring + grading time vs AI generation speed.
- [ ] Task 4.3: `IntegrityMonitorGuard` (`components/IntegrityMonitorGuard.tsx`):
  - Client component listening to `visibilitychange`, `window.blur`, `contextmenu`, and `copy/paste`, alerting the user and sending logs to server action.
- [ ] Task 4.4: `CohortMasteryHeatmap` & `LearningGapsCard` (`components/CohortAnalytics.tsx`):
  - Visual concept mastery bars and AI recommendations for the educator.

---

### Phase 5: Pages & User Experience
- [ ] Task 5.1: Landing Page (`app/page.tsx`):
  - Hero section, feature showcase, and 1-Click "Launch Live Demo" button.
- [ ] Task 5.2: Teacher Create Wizard (`app/teacher/create/page.tsx`):
  - Step 1: Preset Lesson Selector / Custom Input.
  - Step 2: Language & Question Configuration.
  - Step 3: Roster Input.
  - Step 4: Live Generation Animation & Fatigue Metric.
- [ ] Task 5.3: Teacher Live Dashboard (`app/teacher/exam/[id]/page.tsx`):
  - Real-time roster table, live integrity feed, and cohort AI mastery report.
- [ ] Task 5.4: Student Code Entry (`app/join/page.tsx`):
  - Simple 6-digit access code and name selector.
- [ ] Task 5.5: Student Exam Room (`app/exam/[token]/page.tsx`):
  - Distraction-free exam taker, countdown timer, isomorphic questions, live integrity banner.
- [ ] Task 5.6: Student Results & AI Feedback (`app/exam/[token]/result/page.tsx`):
  - Score summary and constructive AI pedagogical explanations.

---

### Phase 6: End-to-End Verification & Demo Rehearsal
- [ ] Task 6.1: Run full automated/manual flow test:
  1. Teacher creates exam using preset with English & Tagalog options.
  2. Alice takes English variant, submits with 100%.
  3. Bob takes Tagalog variant, switches tabs twice (verifying integrity logging).
  4. Trigger "⚡ Simulate All Submissions" to populate Charlie & Danica.
  5. Inspect Teacher Dashboard to verify AI Fatigue metrics, real-time integrity alerts, and Cohort Mastery Heatmap.
