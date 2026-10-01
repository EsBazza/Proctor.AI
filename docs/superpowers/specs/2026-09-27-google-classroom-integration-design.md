# Google Classroom Integration & Gatekept Experience Design Spec

* **Date:** 2026-09-27
* **Project:** AegisExam AI
* **Status:** Approved
* **Target:** Production / Hackathon Live Assessment

---

## 1. Executive Summary & Goals

This specification details the end-to-end integration of Google Classroom, strict route gatekeeping, and an ultra-minimalist 2-element landing page into the AegisExam AI platform.

### Key Objectives:
1. **Automated Classroom Rostering:** Directly connect with Google Classroom via Google OAuth and the Google Classroom REST API (`googleapis`) so teachers can select any active class and automatically import enrolled students (names and Google email addresses).
2. **Ultra-Minimalist Landing Page (`/`):** Replace public marketing content with a focused, 2-element interface:
   - An input field for students entering a 6-digit exam code.
   - A "Sign in with Google" button for teachers and students.
3. **Strict Route Gatekeeping:** Protect all inner routes (`/teacher/*`, `/exam/*`) using Next.js middleware and session verification. Unauthenticated users cannot browse any page except `/`.
4. **Google Identity Verification for Students:** Students verify their identity using their Google account to ensure only enrolled students in the selected Google Classroom course can access their personalized exam variant.

---

## 2. Architecture & Data Flow

```mermaid
flowchart TD
    subgraph LandingPage [Landing Page (/)]
        A[Student enters 6-digit Code] --> B{Signed In with Google?}
        C[User clicks 'Sign in with Google'] --> D[Google OAuth Flow]
        B -- No --> D
        B -- Yes --> E[Validate Google Email against Exam Roster]
    end

    subgraph AuthCallback [Auth & Role Determination]
        D --> F[Google OAuth Callback & JWT Session Created]
        F --> G{Is User a Teacher in any Google Classroom Course?}
        G -- Yes --> H[Role: TEACHER -> Redirect /teacher]
        G -- No --> I[Role: STUDENT -> Validate Exam Code & Redirect /exam/token]
    end

    subgraph TeacherFlow [Teacher Exam Creation]
        H --> J[Create Exam Wizard: /teacher/create]
        J --> K[Query Google Classroom API: courses.list]
        K --> L[Teacher Selects Class -> Fetch courses.students.list]
        L --> M[Roster Auto-Populated: Names & Google Emails]
        M --> N[Gemini Generates Isomorphic Variants mapped to Student Emails]
        N --> O[Save Exam & Unique Student Tokens to SQLite]
    end

    subgraph StudentRoom [Student Exam Room]
        E -- Valid --> P[Open /exam/token with IntegrityGuard]
        E -- Invalid Email --> Q[Display Unauthorized Roster Error]
    end
```

---

## 3. Google Classroom & Authentication Details

### 3.1 Dependencies
* `next-auth@beta` (Auth.js v5) or standard Google OAuth handler
* `googleapis`: Official Google APIs Node.js client library

### 3.2 Required OAuth Scopes
* `openid`
* `https://www.googleapis.com/auth/userinfo.email`
* `https://www.googleapis.com/auth/userinfo.profile`
* `https://www.googleapis.com/auth/classroom.courses.readonly`
* `https://www.googleapis.com/auth/classroom.rosters.readonly`

### 3.3 Role Assignment Logic
When an authenticated session is established, the application queries:
```typescript
const classroom = google.classroom({ version: 'v1', auth: oauth2Client });
const response = await classroom.courses.list({
  teacherId: 'me',
  courseStates: ['ACTIVE']
});
const isTeacher = (response.data.courses && response.data.courses.length > 0) || false;
const role = isTeacher ? 'TEACHER' : 'STUDENT';
```
* **Teacher:** Redirected to the Teacher Portal (`/teacher`).
* **Student:** Redirected to their exam room if a pending code exists, or prompted to enter an exam code.

---

## 4. Database Schema Changes

Updating `prisma/schema.prisma` and SQLite tables in `lib/db.ts`:

### 4.1 `Exam` Model Additions
```prisma
model Exam {
  id                     String         @id @default(cuid())
  title                  String
  subject                String
  lessonContent          String
  language               String         @default("English")
  accessCode             String         @unique
  durationMinutes        Int            @default(30)
  totalQuestions         Int            @default(5)
  timeSavedHoursEstimate Float          @default(4.0)
  googleCourseId         String?        // Google Classroom Course ID
  googleCourseName       String?        // Name of Course from Google Classroom
  teacherEmail           String?        // Email of teacher owner
  createdAt              DateTime       @default(now())
  
  studentExams           StudentExam[]
  analytics              ExamAnalytics?
}
```

### 4.2 `StudentExam` Model Additions
```prisma
model StudentExam {
  id               String            @id @default(cuid())
  examId           String
  studentName      String
  studentEmail     String?           // Google email for account verification
  accessToken      String            @unique @default(cuid())
  status           String            @default("PENDING") // PENDING | IN_PROGRESS | SUBMITTED | FLAGGED
  totalScore       Float?
  maxPossibleScore Float             @default(100)
  startedAt        DateTime?
  submittedAt      DateTime?
  
  exam             Exam              @relation(fields: [examId], references: [id], onDelete: Cascade)
  questions        QuestionVariant[]
  integrityLogs    IntegrityLog[]
}
```

---

## 5. UI & Route Design

### 5.1 Landing Page (`app/page.tsx`)
The page contains exactly two primary elements in a clean, distraction-free container:
1. **Input Field:**
   - Placeholder: *"Enter 6-Digit Exam Code"*
   - Action: Submitting code redirects to `/join?code=XXXXXX` or directly checks session and routes to `/exam/[token]`.
2. **Sign in with Google Button:**
   - Standard Google Sign-In button executing the OAuth flow.
   - Direct text: *"Sign in with Google"*.

### 5.2 Header / Navigation (`components/Navbar.tsx`)
* When user is **not signed in**: Navigation links to "Teacher Portal" and "Student Portal" are hidden completely. Only the AegisExam AI logo is visible.
* When user is **signed in as Teacher**: Displays "Teacher Dashboard", user avatar/email, and a "Sign Out" button.
* When user is **signed in as Student**: Displays student name/avatar, active exam indicator, and "Sign Out" button.

### 5.3 Teacher Exam Creation Wizard (`app/teacher/create/page.tsx`)
1. **Google Classroom Course Selector:**
   - Fetches active courses via server action `getTeacherGoogleCoursesAction()`.
   - Dropdown displays course name and section (e.g., *"Grade 10 Biology - Period 2"*).
2. **Live Roster Auto-Sync:**
   - Selecting a course calls `getCourseStudentsAction(courseId)`.
   - Displays list of students with count badge: *"✓ 24 Students Imported from Google Classroom"*.
   - Populates student names and Google emails automatically into the exam generation input.
3. **Exam Parameters & Lesson Notes:**
   - Teacher inputs lesson text, selects target language (English, Tagalog, Bisaya), question count, and duration.
4. **Isomorphic Generation:**
   - Gemini generates individualized isomorphic question variants mapped to each student's name and email.

### 5.4 Student Exam Gatekeeping (`app/exam/[token]/page.tsx`)
* Student navigates to `/exam/[token]`.
* Server action verifies:
  1. The user is logged in via Google.
  2. The logged-in Google email matches the `studentEmail` on the `StudentExam` record.
* If not authenticated, redirect to `/` with `?redirect=/exam/[token]`.
* If authenticated with a mismatched email, display an unauthorized error screen: *"Access Denied: This exam is assigned to [studentEmail]. You are currently signed in as [currentUserEmail]."*

---

## 6. Route Protection Middleware (`middleware.ts`)

Next.js middleware protects routes based on session tokens:
* `/teacher/:path*`: Requires authenticated session with `role === 'TEACHER'`. If unauthenticated or student, redirects to `/`.
* `/exam/:path*`: Requires authenticated session. If unauthenticated, redirects to `/`.
* `/join`: Redirects to `/` (since code entry is unified on `/`).

---

## 7. Error Handling & Edge Cases

1. **Course With No Students:**
   - If `courses.students.list` returns an empty array, the interface alerts: *"No students found in this Google Classroom course. Please enroll students before creating an exam."* The generate button is disabled.
2. **OAuth Token Refresh:**
   - If the Google access token expires during course fetching, Auth.js uses the refresh token to silently refresh the session.
3. **Invalid Exam Code:**
   - Inline red alert on the landing page: *"Exam code not found. Please verify the 6-digit code with your instructor."*
4. **Multiple Accounts / Mismatched Student Email:**
   - Allows the student to click "Switch Account" to re-authenticate with their school-issued Google account.

---

## 8. Verification & Test Plan

1. **Gatekeeping Verification:**
   - Navigate to `/teacher` in an incognito window $\rightarrow$ verify immediate redirect to `/`.
   - Navigate to `/exam/test-token` in an incognito window $\rightarrow$ verify immediate redirect to `/`.
2. **Landing Page Verification:**
   - Confirm only the code input field and Google Sign-in button appear on `/`.
   - Ensure header navigation links are absent for unauthenticated visitors.
3. **Teacher Course Import Test:**
   - Log in as teacher with Google OAuth.
   - Go to `/teacher/create` $\rightarrow$ verify Google Classroom courses appear in dropdown.
   - Select course $\rightarrow$ verify roster loads with names and emails.
   - Generate exam $\rightarrow$ verify exam record stores `googleCourseId` and student records store `studentEmail`.
4. **Student Entry Test:**
   - As enrolled student, enter 6-digit code on `/` $\rightarrow$ sign in with matching Google email $\rightarrow$ verify instant entry into personalized exam room.
   - Test with non-enrolled Google account $\rightarrow$ verify unauthorized warning screen is shown.
