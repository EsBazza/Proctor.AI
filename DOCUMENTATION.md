# PatunAI — Comprehensive System Documentation

> **AI-Powered Isomorphic Assessment, Google Classroom Orchestration & Real-Time Multi-Frame Forensic Anti-Cheating Platform**  
> *Tagline:* "Every student gets a different exam. Every exam measures the same thing."  
> *Etymology:* Derived from Tagalog **patunay** (*proof, evidence, testimony*).  
> *Design Register:* Quiet Instrument (Paper & Ledger Registers)  
> *Version:* 2.5.0 | *Last Updated:* October 2026  
> *Production Deployment:* `https://patun-ai.vercel.app`

---

## Table of Contents

1. [Executive Summary & Problem Statement](#1-executive-summary--problem-statement)
2. [Brand Identity & Design Philosophy ("Quiet Instrument")](#2-brand-identity--design-philosophy-quiet-instrument)
3. [High-Level Architecture](#3-high-level-architecture)
4. [Technology Stack](#4-technology-stack)
5. [Database Architecture & Data Models (Prisma PostgreSQL)](#5-database-architecture--data-models-prisma-postgresql)
6. [Google Classroom Deep Integration](#6-google-classroom-deep-integration)
7. [Curriculum Ingestion & Saved Materials Library](#7-curriculum-ingestion--saved-materials-library)
8. [Isomorphic Exam Generation Engine](#8-isomorphic-exam-generation-engine)
9. [Comprehensive 7-Format Question Suite](#9-comprehensive-7-format-question-suite)
10. [Question Count Scaling & Point Valuation Schemes](#10-question-count-scaling--point-valuation-schemes)
11. [Multi-Frame Forensic Anti-Cheating & Security Suite](#11-multi-frame-forensic-anti-cheating--security-suite)
12. [Teacher Flight Board, Forensic Filmstrip Viewer & Instant Unlock](#12-teacher-flight-board-forensic-filmstrip-viewer--instant-unlock)
13. [Student Exam Runner Experience (Paper Register)](#13-student-exam-runner-experience-paper-register)
14. [AI Automated Grading & Cohort Analytics](#14-ai-automated-grading--cohort-analytics)
15. [Teacher Fatigue Savings Engine](#15-teacher-fatigue-savings-engine)
16. [Production Deployment on Vercel](#16-production-deployment-on-vercel)
17. [Project Directory & File Structure](#17-project-directory--file-structure)
18. [Environment Variables & Setup Guide](#18-environment-variables--setup-guide)

---

## 1. Executive Summary & Problem Statement

### 1.1 The Crisis in Digital Assessment
Modern digital academic testing suffers from three compounding vulnerabilities:
1. **Pervasive Collusion & LLM Leakage**: In unproctored or remote digital environments, students bypass question shuffling by communicating via secondary chat windows, mobile phones, or background LLMs (ChatGPT, Claude, Gemini). Traditional test banks and shuffled orders are defeated in seconds.
2. **Teacher Grading Fatigue & Authoring Exhaustion**: Drafting high-rigor exams, deriving equivalent test sets for multiple batches, and grading long-form answers consumes 4–8 hours per test cycle, leading to educator burnout and delayed formative feedback.
3. **Disconnected Tool Silos**: Most assessment platforms exist outside standard institutional ecosystems, requiring instructors to manually export CSVs, maintain secondary student logins, and hand-copy scores back into Google Classroom.

### 1.2 The PatunAI Solution
**PatunAI** re-engineers digital evaluation from the ground up:
- **Mathematically Seeded Isomorphic Variants**: Rather than shuffling identical prompts, PatunAI generates structurally distinct, conceptually equivalent exam variants per student. Every student solves a unique problem measuring identical learning objectives at the same Bloom's Taxonomy cognitive level. Peer answer copying is impossible.
- **Bi-Directional Google Classroom Synchronization**: Live roster retrieval, instant attendance checklists, automatic private CourseWork assignment generation with individual access links, and clean cascading deletions.
- **Continuous 10-Second Multi-Frame Forensics**: A 1 fps ring buffer records 5 seconds prior to an infraction (T-5s to T-1s), captures the trigger event (T0), and continues recording for 5 seconds post-infraction (T+1s to T+5s) alongside captured keystroke sequences. Gemini Vision AI forensic analysis categorizes incidents into actionable threat levels.
- **The "Quiet Instrument" Interface**: Eliminates flashy, anxiety-inducing AI tropes in favor of a calm, distraction-free **Paper Register** for examinees and an efficient, high-density **Ledger Register** for instructors.
- **Formative Automated Grading**: Instant scoring for objective formats and multi-dimensional rubric scoring with personalized pedagogical explanations for open-ended questions.

---

## 2. Brand Identity & Design Philosophy ("Quiet Instrument")

### 2.1 The Two Registers
PatunAI rejects generic "AI SaaS" aesthetics (purple gradients, glowing borders, floating badges) in favor of a professional academic instrument split into two clear operational registers:

1. **The Paper Register (`/`, `/exam/[token]`, `/exam/[token]/result`)**:
   - **Metaphor**: A freshly printed, premium examination booklet on screen.
   - **Characteristics**: Calm, distraction-free, zero distracting animations while reading, long reading measures (62–70 characters), high-legibility book serif question prompts, ruled answer rows, and clean marginal numbering.
   - **Student Mindset**: Reduces cognitive test anxiety and fosters deep focus.

2. **The Ledger Register (`/teacher`, `/teacher/create`, `/teacher/exam/[id]`)**:
   - **Metaphor**: An air traffic control flight board and operations ledger.
   - **Characteristics**: Dense data tables, 1px hairline rules, zero cell rounding, tabular figures (`tnum`) for timers and scores, mono timestamps, and single vermilion signal accents reserved strictly for actionable violations.
   - **Teacher Mindset**: Rapid triage, instant clarity, and decisive classroom management.

### 2.2 Token Palette (Tailwind CSS v4 & OKLCH)
Color values are declared semantically in `app/globals.css` with guaranteed WCAG AAA and AA contrast against the primary paper canvas:

| Token | OKLCH Value | HEX Approx | Semantics & Role |
|---|---|---|---|
| `--color-ink` | `oklch(0.22 0.025 255)` | `#1c2430` | Primary text, titles, deep borders, solid action buttons |
| `--color-ink-muted` | `oklch(0.48 0.02 255)` | `#576375` | Captions, secondary labels, metadata, helper text |
| `--color-paper` | `oklch(0.995 0.002 255)` | `#fcfdfe` | Base paper canvas, exam container background |
| `--color-ground` | `oklch(0.965 0.006 255)` | `#f3f5f8` | Application frame background, table header tint |
| `--color-rule` | `oklch(0.88 0.008 255)` | `#dadfe6` | 1px hairline borders, ruled answer dividing lines |
| `--color-signal` | `oklch(0.60 0.19 35)` | `#dc3812` | Vermilion. Critical strikes, lockout screens, urgent warnings |
| `--color-caution` | `oklch(0.78 0.15 85)` | `#c97f0a` | Ochre/Amber. Unsaved state, pending teacher review |
| `--color-verified` | `oklch(0.52 0.12 155)` | `#217a59` | Forest Sage. Confirmed equivalence, auto-saved, clean status |

### 2.3 Geometric Threat Markers (Accessibility by Design)
Status is never conveyed by color alone. Every threat level pairs color with distinct geometric iconography:
- **Normal / Benign**: Em dash `—` + `"Normal"`
- **Low Concern**: Outline triangle `△` + `"Low"`
- **Suspicious**: Diamond `◇` + `"Suspicious"`
- **Critical Violation**: Solid square `■` + `"Critical"`

### 2.4 Typography Architecture
Configured via `next/font/google` in `app/layout.tsx`:
- **UI & Headings**: `Hanken Grotesk` (`--font-sans`) — Modern humanist sans-serif with complete Philippine diacritic support.
- **Exam Question Prompts**: `Source Serif 4` (`--font-serif`) — Book-weight serif engineered for prolonged reading comfort.
- **Codes, Data, Timers & Keystrokes**: `IBM Plex Mono` (`--font-mono`) with `tnum` (tabular numerals) preventing countdown jitter.

---

## 3. High-Level Architecture

```mermaid
flowchart TD
    subgraph TeacherPortal [Teacher Ledger Register]
        A[Curriculum Ingestion: PDFs, Slides, Past Materials] --> B[Configure 7 Formats, Questions 1-100, Points Scheme]
        B --> C[Google Classroom Roster Sync & Attendance Filter]
        C --> D[Generate Isomorphic Exam Variants via Gemini]
        D --> E[Auto-Publish Private Assignments to Google Classroom]
    end

    subgraph AIEngine [Google Gemini 3.5 & 3.6 Models]
        D --> F[Gemini 3.5 Flash Lite: Synthesize Lesson Topics]
        F --> G[Gemini 3.6 Flash: Derive Isomorphic Blueprint & Variants]
        G --> H[Multilingual Phrasing: English / Tagalog / Bisaya]
    end

    subgraph DatabaseLayer [PostgreSQL / Supabase + Prisma ORM]
        G --> I[(Exams, StudentExams, QuestionVariants, PastMaterials, IntegrityLogs)]
    end

    subgraph StudentPortal [Student Paper Register]
        E --> J[Access Room via Direct Link or 6-Digit Code]
        J --> K[IntegrityGuard: Fullscreen + Screen Stream Ring Buffer]
        K --> L[Answer 7 Question Formats with Auto-Save]
        L --> M[Violation Triggered: Tab Switch, Blur, Fullscreen Exit]
        M --> N[Capture T-5s to T+5s Multi-Frames + Keystrokes]
        N --> O[Gemini Vision Forensic Threat Scoring]
        O --> P{Strike Count == 2?}
        P -- Yes --> Q[Lockout Overlay: Questions & Timer Freeze]
        P -- No --> R[Examinee Completes & Submits Exam]
    end

    subgraph LiveMonitor [Teacher Flight Board & Operations]
        Q --> S[Teacher Reviews 10-Frame Forensic Filmstrip]
        S --> T[1-Click 'Unlock Student' -> Live Auto-Recovery]
        R --> U[AI Automated Grading & Pedagogical Feedback]
        U --> V[Cohort Analytics: Missed Concepts & Next-Lesson Guidance]
        V --> W[Teacher Fatigue Hours Saved Metric]
    end
```

---

## 4. Technology Stack

| Component | Technology | Purpose |
|---|---|---|
| **Web Framework** | Next.js 16.3+ (App Router, Turbopack) | Dynamic server rendering, Server Actions, modern routing |
| **Language** | TypeScript 5 (Strict Mode) | Full type safety across schema, server actions, and client UI |
| **Styling** | Tailwind CSS v4 & OKLCH Theme Tokens | High-contrast, semantic design system adhering to "Quiet Instrument" |
| **Icons** | Lucide React | Clean, scalable iconography |
| **Database** | PostgreSQL (Supabase AWS Pooler / Neon) | Relational persistence with foreign-key cascade enforcement |
| **ORM** | Prisma 6.19+ | Type-safe queries, migrations, and automated client generation |
| **Authentication** | NextAuth.js v5 (Auth.js) | Google OAuth 2.0 with Classroom API scopes & dynamic role detection |
| **AI Models** | Google Gemini (`@google/genai` & `@google/generative-ai`) | `gemini-3.6-flash`, `gemini-3.5-flash-lite`, `gemini-2.5-flash` |
| **Proctoring APIs** | Media Capture API (`getDisplayMedia`), HTML5 Canvas | Browser screen stream buffer & forensic frame capture |
| **Hosting** | Vercel (Edge Network & Serverless Functions) | Production hosting with automated CI/CD and proxy trust |

---

## 5. Database Architecture & Data Models (Prisma PostgreSQL)

All relational models are defined in [`prisma/schema.prisma`](file:///C:/Users/admin/Desktop/hackaton/prisma/schema.prisma):

```
┌─────────────────────────────────┐
│              Exam               │
├─────────────────────────────────┤
│ id (PK: cuid)                   │
│ title, subject, lessonContent   │
│ language (English/Tagalog/Bisaya│
│ questionTypes (CSV of 7 types)  │
│ accessCode (6-digit unique)     │
│ durationMinutes, totalQuestions │
│ googleCourseId, googleCourseName│
│ googleCourseWorkId, teacherEmail│
│ status (ACTIVE / CLOSED)        │
└───────────────┬─────────────────┘
                │ 1:N (Cascade Delete)
                ▼
┌─────────────────────────────────┐       1:N       ┌─────────────────────────────────┐
│           StudentExam           │────────────────▶│         QuestionVariant         │
├─────────────────────────────────┤ (Cascade Delete)├─────────────────────────────────┤
│ id (PK: cuid), examId (FK)      │                 │ id (PK: cuid), studentExamId(FK)│
│ studentName, studentEmail       │                 │ questionIndex (1..N)            │
│ accessCode, accessToken (unique)│                 │ type (7 formats)                │
│ googleCourseWorkId, status      │                 │ conceptTested, difficulty       │
│ totalScore, maxPossibleScore    │                 │ prompt, options (JSON string)   │
│ integrityAlertsCount, strikeCount                 │ correctAnswer, studentAnswer    │
│ lockedAt, submittedAt, startedAt│                 │ isCorrect, pointsAwarded        │
└───────────────┬─────────────────┘                 │ maxPoints, aiExplanation        │
                │ 1:N (Cascade Delete)              └─────────────────────────────────┘
                ▼
┌─────────────────────────────────┐
│          IntegrityLog           │
├─────────────────────────────────┤
│ id (PK: cuid), studentExamId(FK)│
│ eventType (TAB/BLUR/FULLSCREEN) │
│ severity (LOW/MEDIUM/HIGH)      │
│ details, screenshotBase64       │
│ framesBase64 (10-frame JSON)    │
│ keystrokesLog (key sequence JSON│
│ threatRank (CRITICAL..BENIGN)   │
│ threatScore (0..100)            │
│ aiAnalysis (Forensic findings)  │
│ timestamp                       │
└─────────────────────────────────┘

┌─────────────────────────────────┐       ┌─────────────────────────────────┐
│          ExamAnalytics          │       │          PastMaterial           │
├─────────────────────────────────┤       ├─────────────────────────────────┤
│ id (PK), examId (FK, 1:1)       │       │ id (PK: cuid), teacherEmail     │
│ classAverage, highestScore      │       │ fileName, fileSize, mimeType    │
│ lowestScore, completionRate     │       │ title, subject, extractedContent│
│ topMissedConcepts (JSON array)  │       │ createdAt, updatedAt            │
│ aiSynthesisSummary              │       └─────────────────────────────────┘
│ aiRecommendations               │
└─────────────────────────────────┘
```

---

## 6. Google Classroom Deep Integration

Located in [`lib/google-classroom.ts`](file:///C:/Users/admin/Desktop/hackaton/lib/google-classroom.ts) and [`actions/classroom.ts`](file:///C:/Users/admin/Desktop/hackaton/actions/classroom.ts):

### 6.1 OAuth Authorization & Dynamic Teacher Verification
PatunAI requests the following scopes during teacher sign-in:
- `classroom.courses.readonly`
- `classroom.rosters.readonly`
- `classroom.profile.emails`
- `classroom.coursework.students`
- `classroom.coursework.me`

The system queries `classroom.courses.list({ teacherId: 'me', courseStates: ['ACTIVE'] })`. If the user actively instructs one or more Google Classroom courses, the `TEACHER` role is automatically assigned.

### 6.2 Roster Synchronization & Attendance Checklists
- Active student enrollments are synchronized from `courses.students.list`.
- Missing user emails are cross-referenced using `userProfiles.get`.
- Pending course invitees are identified via `invitations.list`.
- **Attendance Checklist**: Teachers can uncheck absent students before generation. Unchecked students are omitted from variant creation, saving AI token overhead and preventing phantom test entries.

### 6.3 Automated Private CourseWork Assignment Publishing
When an exam is published:
1. For each student in the roster, PatunAI calls `classroom.courses.courseWork.create`:
   - `assigneeMode: 'INDIVIDUAL_STUDENTS'`
   - `individualStudentsOptions: { studentIds: [resolvedUserId] }`
   - Direct personal link: `${baseUrl}/exam/${studentAccessToken}`
   - Formatted instructions with the student's unique 6-digit access code and time duration.
   - `maxPoints` set to the exact total exam point value.
2. Each student **only sees their own personalized assignment** in their Google Classroom stream.

### 6.4 Clean Cascading Classroom Deletion
When a teacher clicks **"Delete Exam"**:
1. All associated student Google Classroom coursework assignments are identified.
2. The system executes `classroom.courses.courseWork.delete` for each assignment.
3. Database records cascade-delete cleanly via Prisma foreign-key constraints.

---

## 7. Curriculum Ingestion & Saved Materials Library

Located in [`actions/material.ts`](file:///C:/Users/admin/Desktop/hackaton/actions/material.ts) and [`app/teacher/create/page.tsx`](file:///C:/Users/admin/Desktop/hackaton/app/teacher/create/page.tsx):

### 7.1 Multi-Document Parsing (Gemini 3.5 Flash Lite)
- Instructors upload multiple syllabus files simultaneously (PDFs, `.txt`, scanned photo notes `.png`, `.jpg`).
- The parser processes all files in parallel, extracting subject units, key concepts, formulas, and terminology into clean lesson outlines while reporting token usage.

### 7.2 Saved Materials Library (PostgreSQL Auto-Preservation)
- Extracted curricula are automatically saved to the `PastMaterial` table tied to the instructor's account.
- **Searchable Archive**: Instructors can search historical files by filename, unit title, subject, or keywords.
- **"Use File" Action**: Instantly populates the exam title, subject, and lesson notes with 1 click.
- **"+ Append" Action**: Concatenates multiple past chapters into a single cumulative midterm or final examination.

---

## 8. Isomorphic Exam Generation Engine

Located in [`lib/gemini.ts`](file:///C:/Users/admin/Desktop/hackaton/lib/gemini.ts):

### 8.1 Isomorphic Variant Blueprinting
Traditional testing platforms rely on naive sequence shuffling, which fails when students communicate. PatunAI uses a two-stage blueprinting methodology:
1. **Stage 1 (Curriculum Blueprint)**: Gemini analyzes lesson content and derives an exam blueprint specifying cognitive difficulty, Bloom's level, concept tested, and variation axes (e.g. numeric values, real-world context, distractor angles).
2. **Stage 2 (Student Variant Generation)**: For each enrolled student, Gemini synthesizes a distinct scenario fulfilling the blueprint slot.
   - *Student 1*: Solves a projectile motion problem about a basketball shot with initial velocity $v_0 = 8\text{ m/s}$ at $\theta = 45^\circ$.
   - *Student 2*: Solves an equivalent projectile motion problem about a soccer kick with initial velocity $v_0 = 12\text{ m/s}$ at $\theta = 35^\circ$.
   - Both variants test the exact same physics principles and cognitive depth, but sharing raw answers produces zero benefit.

### 8.2 Multilingual Educational Localization
Supports native linguistic conventions for Philippine classrooms:
- **English**: Standard academic terminology.
- **Tagalog (Filipino)**: DepEd/CHED curriculum terminology.
- **Bisaya (Cebuano)**: Localized phrasing for Central and Southern educational institutions.

---

## 9. Comprehensive 7-Format Question Suite

PatunAI supports seven distinct question formats with dedicated interactive widgets:

| Format | Code | Student UI Experience | Automated Scoring Logic |
|---|---|---|---|
| **Multiple Choice** | `MCQ` | Ruled radio rows with clear visual selection markers | Exact key matching |
| **True or False** | `TRUE_FALSE` | Two distinct binary selection cards (`[ TRUE ]`, `[ FALSE ]`) | Binary key matching |
| **Short Answer** | `SHORT_ANSWER` | 3-row clean textarea with live character counter | Semantic concept & keyword matching |
| **Essay** | `ESSAY` | 8-row expanding textarea with a **live word count indicator** | Multi-dimensional rubric (thesis, reasoning, evidence) with constructive feedback |
| **Fill in the Blank** | `FILL_IN_BLANK` | Highlighted inline text input for missing terminology | Exact & synonymous keyword matching |
| **Matching Type** | `MATCHING` | Column A premises paired with Column B selectors | Pairwise partial credit calculation |
| **Identification** | `IDENTIFICATION` | Single-line input for specific names, dates, or concepts | Normalized case-insensitive matching |

---

## 10. Question Count Scaling & Point Valuation Schemes

### 10.1 Flexible Question Counts (1 to 100 Questions)
- Expandable from quick 5-question quizzes to **100-question comprehensive exams**.
- Quick selection chips: `5`, `10`, `15`, `20`, `25`, `30`, `50`, or custom inputs.

### 10.2 Three Point Valuation Schemes
1. **AI Smart Dynamic Valuation (Default)**: Gemini assigns points based on question complexity (Recall: 2–5 pts; Conceptual MCQ: 5–10 pts; Synthesis Essay: 15–25 pts).
2. **Uniform Fixed Points**: Every question carries the identical point value (e.g., 10 points each).
3. **Custom Points by Format**: Instructors set specific values per question type (e.g. MCQ = 5 pts, Essay = 20 pts).

---

## 11. Multi-Frame Forensic Anti-Cheating & Security Suite

Located in [`components/IntegrityGuard.tsx`](file:///C:/Users/admin/Desktop/hackaton/components/IntegrityGuard.tsx) and [`actions/student.ts`](file:///C:/Users/admin/Desktop/hackaton/actions/student.ts):

### 11.1 Display Proctoring & Lockdown
- Examinees must grant screen-sharing permission (`getDisplayMedia`) and activate full-screen mode before accessing questions.
- Developer shortcuts (`F12`, `Ctrl+Shift+I`), context menus, and copy/paste shortcuts are intercepted.

### 11.2 Continuous 10-Second Multi-Frame Ring Buffer
Rather than relying on a single static screenshot that may capture an empty transition screen, PatunAI maintains a continuous **10-second multi-frame ring buffer**:
1. **Pre-Violation Ring Buffer (T-5s to T-1s)**: Continuously buffers 1 frame per second while screen-sharing is active.
2. **Trigger Snapshot (T0)**: Captures the exact moment of tab switch, blur, or fullscreen exit.
3. **Post-Violation Capture (T+1s to T+5s)**: Continues capturing 1 frame per second for 5 seconds after the violation to record what external tab, search query, or application the student navigated to.
4. **Keystroke Log**: Buffers recent keystroke combinations prior to the alert.
5. All 10 compressed frames and keystrokes are uploaded together to `IntegrityLog.framesBase64`.

### 11.3 Gemini Vision AI Forensic Threat Analysis
Frames are evaluated asynchronously by Gemini Vision AI to produce:
- **Threat Rank**: `CRITICAL` (active ChatGPT/Claude/Google Search usage), `SUSPICIOUS` (external app/document), `LOW` (system notification/desktop), or `BENIGN`.
- **Threat Score**: `0 to 100`.
- **1-Sentence Forensic Breakdown**: Explicitly identifying unauthorized applications and visible search terms.

### 11.4 Two-Strike Exam Lockout & Live Recovery
- **Strike 1**: Warning alert informing the examinee that another infraction will immediately lock their exam.
- **Strike 2**:
  - The exam locks immediately (`StudentExam.status = LOCKED`).
  - An **Exam Locked** screen covers the viewport. Questions and timers freeze.
  - Answers are preserved safely in `localStorage` and PostgreSQL.
  - The client polls `/actions/student` every 3 seconds. When the instructor unlocks the student from the dashboard, **the exam restores instantly without requiring a page refresh**.

---

## 12. Teacher Flight Board, Forensic Filmstrip Viewer & Instant Unlock

Located in [`app/teacher/exam/[id]/page.tsx`](file:///C:/Users/admin/Desktop/hackaton/app/teacher/exam/[id]/page.tsx) and [`components/ForensicSnapshotViewer.tsx`](file:///C:/Users/admin/Desktop/hackaton/components/ForensicSnapshotViewer.tsx):

### 12.1 Real-Time Flight Board Ledger
- Tabular roster display with geometric threat badges (`■`, `◇`, `△`, `—`).
- Shows strike count, progress, completion status, and direct Classroom assignment links.

### 12.2 Interactive Forensic Filmstrip Inspector
- Clicking any student incident opens the **Forensic Filmstrip Inspector**:
  - **10-Frame Chronological Breadcrumb**: Scrub through T-5s to T+5s frames.
  - **Playback Controller**: Play/pause sequence with speed controls (`0.5x`, `1.0x`, `2.0x`).
  - **Keystroke Log Viewer**: Displays keystroke sequences leading up to the violation.
  - **Adjudication Actions**: Teachers can officially mark incidents as `"Dismiss Flag"` or `"Confirm Violation"`.

### 12.3 1-Click "Unlock Student" Action
- Instructors can clear strikes and restore locked exams with 1 click, allowing falsely flagged students to resume their test without losing a single drafted answer.

---

## 13. Student Exam Runner Experience (Paper Register)

Located in [`app/exam/[token]/page.tsx`](file:///C:/Users/admin/Desktop/hackaton/app/exam/[token]/page.tsx):

- **Typeset Typography**: Book-serif question prompts, generous line heights, and calm margins.
- **Zero Distractions**: No floating badges, pulsing glows, or unnecessary animations during reading.
- **Continuous Debounced Auto-Saving**: Draft answers mirror to `localStorage` and persist against crashes or accidental window closes.
- **Universal Typing Fallback**: Robust fallback components ensure examinees can always input responses regardless of unexpected metadata formats.
- **Post-Submission Review**: Examinees view their finalized score, question-by-question explanations, and formative AI feedback at `/exam/[token]/result`.

---

## 14. AI Automated Grading & Cohort Analytics

Located in [`components/CohortAnalytics.tsx`](file:///C:/Users/admin/Desktop/hackaton/components/CohortAnalytics.tsx) and [`lib/gemini.ts`](file:///C:/Users/admin/Desktop/hackaton/lib/gemini.ts):

- **Automated Grading**: Instant grading for objective items and rubric-based evaluation for essays and short answers.
- **Cohort Learning Gap Analysis**: Gemini identifies class-wide misconceptions across all isomorphic variants.
- **Actionable Next-Lesson Recommendations**: Concrete pedagogical interventions tailored to specific topics where students struggled.

---

## 15. Teacher Fatigue Savings Engine

Located in [`lib/fatigue.ts`](file:///C:/Users/admin/Desktop/hackaton/lib/fatigue.ts) and [`components/TeacherFatigueBanner.tsx`](file:///C:/Users/admin/Desktop/hackaton/components/TeacherFatigueBanner.tsx):

Mathematically quantifies teacher cognitive labor eliminated:
$$\text{Authoring Hours} = \frac{\text{Questions} \times 12\text{ mins}}{60}$$
$$\text{Grading Hours} = \frac{\text{Questions} \times \text{Students} \times 3\text{ mins}}{60}$$
$$\text{Total Hours Saved} = \text{Authoring Hours} + \text{Grading Hours}$$

Displayed prominently on instructor dashboards (e.g. *"5.2 hours of manual authoring and grading eliminated in 18 seconds"*).

---

## 16. Production Deployment on Vercel

PatunAI is optimized for deployment on Vercel's global edge network:

### 16.1 Automated Build Pipeline (`package.json`)
```json
"scripts": {
  "dev": "next dev",
  "build": "next build",
  "start": "next start",
  "lint": "eslint",
  "postinstall": "prisma generate",
  "vercel-build": "prisma generate && next build"
}
```
- **`postinstall`**: Automatically generates Prisma Client immediately after dependencies install.
- **`vercel-build`**: Vercel automatically runs this script instead of `build`, guaranteeing that Prisma's query engines and TypeScript definitions are fully generated in fresh container builds.

### 16.2 Reverse Proxy Trust (`trustHost: true`)
Configured in [`auth.config.ts`](file:///C:/Users/admin/Desktop/hackaton/auth.config.ts) and [`lib/auth.ts`](file:///C:/Users/admin/Desktop/hackaton/lib/auth.ts):
```ts
export const authConfig = {
  trustHost: true,
  basePath: '/api/auth',
  ...
};
```
Setting `trustHost: true` ensures Auth.js trusts the `x-forwarded-host` header from Vercel's reverse proxy, generating correct production OAuth callback URLs (`https://patun-ai.vercel.app/api/auth/callback/google`) instead of defaulting to `localhost:3000`.

### 16.3 Serverless Payload Constraints
Vercel Serverless Functions enforce a **4.5MB request body size limit**. PatunAI enforces a **4MB client-side limit** on curriculum document uploads in [`app/teacher/create/page.tsx`](file:///C:/Users/admin/Desktop/hackaton/app/teacher/create/page.tsx) to prevent `413 FUNCTION_PAYLOAD_TOO_LARGE` errors.

---

## 17. Project Directory & File Structure

```
hackaton/
├── actions/                          # Next.js Server Actions ('use server')
│   ├── classroom.ts                  # Google Classroom rosters, coursework, sync
│   ├── exam.ts                       # Exam creation, deletion, multi-doc parsing
│   ├── material.ts                   # Saved materials library management
│   └── student.ts                    # Student exam runner, answers, multi-frame logging
├── app/                              # Next.js App Router
│   ├── api/auth/[...nextauth]/       # Auth.js Google OAuth route handler
│   ├── exam/[token]/                 # Student Exam Room (Paper Register)
│   │   ├── page.tsx                  # Interactive exam runner with 7 widgets
│   │   └── result/page.tsx           # Submission score & formative feedback
│   ├── teacher/                      # Teacher Management Suite (Ledger Register)
│   │   ├── create/page.tsx           # Exam creator, formats, past files, points
│   │   ├── exam/[id]/                # Live Flight Board & student monitor
│   │   │   └── preview/page.tsx      # Multi-variant comparison viewer
│   │   └── page.tsx                  # Teacher Dashboard (exam overview & actions)
│   ├── globals.css                   # Tailwind v4 theme & OKLCH token palette
│   ├── layout.tsx                    # Root layout with fonts (Hanken Grotesk, Source Serif 4, IBM Plex Mono)
│   └── page.tsx                      # Landing page with student code entry & teacher portal
├── components/                       # Reusable React Components
│   ├── ui/
│   │   ├── BadgeMarker.tsx           # Geometric threat status markers (■, ◇, △, —)
│   │   └── Button.tsx                # Instrument button primitive
│   ├── CohortAnalytics.tsx           # AI learning gap synthesis & recommendations
│   ├── DeleteExamButton.tsx          # Exam deletion modal with Classroom cleanup
│   ├── ForensicSnapshotViewer.tsx    # 10-frame filmstrip scrubber & keystrokes player
│   ├── IntegrityGuard.tsx            # Multi-frame ring buffer & lockdown proctor
│   ├── Navbar.tsx                    # Minimalist instrument navigation
│   ├── PublishToClassroomButton.tsx  # 1-click Google Classroom assignment publisher
│   ├── TeacherFatigueBanner.tsx      # Fatigue hours saved metric
│   └── UnlockStudentButton.tsx       # 1-click teacher lockout release button
├── lib/                              # Core Utilities & Services
│   ├── auth.ts                       # NextAuth initialization with trustHost
│   ├── db.ts                         # Database service wrapping Prisma
│   ├── fatigue.ts                    # Cognitive fatigue calculation formulas
│   ├── gemini.ts                     # Gemini generation, grading & forensic vision
│   ├── google-classroom.ts           # Google Classroom REST & SDK integration
│   └── prisma.ts                     # Prisma client singleton instance
├── prisma/
│   └── schema.prisma                 # PostgreSQL database schema & models
├── .env.example                      # Production environment template for Vercel
├── auth.config.ts                    # NextAuth configuration & OAuth scopes
├── middleware.ts                     # Route protection middleware
└── package.json                      # Dependencies and Vercel build scripts
```

---

## 18. Environment Variables & Setup Guide

### 18.1 Environment Variables Configuration ([`.env.example`](file:///C:/Users/admin/Desktop/hackaton/.env.example))

```ini
# ==========================================
# PatunAI - Vercel & Production Environment
# ==========================================

# Database (PostgreSQL - Supabase / Neon)
DATABASE_URL="postgresql://user:password@host:6543/postgres?pgbouncer=true"
DIRECT_URL="postgresql://user:password@host:5432/postgres"

# NextAuth.js / Auth.js (v5)
AUTH_SECRET="your-generated-auth-secret-key-at-least-32-chars"
AUTH_URL="https://patun-ai.vercel.app"
NEXTAUTH_URL="https://patun-ai.vercel.app"
AUTH_TRUST_HOST="true"

# Google Cloud OAuth & Classroom API Credentials
AUTH_GOOGLE_ID="your-google-oauth-client-id.apps.googleusercontent.com"
AUTH_GOOGLE_SECRET="your-google-oauth-client-secret"

# Optional: Default email automatically granted TEACHER role
DEFAULT_TEACHER_EMAIL="teacher@example.com"

# Google Gemini AI API
GEMINI_API_KEY="your-gemini-api-key"
GEMINI_MODEL="gemini-3.6-flash"
GEMINI_EXAM_MODEL="gemini-3.6-flash"
GEMINI_PARSER_MODEL="gemini-3.5-flash-lite"
GEMINI_PARSER_FALLBACK="gemini-3.1-flash-lite"
```

### 18.2 Google Cloud Console Configuration
1. Open [Google Cloud Console Credentials](https://console.cloud.google.com/apis/credentials).
2. Select your **OAuth 2.0 Client ID**.
3. Under **Authorized redirect URIs**, add:
   - Development: `http://localhost:3000/api/auth/callback/google`
   - Production: `https://patun-ai.vercel.app/api/auth/callback/google`
4. Ensure the **Google Classroom API** is enabled in the Google Cloud Library.

### 18.3 Local Development Setup
```bash
# 1. Clone repository and install dependencies
git clone https://github.com/EsBazza/exam-AI.git
cd exam-AI
npm install

# 2. Push database schema to Supabase/PostgreSQL
npx prisma db push
npx prisma generate

# 3. Start local development server
npm run dev
```

---

*PatunAI — Designed and engineered for academic integrity, educator well-being, and pedagogically sound evaluation.*
