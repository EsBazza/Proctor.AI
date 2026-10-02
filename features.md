# Proctor.AI: Feature Catalog & Architecture Overview

**Proctor.AI** (PatunAI) is an intelligent, automated exam authoring and real-time remote proctoring platform designed to ensure academic integrity and streamline classroom assessment workflows using Google Gemini and Supabase Realtime.

---

## 1. AI-Powered Exam Generation & Ingestion

### Dynamic Syllabus & Multi-Document Extraction
- **Multi-File Document Ingestion**: Upload multiple course materials simultaneously (PDFs, plain text .txt, and slide screenshots).
- **Gemini 3.5 Flash-Lite Document Parsing**: Analyzes uploaded course syllabi, extracting core learning concepts, Grade Levels, Subject tags, and Bloom's Taxonomy cognitive matrices.
- **Past Materials Library**: Automatically catalogs past uploaded course notes, lecture PDFs, and custom educator study guides for one-click reuse across multiple assessments.
- **Direct Lesson Synthesis**: Synthesizes notes directly into an editable outline or allows educators to paste custom curriculum prompts.

### Anti-Collusion Isomorphic Exam Branching
- **Candidate-Specific Isomorphic Variants**: Rather than distributing identical tests, Proctor.AI leverages Gemini to dynamically generate unique, mathematically and conceptually equivalent question variants for each individual student.
- **Collusion Neutralization**: Eliminates real-time peer collusion, screen glancing, and answer copying while maintaining equitable grading difficulty across the entire class.
- **7 Question Formats Supported**:
  1. **Multiple Choice (MCQ)**: 4 distinct choices with master correct answer highlighting.
  2. **True / False**: Statement accuracy validation.
  3. **Short Answer**: 1–2 sentence conceptual explanations evaluated with model rubrics.
  4. **Essay**: In-depth analytical responses graded with automated rubric benchmarks.
  5. **Fill in the Blank**: Sentence completion with targeted blank syntax.
  6. **Matching Type**: Dual-column terms and definition correlation.
  7. **Identification**: Term recognition based on analytical definition clues.

### Flexible Scoring Schemes
- **Smart AI Dynamic Valuation**: AI automatically assigns point values based on cognitive depth and Bloom's Taxonomy (e.g. 2–5 pts for True/False, 10 pts for MCQs, 15–25 pts for essays).
- **Uniform Fixed Points**: Uniform point distribution per question across all formats.
- **Custom Per-Format Weighting**: Manual point configuration per question format.

---

## 2. Real-Time Remote Proctoring & Veyon Screen Grid

### Veyon-Style Live Screen Grid
- **Classroom-Wide Screen Telemetry**: Displays live screen thumbnails of all enrolled candidates on a flight board with live status pills (LIVE, DELAYED, STALE, OFFLINE).
- **Sub-200ms Low-Latency Streaming**: Utilizes Supabase Realtime broadcast channels for responsive remote desktop monitoring.
- **Dual-Mode Sync Architecture**: Realtime WebSocket transmission backed by automated periodic database heartbeats ensures screen transmission never disconnects even on intermittent network connections.
- **Inspect Mode (Theater View)**:
  - Full-screen modal display with interactive zoom controls (up to 2.5x).
  - High-Definition screen frames (720p/1280px) for inspecting text, tab bars, and code.
  - Live FPS and Frame Age indicators with instant stream state transitions.
  - Fast keyboard shortcuts (press ESC to close inspect mode).

### Teacher Nudge & Live Intercom
- **Direct Student Nudges**: Teachers can send instant, non-intrusive reminder alerts directly onto a student's examination screen via Realtime broadcast (e.g., *"Please return to your exam tab and maintain full screen"*, *"Ensure camera view is centered"*).

---

## 3. Automated Integrity Shield & Forensic Tracking

### Multi-Vector Anomaly Detection (IntegrityGuard)
- **Tab Switching & Window Blur**: Tracks when students switch windows, open background apps, or defocus the exam tab.
- **Fullscreen Enforcement**: Enforces continuous full-screen lock and flags unauthorized exits.
- **Clipboard & Paste Interception**: Detects unauthorized text pasting from external sources.
- **Lockout Policy Threshold**: Configurable maximum strike policy (e.g., strict 1 strike, standard 2 strikes, or custom lenient limits). Reaching the threshold automatically freezes the exam session.

### 10-Second Forensic Snapshot & Replay
- **Chronological Incident Buffer**: Captures trailing pre-incident and post-incident screen frames surrounding every violation event.
- **Forensic Video Scrubbing**: Teachers can step through, rewind, and play back chronological 10-second violation sequences at customizable playback speeds.
- **AI Threat Analysis & Ranking**: Gemini vision models analyze captured screen sequences to score violation severity (VERIFIED, SUSPICIOUS, SEVERE) and identify open unauthorized software.
- **Educator Incident Adjudication**: Allows teachers to confirm or dismiss individual flags and review candidate keystroke telemetry.

---

## 4. Google Classroom & LMS Integration

### Seamless Classroom Roster Sync
- **One-Click Course Import**: Connects with Google Classroom to retrieve official enrolled student rosters, names, and Google account emails.
- **Attendance Verification**: Built-in attendance checklist ensures exams are only generated for attending students.
- **Manual Roster Fallback**: Supports manual roster entry (Student Name (email@domain.com)).

### Assignment & Grade Publishing
- **Publish to Google Classroom**: Automatically provisions private coursework assignments and injects unique student access links.
- **One-Click Grade Release**: Pushes finalized, proctored scores directly into Google Classroom gradebooks once exams are submitted.

---

## 5. Candidate Examination Experience

- **Secure Session Authorization**: Google OAuth or unique token authentication ensures candidates only access their assigned variant.
- **Explicit Proctoring Consent Gate**: Transparent privacy consent agreement prior to camera/screen authorization.
- **Live Visual Proctoring Indicators**: Transparent visual notification when a proctor is actively observing the screen.
- **Offline / Network Resilience**: Local answer preservation prevents answer loss in the event of brief network drops.

---

## 6. Cohort Mastery & Analytics

- **Mastery Distribution**: Calculates cohort grade distributions, class averages, and pass/fail thresholds.
- **Top Missed Concepts**: AI-driven synthesis identifies frequently missed topics and recommends targeted review interventions for teachers.
