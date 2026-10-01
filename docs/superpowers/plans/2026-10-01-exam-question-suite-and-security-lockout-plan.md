# Implementation Plan: Multi-Format Question Suite & AI Visual Forensics Security Lockout

**Date:** 2026-10-01  
**Spec Document:** `docs/superpowers/specs/2026-10-01-exam-question-suite-and-security-lockout-design.md`  
**Status:** In Progress

---

## Task Breakdown

### Task 1: Database & Prisma Schema Migration
- [ ] In `prisma/schema.prisma`:
  - Add `questionTypes String @default("MCQ,TRUE_FALSE,SHORT_ANSWER,ESSAY")` to `model Exam`.
  - Add `strikeCount Int @default(0)` and `lockedAt DateTime?` to `model StudentExam`.
  - Add `screenshotBase64 String? @db.Text`, `threatRank String?`, `threatScore Float?`, and `aiAnalysis String? @db.Text` to `model IntegrityLog`.
- [ ] Push schema to Supabase PostgreSQL: `npx prisma db push`.
- [ ] Regenerate client: `npx prisma generate`.
- [ ] Update `lib/db.ts` with updated types and helper functions:
  - `incrementStudentStrikeAndCheckLock(studentExamId: string, maxStrikes: number)`
  - `unlockStudentExam(studentExamId: string)`
  - `createIntegrityLogWithForensics(data: ...)`
  - Update `getStudentExamByAccessToken` to include `strikeCount`, `lockedAt`, and `status`.

### Task 2: Gemini Question Generation & Vision Forensics Service
- [ ] In `lib/gemini.ts`:
  - Expand `GeneratedQuestion` interface to support `type: 'MCQ' | 'TRUE_FALSE' | 'SHORT_ANSWER' | 'ESSAY' | 'FILL_IN_BLANK' | 'MATCHING' | 'IDENTIFICATION'`.
  - Update `generateIsomorphicExams` prompt to accept `questionTypes: string[]` and generate isomorphic variations strictly conforming to the selected formats.
  - Implement matching format structure in options: `{ "columnA": [...], "columnB": [...] }`.
  - Implement `analyzeViolationScreenshotWithGeminiVision(base64Image: string, eventType: string)` using Gemini multimodal models (`gemini-2.5-flash` / `gemini-1.5-flash`) to detect unauthorized tabs/apps and return `{ threatRank, threatScore, reason, detectedApps }`.
  - Update `gradeStudentAnswer` to accurately evaluate `TRUE_FALSE`, `MATCHING`, `FILL_IN_BLANK`, `IDENTIFICATION`, and rubric-based `ESSAY` depth.

### Task 3: Teacher Exam Creation Interface
- [ ] In `app/teacher/create/page.tsx`:
  - Add a "Question Formats" selection bar with checkboxes for:
    - Multiple Choice (`MCQ`)
    - True or False (`TRUE_FALSE`)
    - Short Answer (`SHORT_ANSWER`)
    - Essay (`ESSAY`)
    - Fill in the Blank (`FILL_IN_BLANK`)
    - Matching Type (`MATCHING`)
    - Identification (`IDENTIFICATION`)
  - Pass `selectedQuestionTypes` to `createExamAction` in `actions/exam.ts`.
- [ ] In `actions/exam.ts`:
  - Accept `questionTypes` in `createExamAction` and persist to `Exam.questionTypes`.

### Task 4: Student Exam Runner UI & All 7 Question Formats
- [ ] In `app/exam/[token]/page.tsx`:
  - Normalize question type casing to uppercase.
  - Render dedicated widgets for each format:
    1. **MCQ:** Radio pill options with active borders.
    2. **TRUE_FALSE:** Dual high-contrast `[ TRUE ]` and `[ FALSE ]` cards.
    3. **SHORT_ANSWER:** 2-3 row text field with character guide.
    4. **ESSAY:** Rich textarea with real-time live **Word Counter** (`Word count: X words`).
    5. **FILL_IN_BLANK:** Sentence with highlighted blank and inline text box.
    6. **MATCHING:** Column A terms with dropdowns to select matching Column B targets.
    7. **IDENTIFICATION:** Focused single-line concept input.
    8. **Universal Fallback:** Editable textarea so no student is ever blocked.
  - Build **Full-Screen Red Lockout Screen**:
    - Triggers if `studentExam.status === 'LOCKED'` or `strikeCount >= 2`.
    - Disables inputs, freezes timer, and provides clear instructions to contact teacher.
    - Background polling (every 3 seconds) that automatically restores the exam as soon as the teacher clicks "Unlock Student".

### Task 5: Screen Stream Capture & Client Integrity Guard
- [ ] In `components/IntegrityGuard.tsx`:
  - Implement onboarding modal requesting Screen Share (`navigator.mediaDevices.getDisplayMedia`) and Fullscreen.
  - Maintain video stream track in memory; attach hidden `<canvas>` to capture snapshot on violation.
  - Listen for `visibilitychange`, `blur`, `fullscreenchange`, `paste`, `copy`, and shortcut keys.
  - On violation: grab frame, compress to WebP/JPEG, and invoke `logIntegrityEventWithSnapshotAction`.
  - Display Strike 1 amber alert banner and Strike 2 transition to lockout.
- [ ] In `actions/student.ts`:
  - Implement `logIntegrityEventWithSnapshotAction`:
    - Immediately increments strike count and locks student in DB if strikes >= 2.
    - Asynchronously triggers Gemini Vision analysis and updates `IntegrityLog`.

### Task 6: Teacher Live Monitor & Instant 1-Click Unlock
- [ ] In `actions/classroom.ts` or `actions/exam.ts`:
  - Implement `unlockStudentExamAction(studentExamId: string)`.
- [ ] In `app/teacher/exam/[id]/page.tsx`:
  - Display a red **LOCKED OUT** badge and an **"Unlock Student"** button beside locked students.
  - In the Live Activity feed, display:
    - Event timestamp & type.
    - Screenshot thumbnail.
    - Gemini AI Threat Badge (e.g. `CRITICAL (92%): Google Search`).
  - Clicking the screenshot thumbnail opens a modal with full-size image and AI forensic report.

### Task 7: Verification & Build
- [ ] Run `npx tsc --noEmit` to verify type safety across the entire application.
- [ ] Test teacher exam creation with multi-format selection.
- [ ] Test student runner with all 7 question types, word counter, and draft auto-saving.
- [ ] Test screen capture, 2-strike lockout, and teacher 1-click unlock.
- [ ] Commit all completed changes to git.
