# Proctor.AI Landing Page & About Page Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Build a high-fidelity, responsive landing page and about page for Proctor.AI featuring a 5-second hero visual carousel with a white fade overlay, Google Auth / Teacher CTA, responsive brand logos (`1.png`, `2.png`, `3.png`), the official color palette (`colors.png`), and typography powered by Plus Jakarta Sans and Geist Mono.

**Architecture:** Next.js 16 App Router application with React 19, Tailwind CSS v4, Lucide React icons, and NextAuth Google authentication.

**Tech Stack:** Next.js 16, React 19, Tailwind CSS v4, NextAuth v5, Lucide React, Google Gemini AI (specs), Prisma.

## Global Constraints
- Headings & Subheadings: `Plus Jakarta Sans`
- Descriptions, numbers, emails, numerical data & code: `Geist Mono`
- Brand colors from `colors.png`: `#0B1D39` (Navy), `#123A63` (Academic Blue), `#2F5D8A` (Slate Cerulean), `#9CC7E6` (Sky Blue), `#F2E9DA` (Warm Paper/Cream)
- Hero Tagline: "Smarter Assessments. Stronger Integrity."
- Hero 5-second auto-cycling carousel with white left-to-right gradient overlay
- Navbar: Proctor AI logo on left, Home and About links on right, with Teacher Portal / Google Sign In CTA
- Fully responsive across mobile, tablet, desktop, and ultra-wide
- No git commands or test commands to be run per user instruction

---

### Task 1: Typography and Theme System Setup
**Files:**
- Modify: `app/layout.tsx`
- Modify: `app/globals.css`

- [ ] **Step 1: Configure Fonts in `app/layout.tsx`**
  Import `Plus_Jakarta_Sans` and `Geist_Mono` from `next/font/google`. Define `--font-jakarta-sans` and `--font-geist-mono` variables and apply them to `RootLayout`.

- [ ] **Step 2: Configure Theme Variables & Color Palette in `app/globals.css`**
  Update CSS variables to declare the exact Proctor AI palette tokens (`#0B1D39`, `#123A63`, `#2F5D8A`, `#9CC7E6`, `#F2E9DA`), define font-family mappings, and add utility classes for the left-to-right white gradient overlays and carousel animations.

---

### Task 2: Responsive Navbar with Proctor.AI Branding & Navigation Links
**Files:**
- Modify: `components/Navbar.tsx`

- [ ] **Step 1: Implement `components/Navbar.tsx`**
  - Left: Fluid Proctor.AI logo incorporating `public/1.png` and `public/3.png`.
  - Right: `Home` (`/`) and `About` (`/about`) links with active styling.
  - Action button: Google Sign In / Teacher Portal button (`Continue with Google` / `Teacher Portal`) for unauthenticated users, and session indicator + Teacher Ledger link + Sign Out for authenticated users.
  - Mobile: Responsive slide-down menu with mobile nav toggles.

---

### Task 3: 5-Second Auto-Cycling Hero Visual Carousel Component
**Files:**
- Create: `components/HeroCarousel.tsx`

- [ ] **Step 1: Build `components/HeroCarousel.tsx`**
  - Create interactive visual slides representing:
    1. Isomorphic Question Engine & Seed-based variations.
    2. 10-Second Continuous Multi-Frame Video Forensics Ring Buffer.
    3. Live Teacher Flight Board & Monitoring Grid.
    4. Google Classroom Deep Integration & AI Grading.
  - Auto-cycle slides every 5000ms (5 seconds) with animated progress indicators.
  - Left-to-right white gradient overlay (`bg-gradient-to-r from-white via-white/80 to-transparent`) to ensure contrast with text.
  - Interactive manual navigation controls (pill indicators, arrows, pause-on-hover).

---

### Task 4: Interactive Live Isomorphic Engine Simulator Widget
**Files:**
- Create: `components/IsomorphicDemo.tsx`

- [ ] **Step 1: Build `components/IsomorphicDemo.tsx`**
  - Interactive demonstration widget where users can switch between Student Seeds (e.g. Student A vs. Student B) to see real-time isomorphic variations of identical Bloom's Taxonomy learning objectives.

---

### Task 5: Proctor.AI Landing Page
**Files:**
- Modify: `app/page.tsx`

- [ ] **Step 1: Implement `app/page.tsx`**
  - Hero Section: Upper section with responsive Proctor.AI logo (`2.png` / `1.png`), tagline *"Smarter Assessments. Stronger Integrity."*, descriptive copy, Google Auth CTA button, candidate 6-digit access code entry card, trust telemetry stats, and `HeroCarousel` with white left-to-right fade overlay.
  - Feature Deep-Dive Section: Bento grid showcasing Isomorphic Generation, 10s Multi-Frame Forensics, Google Classroom Sync, 7 Question Formats, and Teacher Fatigue Savings.
  - Interactive Simulator Section: Embedded `IsomorphicDemo`.
  - Institutional Trust & Security Assurance section.
  - Conversion Footer / CTA banner.

---

### Task 6: Dedicated About Page with Tech Stack & Primary Features
**Files:**
- Create: `app/about/page.tsx`

- [ ] **Step 1: Implement `app/about/page.tsx`**
  - Hero Banner with Proctor AI story & mission.
  - Interactive Technology Stack Bento Grid (Frontend, AI Intelligence, Backend & Database, Google APIs).
  - Deep-Dive Feature Breakdown with visual badges & diagrams (Isomorphic Engine, 10s Ring Buffer, Classroom Sync, Flight Board).
  - Architectural Pipeline Flowchart & Technical Guarantees (FERPA, zero biometric storage, Bloom's equivalence).
  - Quick CTA to return to Home or enter Teacher Portal.

---

### Task 7: Review & Visual Consistency Verification
- [ ] **Step 1: Verify all routes, responsive breakpoints, image paths, fonts, and colors match the spec.**
