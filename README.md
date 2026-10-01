# PatunAI 🛡️

> **AI-Powered Isomorphic Assessment, Google Classroom Orchestration & Real-Time Multi-Frame Forensic Anti-Cheating Platform**  
> *"Every student gets a different exam. Every exam measures the same thing."*  
> Derived from Tagalog **patunay** (*proof, evidence, testimony*).

[![Next.js](https://img.shields.io/badge/Next.js-16.3-black?logo=next.js)](https://nextjs.org/)
[![Google Gemini](https://img.shields.io/badge/Google%20Gemini-3.6%20%2F%203.5-4285F4?logo=google)](https://deepmind.google/technologies/gemini/)
[![Google Classroom](https://img.shields.io/badge/Google%20Classroom-Integrated-0F9D58?logo=googleclassroom)](https://classroom.google.com/)
[![Prisma](https://img.shields.io/badge/Prisma-6.19-2D3748?logo=prisma)](https://www.prisma.io/)
[![PostgreSQL](https://img.shields.io/badge/PostgreSQL-Supabase-336791?logo=postgresql)](https://supabase.com/)
[![Deployment](https://img.shields.io/badge/Deployed-Vercel-black?logo=vercel)](https://patun-ai.vercel.app)

---

## 📖 Complete Documentation
For exhaustive system architecture, data models, forensic pipelines, and API references, read the [**Full System Documentation (DOCUMENTATION.md)**](./DOCUMENTATION.md).

---

## 🌟 Key Features

1. **True Isomorphic Personalization**:
   - Generates mathematically and conceptually equivalent question variants tailored per student.
   - Eliminates cheating by design — no two students receive the identical test set, yet both test identical learning objectives at the same Bloom's Taxonomy cognitive level.

2. **The "Quiet Instrument" Interface**:
   - **Paper Register (`/exam/[token]`)**: Typeset like a physical printed exam booklet on screen (Source Serif 4, ruled answer rows, 0 distracting animations, long reading measure).
   - **Ledger Register (`/teacher`)**: High-density flight board and operations ledger with 1px hairline rules, tabular numerals (`tnum`), mono timestamps, and vermilion signals.

3. **Continuous 10-Second Multi-Frame Forensics**:
   - A 1 fps ring buffer records 5 seconds prior to an infraction (T-5s to T-1s), captures the trigger event (T0), and continues recording for 5 seconds post-infraction (T+1s to T+5s) alongside keystrokes.
   - Gemini Vision AI forensic analysis scores threats (`CRITICAL`, `SUSPICIOUS`, `LOW`, `BENIGN`).
   - Interactive Forensic Filmstrip Inspector with variable playback speed (`0.5x`, `1.0x`, `2.0x`) and teacher adjudication.

4. **Strict 2-Strike Lockout & Instant Recovery**:
   - Strike 1 alerts the student; Strike 2 immediately locks the exam, freezing timers and questions while preserving answers.
   - 1-click teacher unlock instantly restores the student's exam room via real-time polling without requiring a page refresh.

5. **Google Classroom Deep Integration**:
   - Live roster auto-sync with 1-click student attendance checklists.
   - Automatically publishes private, personalized CourseWork assignments directly to each student's Google Classroom feed with direct room links and individual access tokens.
   - 1-click exam deletion automatically cleans up posted coursework assignments from Google Classroom.

6. **Curriculum Ingestion & Saved Materials Library**:
   - Parses multiple PDFs, scanned images, and lecture notes simultaneously via Gemini 3.5 Flash Lite.
   - **Saved Materials Library**: Uploaded documents are automatically preserved in PostgreSQL, allowing teachers to browse, search, and reuse past files with 1 click without ever having to re-upload them.
   - **"+ Append" Action**: Concatenates multiple past chapters into a single cumulative midterm or final examination.

7. **Expanded 7-Format Question Suite & Scaled Limits**:
   - Supports Multiple Choice (`MCQ`), True or False (`TRUE_FALSE`), Short Answer (`SHORT_ANSWER`), Essay (`ESSAY` with live word counter), Fill in the Blank (`FILL_IN_BLANK`), Matching Type (`MATCHING`), and Identification (`IDENTIFICATION`).
   - Scaled from 1 to 100 questions per student with instant preset chips (`5`, `10`, `15`, `20`, `25`, `30`, `50`).
   - 3 Point Schemes: AI Smart Dynamic, Uniform Fixed Points, or Custom Points by Format.

8. **Multilingual Localization**:
   - Native exam generation in **English**, **Tagalog (Filipino)**, and **Bisaya (Cebuano)**.

9. **Automated AI Grading & Cohort Analytics**:
   - Step-by-step reasoning rubrics and constructive feedback.
   - Cohort performance synthesis highlighting class-wide conceptual gaps and next-lesson recommendations.
   - Teacher fatigue savings metric quantifying cognitive hours saved.

---

## 🚀 Quick Start

### 1. Prerequisites
- Node.js 20+
- Google Cloud Console Project with Google Classroom API enabled
- Google Gemini API Key
- Supabase / Neon PostgreSQL Database

### 2. Installation
```bash
git clone https://github.com/EsBazza/exam-AI.git
cd exam-AI
npm install
```

### 3. Environment Setup
Copy `.env.example` to `.env`:
```ini
DATABASE_URL="postgresql://user:password@host:6543/postgres?pgbouncer=true"
DIRECT_URL="postgresql://user:password@host:5432/postgres"

AUTH_SECRET="your_secure_auth_secret_key"
AUTH_URL="http://localhost:3000"
NEXTAUTH_URL="http://localhost:3000"

AUTH_GOOGLE_ID="your_google_oauth_client_id"
AUTH_GOOGLE_SECRET="your_google_oauth_client_secret"

GEMINI_API_KEY="your_gemini_api_key"
```

### 4. Database Setup & Run
```bash
npx prisma db push
npx prisma generate
npm run dev
```

Navigate to `http://localhost:3000` to start using PatunAI.

---

## ☁️ Deploying to Vercel

1. **Push your repository** to GitHub.
2. **Import into Vercel**:
   - Vercel automatically detects Next.js.
   - The repository is pre-configured with `postinstall: prisma generate` and `vercel-build: prisma generate && next build` in `package.json`.
3. **Configure Environment Variables** in Vercel Project Settings (see [`.env.example`](./.env.example)):
   - `DATABASE_URL` & `DIRECT_URL`: Your Supabase/Neon PostgreSQL connection URLs.
   - `AUTH_SECRET`: Generate with `openssl rand -base64 32` or `npx auth secret`.
   - `AUTH_URL` & `NEXTAUTH_URL`: Set to `https://patun-ai.vercel.app`.
   - `AUTH_TRUST_HOST`: Set to `true`.
   - `AUTH_GOOGLE_ID` & `AUTH_GOOGLE_SECRET`: Your Google Cloud OAuth credentials.
   - `GEMINI_API_KEY`: Your Google Gemini API key.
   - *(Optional)* `DEFAULT_TEACHER_EMAIL`: Default email granted the teacher portal role.
4. **Update Google Cloud Console**:
   - Add your production callback URL under **Authorized redirect URIs**:
     `https://patun-ai.vercel.app/api/auth/callback/google`
5. **Database Schema Sync**:
   - Run `npx prisma db push` against your production `DATABASE_URL` to ensure the schema is current.

---

## 📄 License
MIT © 2026 PatunAI Team
