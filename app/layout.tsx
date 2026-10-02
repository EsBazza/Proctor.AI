import type { Metadata } from 'next';
import { Plus_Jakarta_Sans, Geist_Mono, Source_Serif_4, IBM_Plex_Mono } from 'next/font/google';
import './globals.css';
import { Navbar } from '@/components/Navbar';

const plusJakartaSans = Plus_Jakarta_Sans({
  subsets: ['latin'],
  weight: ['400', '500', '600', '700', '800'],
  variable: '--font-plus-jakarta-sans',
  display: 'swap',
});

const geistMono = Geist_Mono({
  subsets: ['latin'],
  weight: ['400', '500', '600', '700'],
  variable: '--font-geist-mono',
  display: 'swap',
});

const sourceSerif = Source_Serif_4({
  subsets: ['latin'],
  variable: '--font-source-serif',
  display: 'swap',
});

const ibmPlexMono = IBM_Plex_Mono({
  subsets: ['latin'],
  weight: ['400', '500', '600'],
  variable: '--font-ibm-plex-mono',
  display: 'swap',
});

export const metadata: Metadata = {
  title: 'Proctor.AI — Smarter Assessments. Stronger Integrity.',
  description: 'AI-powered isomorphic assessments, 10-second multi-frame video forensics ring buffer, and Google Classroom synchronization.',
  icons: {
    icon: [
      { url: '/1.png' },
      { url: '/1.png', sizes: '32x32', type: 'image/png' },
      { url: '/1.png', sizes: '16x16', type: 'image/png' },
    ],
    shortcut: '/1.png',
    apple: '/1.png',
  },
};


export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en" className="scroll-smooth">
      <body
        className={`${plusJakartaSans.variable} ${geistMono.variable} ${sourceSerif.variable} ${ibmPlexMono.variable} bg-proctor-cream/40 text-proctor-navy min-h-screen flex flex-col font-sans selection:bg-proctor-navy selection:text-white antialiased`}
      >
        <Navbar />
        <main className="flex-1">
          {children}
        </main>
      </body>
    </html>
  );
}

