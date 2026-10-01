# Google Classroom Auto-Posting, Attendance Check-In & Teacher Preview Implementation Plan

* **Date:** 2026-10-01
* **Design Spec:** [2026-10-01-classroom-autopost-attendance-preview-design.md](file:///C:/Users/admin/Desktop/hackaton/docs/superpowers/specs/2026-10-01-classroom-autopost-attendance-preview-design.md)
* **Target:** Production / Hackathon Live Assessment
* **Tech Stack:** Next.js 16 (App Router, Server Actions), NextAuth v5, Google Classroom REST API (`googleapis`), Prisma ORM (PostgreSQL), Gemini AI SDK, Tailwind CSS v4.

---

## Proposed Phases & Task Breakdown

### Phase 1: Database & OAuth Scope Updates
- [x] Task 1.1: Update `auth.config.ts`:
  - Add `https://www.googleapis.com/auth/classroom.coursework.students` to the Google OAuth authorization scopes.
- [x] Task 1.2: Update `prisma/schema.prisma`:
  - Add `googleCourseWorkId String?` and `googleCourseWorkUrl String?` to the `Exam` model.
  - Run `npx prisma generate` and `npx prisma db push`.
- [x] Task 1.3: Update `lib/db.ts`:
  - Update `ExamRecord` interface with `googleCourseWorkId` and `googleCourseWorkUrl`.
  - Update `dbService.createExam`, `getExamById`, and `getAllExams` to include these fields.

---

### Phase 2: Google Classroom CourseWork Assignment Service & Server Actions
- [x] Task 2.1: Add `createCourseWorkAssignment` to `lib/google-classroom.ts`:
  - Accepts `accessToken`, `courseId`, `title`, `description`, `linkUrl`, `studentIds` (array of Google user IDs), and `maxPoints`.
  - Calls `classroom.courses.courseWork.create` with `assigneeMode: 'INDIVIDUAL_STUDENTS'`.
  - Returns `courseWorkId` and `alternateLink`.
- [x] Task 2.2: Update `actions/exam.ts`:
  - Enhance `StudentRosterItem` to include `googleUserId?: string`.
  - In `createExamAction`, if `googleCourseId` is provided and session access token exists, call `createCourseWorkAssignment` with the checked students' Google user IDs.
  - Persist `googleCourseWorkId` and `googleCourseWorkUrl` in the database.
  - Gracefully handle API errors without failing exam creation.
- [x] Task 2.3: Implement safe teacher preview server action `getTeacherExamPreviewAction(examId, studentExamId?)`:
  - Validates teacher session.
  - Retrieves student exams and questions for the requested student without updating student status or starting timers.

---

### Phase 3: Student Attendance Selection Checklist in `/teacher/create`
- [x] Task 3.1: Augment student roster state in `app/teacher/create/page.tsx`:
  - Add `isPresent: boolean` (defaulting to `true`) for all imported or manually entered students.
- [x] Task 3.2: Render attendance controls:
  - Add "Select All" and "Deselect All" quick toggle buttons.
  - Display live attendance badge: `● X of Y Students Present`.
- [x] Task 3.3: Render individual student rows with interactive checkbox:
  - Checkbox toggles `isPresent`.
  - Unchecked rows display `[Absent - Skipped]` and 50% opacity.
  - Checked rows display `[Present]`.
- [x] Task 3.4: Dynamic validation & Teacher Fatigue update:
  - Calculate fatigue time savings based only on checked/present students.
  - Disable generation button if 0 students are checked.
  - Pass only present students to `createExamAction`.

---

### Phase 4: Teacher Exam Preview Page (`/teacher/exam/[id]/preview`)
- [x] Task 4.1: Create page `app/teacher/exam/[id]/preview/page.tsx`:
  - Navigation header: "← Back to Live Monitor", exam title, access code, Google Classroom assignment link (if available).
  - Student Switcher: List all present students as clickable pills or dropdown with Prev / Next buttons.
  - Question Cards: Detailed view of each question with concept, Bloom's level, difficulty badge, MCQ choices with correct answer highlighted, and master rubric for short answers.
- [x] Task 4.2: Update `app/teacher/exam/[id]/page.tsx` (Live Monitor):
  - Add "Preview All Variants" button in header.
  - Add "Preview Exam" button in each row of the student roster table linking to `/teacher/exam/[id]/preview?studentId=[studentExamId]`.
- [x] Task 4.3: Update creation completion dialog in `app/teacher/create/page.tsx`:
  - Add "Preview Exam Variants" button leading directly to `/teacher/exam/[id]/preview`.

---

### Phase 5: Verification & Quality Assurance
- [x] Task 5.1: Run `npm run build` to verify TypeScript types, Next.js routing, and build sanity.
- [x] Task 5.2: Test attendance toggling, auto-posting payload, and safe read-only preview.
