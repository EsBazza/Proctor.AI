import React from 'react';
import Link from 'next/link';
import { auth, signOut } from '@/lib/auth';
import { LogOut, ArrowRight } from 'lucide-react';

export async function Navbar() {
  const session = await auth();
  const user = session?.user;
  const isTeacher = user?.role === 'TEACHER';

  return (
    <header className="sticky top-0 z-40 w-full bg-paper border-b border-rule">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 h-14 flex items-center justify-between">
        <Link href="/" className="flex items-center gap-2.5 group">
          <div className="w-7 h-7 rounded-[2px] bg-ink text-paper flex items-center justify-center font-mono font-bold text-xs">
            PA
          </div>
          <div className="flex items-baseline gap-2">
            <span className="text-base font-semibold tracking-tight text-ink">
              PatunAI
            </span>
            <span className="hidden sm:inline-block text-[11px] font-mono uppercase tracking-wider text-ink-muted">
              Authentic Assessment
            </span>
          </div>
        </Link>

        {/* Dynamic Navigation */}
        {user ? (
          <nav className="flex items-center gap-3">
            {isTeacher && (
              <Link
                href="/teacher"
                className="flex items-center gap-1.5 px-3 py-1.5 rounded-[2px] text-xs font-medium border border-rule text-ink hover:bg-ground transition-colors"
              >
                <span>Teacher Ledger</span>
              </Link>
            )}

            <div className="flex items-center gap-2 text-xs font-mono text-ink-muted border border-rule px-2.5 py-1 rounded-[2px] bg-ground">
              <span className="w-1.5 h-1.5 rounded-full bg-verified" aria-hidden="true" />
              <span className="max-w-[130px] truncate">{user.name || user.email}</span>
              <span className="text-[10px] uppercase text-ink-muted/80">
                [{user.role}]
              </span>
            </div>

            <form
              action={async () => {
                'use server';
                await signOut({ redirectTo: '/' });
              }}
            >
              <button
                type="submit"
                className="flex items-center gap-1.5 px-2.5 py-1 rounded-[2px] text-xs font-mono text-ink-muted hover:text-ink hover:bg-ground transition-colors"
                title="Sign Out"
              >
                <LogOut className="w-3.5 h-3.5" />
                <span className="hidden sm:inline">Sign Out</span>
              </button>
            </form>
          </nav>
        ) : (
          <Link
            href="/teacher"
            className="flex items-center gap-1 text-xs font-medium text-ink-muted hover:text-ink transition-colors"
          >
            <span>Teacher Portal</span>
            <ArrowRight className="w-3.5 h-3.5" />
          </Link>
        )}
      </div>
    </header>
  );
}
