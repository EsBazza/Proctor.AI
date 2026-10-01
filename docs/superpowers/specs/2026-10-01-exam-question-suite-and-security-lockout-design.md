# Design Document: Multi-Format Question Suite & AI Visual Forensics Security Lockout

**Date:** 2026-10-01  
**Status:** Approved  
**Topic:** Exam Question Format Expansion, Typing Fix, Screen Stream Forensics, Gemini Vision Threat Analysis, and Strict 2-Strike Lockout

---

## 1. Executive Summary

This feature significantly elevates AegisExam AI in two key dimensions:
1. **Curriculum Versatility & Question Expansion:** Fixes existing input rendering bugs in the student exam runner and introduces a rich suite of 7 question formats: Multiple Choice (`MCQ`), True/False (`TRUE_FALSE`), Short Answer (`SHORT_ANSWER`), Essay with live word count (`ESSAY`), Fill in the Blank (`FILL_IN_BLANK`), Matching Type (`MATCHING`), and Identification (`IDENTIFICATION`). Teachers can pick any combination of formats via multi-select checkboxes during exam creation.
2. **Strict Anti-Cheating Integrity & AI Visual Forensics:** Introduces proactive screen stream capture (`getDisplayMedia`). When a violation (tab switch, window blur, or exiting fullscreen) occurs:
   - A hidden canvas captures an instant high-resolution frame of the examinee's screen.
   - Google Gemini Vision analyzes the snapshot, identifying unauthorized apps/searches (e.g. ChatGPT, Google Search, messaging) and assigning a Threat Rank (`CRITICAL`, `SUSPICIOUS`, `LOW`, `BENIGN`).
   - A strict **2-Strike Lockout** freezes the exam on the 2nd violation, preventing further input.
   - The Teacher Live Monitor receives the forensic screenshot, AI threat score, and a 1-click **"Unlock Student"** button to grant second chances when appropriate.

---

## 2. Multi-Format Question Suite & Input Fixes

### 2.1 Typing Bug Analysis & Normalization
- **Cause:** Previous code checked `q.type === 'MCQ'` and `q.type === 'SHORT_ANSWER'` with exact string matching. Any variations, case mismatches, or missing options left the question component with neither inputs nor textarea rendered.
- **Solution:** 
  - Standardize all question types as uppercase enums: `MCQ`, `TRUE_FALSE`, `SHORT_ANSWER`, `ESSAY`, `FILL_IN_BLANK`, `MATCHING`, `IDENTIFICATION`.
  - Implement a resilient fallback: if an unknown format is encountered, render a text response area with a warning banner so no student is ever blocked from typing their answer.

### 2.2 Question Formats & Student Runner UI
1. **Multiple Choice (`MCQ`):**
   - 4 selectable options (`A`, `B`, `C`, `D`). Radio pills with active border highlight.
2. **True or False (`TRUE_FALSE`):**
   - High-contrast toggle cards: `[ TRUE ]` and `[ FALSE ]`.
3. **Short Answer (`SHORT_ANSWER`):**
   - 2-3 row text response area with character guidance.
4. **Essay (`ESSAY`):**
   - 8-12 row rich textarea for in-depth conceptual discussions.
   - Real-time word counter badge (e.g. `Word count: 185 words | Target: 100-300 words`).
   - Evaluated by Gemini using a multidimensional grading rubric (thesis clarity, reasoning depth, factual accuracy).
5. **Fill in the Blank (`FILL_IN_BLANK`):**
   - Prompt with highlighted `_____` or `[blank]` markers, accompanied by a dedicated inline text field for concise keyword/formula input.
6. **Matching Type (`MATCHING`):**
   - Column A (terms/premises) displayed alongside Column B (definitions/targets).
   - Beside each item in Column A, a responsive dropdown selector lets the student pair it with the corresponding item from Column B.
   - Partial credit awarded for each correct pair.
7. **Identification (`IDENTIFICATION`):**
   - Clue or definition prompt with a single-line input field (trimmed and case-standardized).

### 2.3 Teacher Exam Creation Controls
- In `app/teacher/create/page.tsx`, a **"Question Formats"** control bar features multi-select checkboxes:
  - `[x] Multiple Choice (MCQ)`
  - `[x] True or False`
  - `[x] Short Answer`
  - `[x] Essay`
  - `[x] Fill in the Blank`
  - `[x] Matching Type`
  - `[x] Identification`
- Default selection: `MCQ`, `TRUE_FALSE`, `SHORT_ANSWER`, `ESSAY`.
- The generation prompt in `lib/gemini.ts` instructs Gemini to distribute the required question count evenly among the selected types.

---

## 3. Screen Stream Capture, AI Forensics & 2-Strike Lockout

### 3.1 Screen Capture Workflow (`getDisplayMedia`)
1. **Onboarding Modal:** When entering the exam room, the student is presented with a required setup modal:
   - *"Active screen proctoring and fullscreen mode are required for this exam."*
   - Student clicks **"Enable Screen Proctoring & Enter Exam"**.
   - Invokes `navigator.mediaDevices.getDisplayMedia({ video: { displaySurface: "monitor" } })` and `document.documentElement.requestFullscreen()`.
2. **Live Track Maintenance:** The video stream track is stored in client memory. No heavy video streaming is performed; frames are extracted only upon violation triggers.
3. **Stream Termination Protection:** If the student closes the screen share bar, an immediate strike is logged and the test is paused until re-shared.

### 3.2 Violation Detection Triggers
- `visibilitychange`: Document hidden (tab switch or browser minimize).
- `window.onblur`: Browser focus lost (clicking outside window, second screen, another app).
- `fullscreenchange`: Exiting fullscreen mode.
- `paste`, `copy`, `cut`: Clipboard operations blocked.
- Keyboard shortcuts: `F12`, `Ctrl+Shift+I`, `Ctrl+U` intercepted and prevented.

### 3.3 Screenshot & Gemini Vision Forensics Pipeline
1. **Instant Frame Capture:** When a violation triggers (debounced to 2000ms), a hidden `<canvas>` captures the current video frame and compresses it into an optimized WebP/JPEG base64 image string.
2. **Server Action Dispatch:** Calls `logIntegrityEventWithSnapshotAction(token, eventType, screenshotBase64, details)`.
3. **Database Insertion & Immediate Strike Count:**
   - Server immediately increments `strikeCount` in PostgreSQL.
   - If `strikeCount >= 2`, updates `status` to `LOCKED` and records `lockedAt`.
4. **Asynchronous Gemini Vision Threat Ranking:**
   - The server calls Gemini Vision (`gemini-2.5-flash` or `gemini-1.5-flash`) with the captured image.
   - Prompt analyzes whether unauthorized content is on screen (ChatGPT, search engines, communication apps, notes, secondary documents).
   - Generates JSON with `threatRank` (`CRITICAL` | `SUSPICIOUS` | `LOW` | `BENIGN`), `threatScore` (0-100), `reason`, and `detectedApps`.
   - Asynchronously updates the `IntegrityLog` record.

### 3.4 Lockout Screen & Teacher 1-Click Unlock
- **Student View on 2nd Strike:**
  - Student exam room displays a full-screen red **Lockout Screen**:
    - **"EXAM LOCKED — MAXIMUM INTEGRITY VIOLATIONS REACHED (2/2)"**
    - Displays event details, timestamp, and notification that the teacher has received forensic evidence.
    - All inputs, submission buttons, and timers are disabled.
    - All existing answers remain preserved in local storage and the database.
- **Teacher Live Monitor View:**
  - The live monitor displays a red **LOCKED OUT** badge next to the student's entry.
  - The activity feed shows the exact violation timestamp, event type, **screenshot thumbnail**, and Gemini's threat badge (e.g., `CRITICAL (94%): Google Search for Exam Answers`).
  - Clicking the thumbnail opens a full-screen modal showing the high-resolution capture and AI evidence report.
  - A prominent **"Unlock Student"** button allows the teacher to:
    - Reset student status back to `IN_PROGRESS`.
    - Reset `strikeCount` to 1 (providing one more chance).
    - Student exam room polls every 3 seconds and automatically resumes without page reload.

---

## 4. Data Models & Prisma Schema Updates

### 4.1 Schema Additions (`prisma/schema.prisma`)
```prisma
model Exam {
  // Existing fields...
  questionTypes String @default("MCQ,TRUE_FALSE,SHORT_ANSWER,ESSAY")
}

model StudentExam {
  // Existing fields...
  status               String   @default("PENDING") // PENDING | IN_PROGRESS | LOCKED | SUBMITTED | FLAGGED
  integrityAlertsCount Int      @default(0)
  strikeCount          Int      @default(0)
  lockedAt             DateTime?
}

model QuestionVariant {
  // Existing fields...
  type String // MCQ | TRUE_FALSE | SHORT_ANSWER | ESSAY | FILL_IN_BLANK | MATCHING | IDENTIFICATION
  // options stores:
  // - MCQ: ["A) ...", "B) ...", "C) ...", "D) ..."]
  // - TRUE_FALSE: ["TRUE", "FALSE"]
  // - MATCHING: { "columnA": ["Term 1", "Term 2"], "columnB": ["Def A", "Def B"] }
  // - FILL_IN_BLANK / IDENTIFICATION / SHORT_ANSWER / ESSAY: null
}

model IntegrityLog {
  // Existing fields...
  screenshotBase64 String?  @db.Text
  threatRank       String?  // CRITICAL | SUSPICIOUS | LOW | BENIGN
  threatScore      Float?
  aiAnalysis       String?  @db.Text
}
```

---

## 5. Security, Resilience & Privacy Considerations

1. **Client Tampering Prevention:**
   - Strike counting and lock state are strictly validated and stored server-side. Page refreshes or dev tools tricks cannot bypass the server's `LOCKED` state.
2. **Zero Answer Loss:**
   - Every keystroke is saved in `localStorage` (`exam_draft_[token]`). If locked and later unlocked, all written answers remain intact.
3. **Performance & Bandwidth:**
   - Video is not streamed over the internet. The video track lives solely inside the student's browser memory; only ~80-150KB compressed screenshot frames are transmitted during an actual violation.
4. **Gemini Latency Decoupling:**
   - Strike enforcement and locking happen synchronously in `<100ms`. AI visual analysis runs in the background and populates forensic data within 1-2 seconds, ensuring no UI stuttering or blocking.

---

## 6. Implementation Stages

1. **Stage 1:** Update Prisma schema, run database push, and regenerate Prisma client.
2. **Stage 2:** Update Gemini exam generation in `lib/gemini.ts` to support all 7 question formats based on teacher preferences, and implement Gemini Vision forensic analysis.
3. **Stage 3:** Enhance Teacher Create Page (`app/teacher/create/page.tsx`) with format selection controls.
4. **Stage 4:** Upgrade Student Exam Runner (`app/exam/[token]/page.tsx` & `components/IntegrityGuard.tsx`):
   - Add screen capture onboarding.
   - Implement rendering widgets for all 7 formats (fixing typing bugs and adding word count).
   - Implement the 2-strike lockout screen.
5. **Stage 5:** Update Teacher Live Monitor (`app/teacher/exam/[id]/page.tsx`) with forensic screenshot viewer, threat ranking badges, and 1-click **Unlock Student** functionality.
