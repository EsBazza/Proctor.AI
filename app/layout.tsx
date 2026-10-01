import type { Metadata } from 'next';
import { Hanken_Grotesk, Source_Serif_4, IBM_Plex_Mono } from 'next/font/google';
import './globals.css';
import { Navbar } from '@/components/Navbar';

const hankenGrotesk = Hanken_Grotesk({
  subsets: ['latin'],
  variable: '--font-hanken-grotesk',
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
  title: 'PatunAI — Authentic Evidence, Fair Assessment',
  description: 'Cryptographically seeded isomorphic examinations with multi-frame motion forensics and Google Classroom synchronization.',
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en">
      <body
        className={`${hankenGrotesk.variable} ${sourceSerif.variable} ${ibmPlexMono.variable} bg-ground text-ink min-h-screen flex flex-col font-sans selection:bg-ink selection:text-paper`}
      >
        <Navbar />
        <main className="flex-1">
          {children}
        </main>
      </body>
    </html>
  );
}
