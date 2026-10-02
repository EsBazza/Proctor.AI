# Proctor.AI — Landing Page & About Page Specification

## 1. Overview & Objectives
Proctor.AI (powered by the PatunAI isomorphic engine) is an AI-powered assessment, Google Classroom synchronization, and real-time multi-frame forensic anti-cheating platform. 

This specification establishes the frontend design and implementation for:
1. **The Modern Academic-Tech Landing Page (`/`)**:
   - Upper hero Proctor.AI responsive logo presentation (`public/2.png` and `public/1.png`).
   - Tagline: *"Smarter Assessments. Stronger Integrity."*
   - Interactive 5-second auto-cycling hero carousel with a smooth left-to-right white gradient overlay.
   - Dual Call-to-Actions (Teacher Portal Google OAuth Sign-In + Student Examination Code Input card).
   - Platform value propositions, feature bento grids, and interactive live exam variant simulator.
2. **The Responsive Header & Navigation (`Navbar.tsx`)**:
   - Fluid Proctor.AI logo on the left (`1.png` + `3.png`).
   - Navigation links on the right: **Home** (`/`) and **About** (`/about`) with active state tracking.
   - Dynamic CTA (Sign In with Google / Teacher Portal button or user profile status when logged in).
   - Mobile responsive slide-over / dropdown menu.
3. **The Dedicated About Page (`/about`)**:
   - Comprehensive showcase of the Proctor.AI technology stack.
   - Visual deep-dives into primary features:
     - Isomorphic Question Variant Generation Engine (Google Gemini AI).
     - 10-Second Continuous Multi-Frame Forensics Ring Buffer (T-5s to T+5s).
     - Bi-directional Google Classroom Orchestration.
     - Teacher Flight Board & Veyon-style Live Grid.
     - Automated Bloom's Taxonomy Rubric Grading.
   - Interactive system architecture diagrams and technical specifications.

---

## 2. Design System & Typography

### 2.1 Typography Architecture
- **Headings & Subheadings**: `Plus Jakarta Sans` (`--font-sans` / `--font-jakarta-sans`) via `next/font/google`.
- **Descriptions, Numerals, Code, Timers & Metadata**: `Geist Mono` (`--font-mono` / `--font-geist-mono`) via `next/font/google` with tabular numbers enabled (`tabular-nums`).

### 2.2 Color Palette Tokens (Derived from `colors.png`)
| Token Name | HEX Value | Semantic Usage |
|---|---|---|
| `--color-proctor-navy` | `#0B1D39` | Midnight Ink: Primary headings, solid CTAs, deep borders |
| `--color-proctor-blue` | `#123A63` | Academic Blue: Hero accents, primary brand elements, active links |
| `--color-proctor-slate` | `#2F5D8A` | Slate Cerulean: Secondary text, icons, hover borders |
| `--color-proctor-sky` | `#9CC7E6` | Soft Sky Blue: Badges, progress bars, light highlights, glows |
| `--color-proctor-cream` | `#F2E9DA` | Warm Cream/Paper: Subtle card backgrounds, warm accents |
| `--color-proctor-white` | `#FFFFFF` | Base clean paper canvas, card grounds |

---

## 3. Component Architecture & Detailed Layouts

### 3.1 Global Layout (`app/layout.tsx`)
- Configures `Plus_Jakarta_Sans` and `Geist_Mono` with CSS variables `--font-jakarta-sans` and `--font-geist-mono`.
- Applies root color tokens and renders the unified `Navbar` and footer.

### 3.2 Header & Navigation Bar (`components/Navbar.tsx`)
- **Left**: Fluid Proctor.AI logo lockup (`1.png` + `3.png`) linking to `/`.
- **Right**:
  - `Home` (`/`) and `About` (`/about`) links with active route indicators.
  - Teacher Portal / Google Sign In button with Google G icon and Lucide arrow icon.
  - Session-aware rendering: Displays Teacher Ledger link + user email + Sign Out when authenticated.
  - Responsive mobile hamburger menu with smooth toggle.

### 3.3 Hero Section & 5-Second Carousel (`app/page.tsx` + `components/HeroCarousel.tsx`)
- **Left Hero Column**:
  - Brand header with fluid logo lockup (`2.png` / `1.png`).
  - Tagline: *"Smarter Assessments. Stronger Integrity."*
  - Descriptive summary of isomorphic generation, multi-frame forensics, and classroom sync.
  - Primary Action: Direct Google Sign In button for educators ("Continue with Google").
  - Candidate Access Box: 6-digit access code entry form connecting students directly to active tests.
  - Trust / Metric badges: 0% LLM Collusion, 10s Ring Buffer Forensics, 100% Google Classroom Sync.
- **Right Hero Column & Visual Background**:
  - `HeroCarousel.tsx` with 4 high-fidelity interactive simulation slides:
    1. *Isomorphic Variant Generation Engine* (Math & Context Seed comparison).
    2. *10-Second Continuous Multi-Frame Forensics* (T-5s to T+5s ring buffer with AI threat tagging).
    3. *Live Teacher Flight Board & Monitoring Grid* (Real-time student status matrix).
    4. *Google Classroom Bi-Directional Synchronization* (Automatic roster & grade push).
  - Auto-transitions every 5,000ms (5 seconds) with animated progress timer bar.
  - Left-to-Right white overlay fade (`bg-gradient-to-r from-white via-white/80 to-transparent`) ensuring readability on text columns.
  - Interactive manual slide controls (previous/next arrows, numbered indicators, pause-on-hover).

### 3.4 Deep-Dive Feature Sections on Landing Page (`app/page.tsx`)
1. **Core Feature Bento Grid**: 
   - Isomorphic Exam Engine (Seed-based question derivation).
   - 10-Second Pre/Post Forensic Video Capture.
   - Google Classroom Native Roster & Grade Sync.
   - 7 Comprehensive Question Formats (MCQ, Multi-Select, Numerical Tolerance, Step Proofs, Free Response, Code, Fill-in-Blank).
   - Teacher Fatigue & Time Savings Engine.
2. **Interactive Live Isomorphic Engine Simulator**:
   - Lets visitors toggle between "Student A (Seed: 4082)" and "Student B (Seed: 9147)" to witness how identical Bloom's Taxonomy learning objectives produce unique, anti-cheat question prompts and values in real-time.
3. **CTA Footer Section**: Direct launchpad to sign in and create an exam in under 60 seconds.

### 3.5 Dedicated About Page (`app/about/page.tsx`)
1. **Hero & Origin Story**: The mission to restore authentic academic evidence in the era of generative AI.
2. **Interactive Technology Stack Bento Grid**:
   - **Frontend**: Next.js 16 (App Router), React 19, Tailwind CSS v4, Plus Jakarta Sans, Geist Mono, Lucide React.
   - **AI & Intelligence Engine**: Google Gemini 2.5 Flash / Gemini Pro for isomorphic synthesis & vision threat analysis.
   - **Backend & Database**: PostgreSQL, Prisma ORM, NextAuth v5 (Auth.js), Next.js Server Actions.
   - **Integrations**: Google Classroom API (Courses, CourseWork, StudentSubmissions).
3. **Deep Architecture & Core Mechanisms**:
   - The "Quiet Instrument" Philosophy (Paper Register vs. Ledger Register).
   - Multi-Frame Forensic Ring Buffer Mechanics (T-5s to T+5s continuous circular buffer).
   - Isomorphic Variant Equivalence Formula (Bloom's Taxonomy Cognitive Mapping).
4. **Interactive Architecture Flow Diagram**:
   - Visualized step-by-step pipeline from Teacher Ingestion -> AI Synthesis -> Classroom Dispatch -> Real-time Proctoring -> AI Grading & Gradebook sync.

---

## 4. Quality & Responsiveness Assurance
- Full responsiveness testing across mobile (320px–640px), tablet (768px–1024px), desktop (1280px+), and ultra-wide screens.
- Strict WCAG AAA/AA color contrast conformance using the `#0B1D39`, `#123A63`, `#2F5D8A`, `#9CC7E6`, and `#F2E9DA` tokens.
- Zero layout shift during carousel cycling.
- Full TypeScript compilation and build verification.
