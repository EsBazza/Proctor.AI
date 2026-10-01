# Implementation Plan: PatunAI — Quiet Instrument Design System

**Goal:** Transform the codebase into **PatunAI**, replacing generic SaaS aesthetics with the high-precision **Quiet Instrument** design system (Paper register for students, Ledger register for teachers) while preserving 100% of existing business logic, server actions, and database schemas.

---

## Proposed Changes

### Phase 1: Foundations & Design Tokens
- **`app/globals.css`**: Define OKLCH tokens (`ink`, `ink-muted`, `paper`, `ground`, `rule`, `signal`, `caution`, `verified`) via Tailwind v4 `@theme`. Purge `.glass-panel`, `.glow-primary`, and purple accents.
- **`app/layout.tsx`**: Mount `Hanken_Grotesk` (sans UI), `Source_Serif_4` (student question prompts), and `IBM_Plex_Mono` (tabular numerals, timers, codes) via `next/font/google`. Update root metadata to PatunAI.
- **`components/ui/`**: Create or standardize minimal primitives (`Button`, `Input`, `Table`, `BadgeMarker`).

### Phase 2: Student Experience (*Paper* Register)
- **`app/page.tsx`**: Left-aligned, quiet single-column entry. Large mono token field, "Enter Exam" action, "Teacher sign-in" plain link.
- **`components/IntegrityGuard.tsx`**: Institutional consent document. Explains 10-second rolling buffer, shortcut-only key logger, and retention. Blocks exam until screen stream is active.
- **`app/exam/[token]/page.tsx`**: Margin question matrix (`□`, `■`, `▣`), 62–70ch reading column, `Source Serif 4` prompts, 44px ruled answer rows, `tnum` mono timer, live `"Saved HH:MM:SS"` text, calm neutral lock screen.
- **`app/exam/[token]/result/page.tsx`**: Tabular score breakdown, review questions, concept remediation list by Bloom taxonomy.

### Phase 3: Teacher Experience (*Ledger* Register)
- **`components/Navbar.tsx`**: High-precision header with PatunAI wordmark and status indicators.
- **`app/teacher/page.tsx`**: Operations ledger table with hairline borders, zero cell radius, and fatigue estimate metric.
- **`app/teacher/create/page.tsx`**: 5-step clean creation flow (Source, Blueprint, Roster, Review, Issue).
- **`app/teacher/exam/[id]/page.tsx`**: Flight board roster table with 200ms row flash, WCAG "Add Time (+10m)" button, and "Unlock Session".
- **`components/ForensicSnapshotViewer.tsx`**: Hero screen with 10-frame horizontal filmstrip (`-05s` to `+04s`), synchronized keystroke event track, AI triage badge, and adjudication actions (Dismiss, Confirm, Unlock).
- **`components/CohortAnalytics.tsx`**: Tufte-style horizontal distribution strip and concept rankings.

### Phase 4: Audit & Verification
- Strict grep audit: Zero emojis in UI/diff, zero purple/indigo, zero gradients.
- WCAG 2.2 AA contrast & touch target check.
- `npm run build` verification.

---

## Execution Order
1. Phase 1 (Tokens, Fonts & Primitives)
2. Phase 2 (Student Experience: Entry, Consent, Runner, Results)
3. Phase 3 (Teacher Experience: Nav, Dashboard, Create, Live Monitor, Forensics Filmstrip)
4. Phase 4 (Lint, Build & Strict Anti-Slop Audit)
