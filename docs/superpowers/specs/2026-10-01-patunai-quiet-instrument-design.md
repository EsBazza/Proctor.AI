# Design Specification: PatunAI — Quiet Instrument

**Document Version:** 1.0.0  
**Date:** 2026-10-01  
**Status:** Approved by User  
**Author:** Antigravity & Lead Product Designer  

---

## 1. Brand Identity & Design Philosophy

### 1.1 Brand Identity
* **Product Name:** **PatunAI** (Derived from Tagalog *patunay* — proof, evidence, testimony).
* **Tagline:** *"Every student gets a different exam. Every exam measures the same thing."*
* **Mission:** Eliminate academic dishonesty and teacher grading fatigue through cryptographically seeded isomorphic exams, paired with objective, multi-frame forensic evidence.
* **Target Audience:** Philippine high school, college, and university instructors and students (supporting English, Tagalog, and Cebuano), operating across diverse devices (budget laptops to mid-range mobile phones).

### 1.2 Design Philosophy: "Quiet Instrument"
The platform strictly rejects generic "AI SaaS" tropes (glowing cards, purple gradients, floating badges, marketing hyperbole). Instead, it embodies a dual-register professional instrument:
1. **Paper Register (`app/exam/`, `/`):** A well-typeset, printed examination booklet on screen. Calm, distraction-free, low-anxiety, with a long reading measure (62–70ch), serif question prompts, ruled answer rows, and margin question indicators. Nothing animates while a student is reading.
2. **Ledger Register (`app/teacher/`):** An operations ledger and flight board. Dense data tables, 1px hairline rules, zero cell rounding, tabular numerals (`tnum`), mono timestamps, and a single vermilion signal color reserved strictly for actionable violations. Data is presented through small multiples, sparklines, and score distribution strips rather than decorative donut charts.

---

## 2. Token Palette & Contrast Specification

Tokens are defined once in `app/globals.css` using Tailwind CSS v4 `@theme` and OKLCH color values. The light theme serves as the primary default surface.

### 2.1 Color Tokens

| Token | OKLCH Value | HEX Approx | Role & Usage | Contrast Ratio |
|---|---|---|---|---|
| `--color-ink` | `oklch(0.22 0.025 255)` | `#1c2430` | Primary text, headings, solid button fills | **13.2:1** vs Paper (Passes WCAG AAA) |
| `--color-ink-muted` | `oklch(0.48 0.02 255)` | `#576375` | Captions, secondary labels, helper descriptions | **5.4:1** vs Paper (Passes WCAG AA) |
| `--color-paper` | `oklch(0.995 0.002 255)` | `#fcfdfe` | Student booklet canvas, exam container background | Base Paper Surface |
| `--color-ground` | `oklch(0.965 0.006 255)` | `#f3f5f8` | Application background frame, table header tint | Base App Ground |
| `--color-rule` | `oklch(0.88 0.008 255)` | `#dadfe6` | 1px hairline borders, ruled answer lines, dividers | **3.1:1** UI Boundary |
| `--color-signal` | `oklch(0.60 0.19 35)` | `#dc3812` | Vermilion. Critical strikes, lock screen, urgent alerts | **4.6:1** vs Paper (Actionable only) |
| `--color-caution` | `oklch(0.78 0.15 85)` | `#c97f0a` | Ochre/Amber. Unsaved state, pending teacher review | Paired with geometric marker |
| `--color-verified` | `oklch(0.52 0.12 155)` | `#217a59` | Forest Sage. Confirmed equivalence, auto-saved | **4.8:1** vs Paper |

### 2.2 Threat Level Geometric Markers
Status is never communicated by color alone. Every threat level pairs a color with a geometric shape and clear label:
* **Benign / Normal:** Muted dash `—` + `"Normal"`
* **Low Concern:** Outline triangle `△` + `"Low"`
* **Suspicious:** Diamond `◇` + `"Suspicious"`
* **Critical:** Solid square `■` + `"Critical"`

---

## 3. Typography Architecture

Configured in `app/layout.tsx` via `next/font/google` with local CSS variable definitions:

1. **UI & Headings:** `Hanken Grotesk` (`--font-sans`)
   * Humanist sans-serif with exceptional readability at small sizes and full Philippine diacritic support.
2. **Student Question Text:** `Source Serif 4` (`--font-serif`)
   * High-legibility book serif applied exclusively to question prompts in the *Paper* register (18–20px, 1.6 line height, 62–70ch width).
3. **Codes, Timers, Data & Keystrokes:** `IBM Plex Mono` (`--font-mono`)
   * Engineered with tabular figures (`font-feature-settings: 'tnum'`) ensuring countdown timers, scores, and table alignments never jitter or shift layout.

---

## 4. Forbidden Design Patterns ("Unslop" Protocol)

The following patterns are banned from all code, styles, assets, and copy:
* **No Emojis:** Never use emojis in UI buttons, headings, tables, or console logs. Use descriptive text labels or crisp Lucide SVG icons always paired with text.
* **No Purple/Indigo Primaries:** Avoid default SaaS indigo (`#6366f1`) and violet accents.
* **No Gradients or Glows:** Remove all `.glow-primary`, `.glow-rose`, `.glass-panel`, and backdrop blurs.
* **No `rounded-2xl` Cards or Pill Buttons:** Controls have a strict `2px` border radius (`rounded-xs`); table cells have `0px` radius.
* **No Marketing Buzzwords:** Omit terms like *"seamless"*, *"supercharge"*, *"revolutionary"*, *"unlock"*, or decorative exclamation points.
* **No Generic Donut Charts:** Replace with Tufte-style sparklines, small multiples, and horizontal distribution strips.

---

## 5. Screen-by-Screen Specifications

### 5.1 Entry Screen (`app/page.tsx`)
* Left-aligned, single-column document interface.
* Single primary action: Large mono access code input (`font-mono`, uppercase, letter-spaced, auto-focus) with an `"Enter Exam"` button.
* Two-sentence institutional disclosure:
  > *"Enter your examination access token provided by your instructor. Device and screen-sharing permissions will be verified before your assessment begins."*
* Understated text link in header: `"Teacher sign-in →"` routing to Google Auth / `/teacher`.

### 5.2 Pre-Exam Consent & Integrity Check (`components/IntegrityGuard.tsx`)
* Formatted as a formal institutional examination protocol document on a clean paper sheet canvas.
* Comprehensive disclosure:
  * **Screen Share:** 10-second rolling motion buffer (5s pre-event + 5s post-event) captured *only* when focus is lost.
  * **Keystroke Forensics:** System navigation shortcuts (`Alt+Tab`, `Ctrl+C`, `Ctrl+V`, `Cmd+Tab`) recorded; never personal passwords or typed answer prose.
  * **Data Privacy:** Retained strictly for teacher audit during assessment, then expunged.
* Mandatory consent checkbox: *"I understand the examination guidelines and consent to screen stream verification."*
* Primary 44px button: `"Authorize Screen & Begin Examination"`.
* Strict barrier: Timer, question text, and form inputs remain completely unmounted from the DOM until screen sharing is confirmed.

### 5.3 Examination Runner (`app/exam/[token]/page.tsx`)
* **Margin Navigator:**
  * Left desktop margin (bottom sheet on mobile) displaying a compact square matrix:
    * Unanswered: Outline hairline `□`
    * Answered: Solid ink square `■`
    * Current: 2px ink border `▣`
    * Flagged for review: Corner tick
* **Question Content:**
  * Measure: 62–70ch width centered in paper canvas.
  * Prompt: `Source Serif 4`, 19px, line height 1.6, with KaTeX math rendering.
  * Options: Ruled answer rows separated by 1px hairlines (`border-rule`), minimum 44px click target, full keyboard support (`A`-`D` or `1`-`4`).
* **Header & Status:**
  * Countdown timer in mono tabular numbers (`tnum`).
  * Live autosave region: `"Saved 14:02:11"`.
* **Integrity Lock Screen:**
  * Calm, non-accusatory institutional barrier if stream ends:
    > *"Examination Paused: Screen stream was disconnected. All answers up to 14:02:11 are safely saved. Please re-share your screen to resume, or contact your instructor."*

### 5.4 Teacher Dashboard (`app/teacher/page.tsx`)
* High-density operations ledger with hairline rules.
* Table Columns: Exam Title, Subject, Date Created, Enrolled Students, Submissions, Flagged Sessions, Actions.
* Summary Metrics: Tabular figures indicating active sessions, completed tests, and estimated grading fatigue saved (`"~18.5 hrs saved"`).
* Action: Understated solid ink button `+ New Assessment`.

### 5.5 Assessment Creation Stepper (`app/teacher/create/page.tsx`)
* Clean 5-step single-column flow: Source Materials $\rightarrow$ Blueprint Parameters $\rightarrow$ Roster $\rightarrow$ Synthesis Review $\rightarrow$ Issue.
* Source parser powered by Gemini 3.5 Flash-Lite with Bloom taxonomy breakdown.
* 1-click Google Classroom roster import assigning cryptographic seeds for isomorphic variants via Gemini 3.6 Flash.

### 5.6 Live Proctoring Monitor (`app/teacher/exam/[id]/page.tsx`)
* Operations flight board showing live roster: Student, Seed, Status, Progress, Strikes, Last Event, Actions.
* 200ms ease-out row flash when student status updates.
* Controls: `"Add Time (+10m)"` (WCAG 2.2 accommodation), `"Unlock Session"`, `"Inspect Forensics"`.

### 5.7 Forensic Evidence Viewer (`components/ForensicSnapshotViewer.tsx`)
* **Hero Screen:**
  * 10-frame horizontal filmstrip spanning `-05s` to `+04s` with mono timestamps.
  * Keystroke track beneath filmstrip showing exact timing of shortcut events.
  * High-resolution inspection panel of selected frame.
  * AI Triage Banner: `"AI TRIAGE — NOT AN ADJUDICATION FINDING"` with Gemini 3.5 Flash-Lite summary.
  * Verdict buttons: `[Dismiss Flag]`, `[Confirm Violation]`, `[Unlock Session]`.

### 5.8 Equivalence Diff & Cohort Analytics
* Side-by-side variant diff comparing 2 students' parameters with differences cleanly underlined.
* Tufte-style score distribution strip and concept mastery rankings.

---

## 6. Accessibility & Performance Requirements

* **WCAG 2.2 AA Compliance:** All text meets minimum 4.5:1 contrast; all interactive controls meet minimum 24×24px (44×44px for exam options).
* **Keyboard Navigation:** Full exam flow operable without mouse.
* **Reduced Motion:** All transitions and row flashes disabled under `prefers-reduced-motion: reduce`.
* **Mobile-First:** Clean responsive layout at 375px viewport width with navigator converting to an accessible bottom sheet.
* **Security & Logic Preservation:** Zero modifications to existing server actions, NextAuth, Prisma schema, or Gemini model logic.

---

## 7. Implementation Roadmap

1. **Phase 1: Foundation & Primitives**
   * Configure `app/globals.css` with OKLCH tokens and `@theme`.
   * Configure `app/layout.tsx` with `Hanken Grotesk`, `Source Serif 4`, and `IBM Plex Mono`.
   * Implement base primitives: `Button`, `Input`, `Table`, `BadgeMarker`, `Dialog`.
2. **Phase 2: Student Flow (*Paper* Register)**
   * Redesign `app/page.tsx` (Entry).
   * Refactor `components/IntegrityGuard.tsx` (Institutional consent agreement document).
   * Redesign `app/exam/[token]/page.tsx` (Exam runner, margin matrix, ruled rows, lock screen).
   * Redesign `app/exam/[token]/result/page.tsx` (Results ledger).
3. **Phase 3: Teacher Flow (*Ledger* Register)**
   * Redesign `app/teacher/page.tsx` (Operations table).
   * Redesign `app/teacher/create/page.tsx` (Creation stepper).
   * Redesign `app/teacher/exam/[id]/page.tsx` (Flight board monitor).
   * Polish `components/ForensicSnapshotViewer.tsx` (10-frame filmstrip & keystroke track).
   * Polish `components/CohortAnalytics.tsx` (Tufte distribution strip & sparklines).
4. **Phase 4: Audit & Verification**
   * Zero-emoji and zero-gradient verification.
   * Contrast and keyboard accessibility validation.
   * End-to-end user testing.
