# Student Hero Exam Code Input Design

## Overview
Transform the hero action center on the home page (`/`) when a student is logged in. Instead of rendering the teacher "Open Ledger" button, render a responsive, interactive 6-digit exam code input field so students can quickly enter their exam code and access their examination session.

## User Roles & UI States

### 1. Unauthenticated (`!session`)
- Primary Google Sign-in CTA ("Get Started" / "Sign in with Google").

### 2. Teacher Session (`session.user.role === 'TEACHER'`)
- "Institutional Session Active" card with student/teacher email.
- "Open Ledger" button linking to `/teacher`.

### 3. Student Session (`session.user.role === 'STUDENT'`)
- "Student Session Active" card displaying student account email and role badge.
- Interactive 6-digit code input field with formatted font and placeholder.
- "Enter Exam" action button triggering `validateExamCodeAction(code)`.
- Inline error and loading states.
- On valid code verification, client redirects to `/exam/[token]`.

## Components & Data Flow

- **Page**: `app/page.tsx`
  - Passes `session.user` info and initial `code` (if provided in `searchParams`) to `StudentHeroAccess` or dynamically renders role-specific UI.
- **Client Component**: `components/StudentHeroAccess.tsx` (or `app/StudentCodeInput.tsx`)
  - Form input with validation state (`isValidating`, `error`).
  - Calls `validateExamCodeAction(cleanCode)` from `actions/student.ts`.
  - Seamlessly handles redirect to `redirectUrl` (`/exam/${studentExam.accessToken}`).
