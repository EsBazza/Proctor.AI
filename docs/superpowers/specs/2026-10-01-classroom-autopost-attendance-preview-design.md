# Google Classroom Auto-Posting, Attendance Check-In & Teacher Exam Preview
## System Design Specification

* **Date:** 2026-10-01
* **Project:** AegisExam AI
* **Status:** Approved
* **Target:** Production / Hackathon Live Assessment

---

## 1. Executive Summary & Goals

This specification defines three interconnected features that streamline the teacher workflow from classroom attendance to exam distribution and pedagogical inspection:

1. **Student Attendance Selection Checklist in Exam Creation (`/teacher/create`):**
   - Automatically pre-check all enrolled students imported from Google Classroom (or manual roster).
   - Allow teachers to easily uncheck absent students with one click or use "Select All" / "Deselect All" quick toggles.
   - Only checked (present) students will have personalized isomorphic exam variants generated and be assigned in Google Classroom.

2. **Automated Google Classroom CourseWork Assignment Publishing:**
   - Automatically create a formal Google Classroom CourseWork assignment upon exam generation.
   - Use `assigneeMode: "INDIVIDUAL_STUDENTS"` so the assignment is published **exclusively** to the checked (present) students.
   - Include the exam title, 6-digit access code, instructions, duration, and direct portal link in the assignment materials.
   - Persist the Google Classroom CourseWork ID and URL to link directly to Google Classroom from the teacher dashboard.

3. **Dedicated Teacher Exam Preview Experience (`/teacher/exam/[id]/preview`):**
   - Provide educators with a dedicated, safe preview portal to inspect what each student's exam actually contains (prompts, MCQ choices, correct answers, Bloom's concept, and grading rubrics).
   - Include a top student switcher to toggle between any student in the class without affecting student session status, advancing `PENDING` to `IN_PROGRESS`, or starting the exam countdown timer.
   - Accessible directly from the exam creation completion modal and the live monitor table.

---

## 2. Architecture & Data Flow

```mermaid
flowchart TD
    subgraph TeacherCreation [Teacher Exam Creation (/teacher/create)]
        A[Select Google Classroom Course] --> B[Import Course Roster via API]
        B --> C[Attendance Checkboxes: All Checked by Default]
        C --> D{Teacher Unchecks Absent Students}
        D --> E[Click 'Generate Personalized Exams']
    end

    subgraph ServerAction [actions/exam.ts: createExamAction]
        E --> F[Filter Roster: isPresent === true]
        F --> G[Gemini Engine: Generate Isomorphic Variants for Present Students]
        G --> H[Prisma ORM: Persist Exam & StudentExam Records]
        H --> I{Is Google Classroom Course Linked?}
        I -- Yes --> J[Google Classroom API: courses.courseWork.create]
        J --> K[assigneeMode: INDIVIDUAL_STUDENTS<br/>Assign only to Present Student Google IDs]
        I -- No --> L[Skip Classroom Post]
    end

    subgraph ClassroomSync [Google Classroom LMS]
        K --> M[CourseWork Assignment Published to Present Students' Feeds]
    end

    subgraph TeacherPreview [Teacher Exam Preview (/teacher/exam/:id/preview)]
        H --> N[View Full Variant per Student with Top Switcher]
        N --> O[Inspect Prompts, MCQ Options, Correct Answers & Rubrics]
        N --> P[Safe Read-Only View: No Timers or Status Changes]
    end
```

---

## 3. Google Classroom Integration Details

### 3.1 OAuth Scope Additions
In `auth.config.ts`, add the coursework write permission to the Google OAuth authorization params:
```typescript
scope: 'openid email profile https://www.googleapis.com/auth/classroom.courses.readonly https://www.googleapis.com/auth/classroom.rosters.readonly https://www.googleapis.com/auth/classroom.profile.emails https://www.googleapis.com/auth/classroom.profile.photos https://www.googleapis.com/auth/classroom.coursework.students'
```

### 3.2 Google Classroom CourseWork Creation Payload
When an exam is generated with an associated `googleCourseId`:
```typescript
const classroom = google.classroom({ version: 'v1', auth });

const portalUrl = process.env.NEXTAUTH_URL || 'http://localhost:3000';
const examJoinUrl = `${portalUrl}/join?code=${exam.accessCode}`;

const response = await classroom.courses.courseWork.create({
  courseId: exam.googleCourseId,
  requestBody: {
    title: exam.title,
    description: `AegisExam AI Assessment\n\nExam Access Code: ${exam.accessCode}\nSubject: ${exam.subject}\nDuration: ${exam.durationMinutes} minutes\nQuestions: ${exam.totalQuestions}\n\nPlease click the link below to enter your personalized exam room:`,
    materials: [
      {
        link: {
          url: examJoinUrl,
          title: `Start Exam: ${exam.title}`
        }
      }
    ],
    state: 'PUBLISHED',
    workType: 'ASSIGNMENT',
    assigneeMode: 'INDIVIDUAL_STUDENTS',
    individualStudentsOptions: {
      studentIds: presentGoogleStudentUserIds // Google User IDs of checked students
    },
    maxPoints: exam.totalQuestions * 10
  }
});
```

### 3.3 Database Schema Enhancement
Add optional tracking fields to the `Exam` model in `prisma/schema.prisma`:
```prisma
model Exam {
  // Existing fields...
  googleCourseId         String?
  googleCourseName       String?
  googleCourseWorkId     String?        // ID of created assignment in Google Classroom
  googleCourseWorkUrl    String?        // Direct link to assignment in Google Classroom
  teacherEmail           String?
  // ...
}
```

---

## 4. User Interface & Route Specifications

### 4.1 Attendance Selection in `/teacher/create`
- **Location**: Step 2 of the creation wizard after selecting a course.
- **Controls**:
  - Live summary badge: `"● 22 of 24 Students Present"`.
  - Action buttons: `[✓ Select All]` and `[✗ Deselect All]`.
- **Roster Item Presentation**:
  - Checkbox bound to student `isPresent` state.
  - Student full name and Google email address.
  - Visual status pill:
    - Checked: `[Present]` (emerald badge, normal opacity).
    - Unchecked: `[Absent - Skipped]` (slate/rose badge, row dimmed to 50% opacity).
- **Validation**:
  - If 0 students are checked, the "Generate Personalized Exams" button is disabled with warning text: *"Please mark at least one student present to generate an exam."*
  - Teacher fatigue metric recalculates in real-time based on the count of checked students.

### 4.2 Dedicated Teacher Exam Preview Route (`/teacher/exam/[id]/preview`)
- **Route Path**: `/teacher/exam/[id]/preview`
- **Query Params**: `?studentId=<studentExamId>` (optional; defaults to the first student).
- **Access Control**: Strict gatekeeping via `middleware.ts`. Requires `role === 'TEACHER'`.
- **Layout & Elements**:
  1. **Header**:
     - "← Back to Live Monitor" button linking to `/teacher/exam/[id]`.
     - Exam title, subject badge, target language badge, duration, and 6-digit access code.
     - "View in Google Classroom ↗" external button if `googleCourseWorkUrl` exists.
  2. **Student Switcher Bar**:
     - Horizontal pill tabs or dropdown of all students in the exam.
     - Active student highlighted with primary glow.
     - "◄ Previous Student" and "Next Student ►" navigation controls.
  3. **Variant Content Container**:
     - Student Banner: *"Previewing Variant for [Student Name] ([Student Email])"*.
     - Disclaimer: *"Safe Educator Preview: Viewing this variant does not start timers or log integrity events."*
  4. **Question Cards**:
     - Question index and point value (e.g. `Question 1 of 4 • 10 pts`).
     - Badges for `type` (MCQ / Short Answer), `difficulty` (EASY / MEDIUM / HARD), and `conceptTested`.
     - Full question prompt.
     - **For MCQ**: All 4 options listed. The correct answer choice is highlighted with a green border, checkmark icon, and `[Master Correct Answer]` badge.
     - **For Short Answer**: A dedicated section displaying `[Master Rubric / Expected Answer]` with full explanation text.

### 4.3 Preview Entry Points
1. **Creation Success Modal**: Includes a primary button: **"Preview Exam Variants"** routing to `/teacher/exam/[id]/preview`.
2. **Teacher Dashboard / Live Monitor (`/teacher/exam/[id]`)**:
   - Header button: **"Preview All Variants"**.
   - Student Table: In the actions column for each student row, a **"Preview Exam"** button opens `/teacher/exam/[id]/preview?studentId=[studentExamId]`.

---

## 5. Error Handling & Resilience

1. **Classroom Scope Expiry or Missing Permission**:
   - If `courses.courseWork.create` fails (e.g. user needs to re-authenticate with the newly added scope), catch the error gracefully.
   - Do NOT fail the exam creation. The exam is successfully saved in AegisExam AI, and the server action returns `classroomPostSuccess: false, classroomPostError: "..."`.
   - The UI displays an informative alert: *"Exam created successfully! Note: Could not auto-post to Google Classroom due to permission timeout. Please share the 6-digit code with your students."*
2. **Empty Attendance**:
   - Client-side and server-side validation checks ensure `normalizedRoster.length > 0`.
3. **Safe Previews**:
   - The preview route uses a dedicated read-only server action `getTeacherExamPreviewAction(examId, studentExamId)` that queries `QuestionVariant` without invoking `updateStudentExamStatus` or touching timestamps.

---

## 6. Spec Self-Review Checklist

- [x] **Placeholder scan:** No "TBD" or "TODO". All data models, routes, API parameters, and UI states are explicitly defined.
- [x] **Internal consistency:** Schema enhancements in `Exam` align with `actions/exam.ts` and `lib/db.ts`.
- [x] **Scope check:** Strictly covers attendance check-in, Google Classroom auto-assignment, and teacher preview page.
- [x] **Ambiguity check:** Clarified assignee mode (`INDIVIDUAL_STUDENTS`), default attendance states (checked), and safe preview architecture.
