# Google Classroom Integration & Gatekept Experience Implementation Plan

* **Date:** 2026-09-27
* **Design Spec:** [2026-09-27-google-classroom-integration-design.md](file:///C:/Users/admin/Desktop/hackaton/docs/superpowers/specs/2026-09-27-google-classroom-integration-design.md)
* **Target:** Production / Hackathon Live Assessment
* **Tech Stack:** Next.js 16 (App Router), NextAuth.js v5 (`next-auth@beta`), Google Classroom REST API (`googleapis`), better-sqlite3 / SQLite, Gemini AI SDK, Tailwind CSS v4.

---

## Proposed Phases & Task Breakdown

### Phase 1: Dependencies & Authentication Layer
- [ ] Task 1.1: Install `next-auth@beta` and `googleapis` (`npm install next-auth@beta googleapis`).
- [ ] Task 1.2: Create `lib/auth.ts` configuring NextAuth with Google Provider:
  - Scopes: `openid`, `email`, `profile`, `https://www.googleapis.com/auth/classroom.courses.readonly`, `https://www.googleapis.com/auth/classroom.rosters.readonly`.
  - JWT callback storing `access_token` and detecting teacher role via `classroom.courses.list({ teacherId: 'me' })`.
  - Session callback exposing user role (`TEACHER` | `STUDENT`), email, and access token.
- [ ] Task 1.3: Create NextAuth route handler in `app/api/auth/[...nextauth]/route.ts`.
- [ ] Task 1.4: Create `.env.example` documenting required environment variables: `AUTH_SECRET`, `AUTH_GOOGLE_ID`, `AUTH_GOOGLE_SECRET`, and `GEMINI_API_KEY`.

---

### Phase 2: Database Layer & Google Classroom Service
- [ ] Task 2.1: Update `prisma/schema.prisma` and `lib/db.ts`:
  - Add `googleCourseId`, `googleCourseName`, `teacherEmail` to `Exam` table.
  - Add `studentEmail` to `StudentExam` table.
  - Update `dbService` prepared statements and types in `lib/db.ts`.
- [ ] Task 2.2: Implement `lib/google-classroom.ts`:
  - `fetchTeacherCourses(accessToken)`: Calls Google Classroom API to retrieve active courses taught by the teacher.
  - `fetchCourseRoster(accessToken, courseId)`: Calls Google Classroom API to retrieve enrolled students (names and emails).

---

### Phase 3: Route Gatekeeping & Navigation
- [ ] Task 3.1: Implement Next.js `middleware.ts`:
  - Protect `/teacher/:path*` (redirects to `/` if not logged in or role !== `TEACHER`).
  - Protect `/exam/:path*` (redirects to `/` if not logged in).
  - Redirect legacy `/join` to `/`.
- [ ] Task 3.2: Update `components/Navbar.tsx`:
  - Remove public navigation links ("Teacher Portal", "Student Portal") for unauthenticated users.
  - Display user avatar, role badge, and "Sign Out" button when authenticated.

---

### Phase 4: Ultra-Minimalist Landing Page
- [ ] Task 4.1: Redesign `app/page.tsx` to render exactly two primary elements:
  - Element 1: 6-digit exam code input field with an arrow/submit button.
  - Element 2: "Sign in with Google" button executing Google OAuth.
- [ ] Task 4.2: Implement code lookup and student matching in `actions/student.ts`:
  - `validateExamCodeAction(accessCode)`: Validates 6-digit code and checks student's Google session.

---

### Phase 5: Teacher Exam Creation with Google Classroom Roster Sync
- [ ] Task 5.1: Create server actions in `actions/classroom.ts`:
  - `getTeacherCoursesAction()`: Returns teacher's Google Classroom courses.
  - `getCourseRosterAction(courseId)`: Returns enrolled students for the selected course.
- [ ] Task 5.2: Update `app/teacher/create/page.tsx`:
  - Replace manual roster textarea with Google Classroom Course Selector dropdown.
  - Display imported roster badge and student list (names & emails).
  - Pre-fill Exam Title and Subject from selected course.
- [ ] Task 5.3: Update `actions/exam.ts` `createExamAction`:
  - Accept `studentEmail`, `googleCourseId`, and `googleCourseName`.
  - Persist student email addresses on `StudentExam` records for verification.

---

### Phase 6: Student Exam Room Identity Verification
- [ ] Task 6.1: Update `actions/student.ts` `getStudentExamAction`:
  - Verify that the current user's session email matches the `studentEmail` on the `StudentExam` record.
- [ ] Task 6.2: Update `app/exam/[token]/page.tsx`:
  - If email does not match, display an unauthorized message with a "Switch Google Account" button.
  - If authenticated and matched, load the personalized exam variant.

---

### Phase 7: Verification & Testing
- [ ] Task 7.1: Test Gatekeeping: Confirm direct access to `/teacher` and `/exam` in incognito redirects to `/`.
- [ ] Task 7.2: Test Landing Page: Confirm clean 2-element layout.
- [ ] Task 7.3: Test Teacher Flow: Verify Google Classroom course selector loads courses and populates student roster.
- [ ] Task 7.4: Test Student Flow: Verify student enters 6-digit code, authenticates with Google, and accesses their assigned variant.
