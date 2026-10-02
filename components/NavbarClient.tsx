'use client';

import React, { useState } from 'react';
import Link from 'next/link';
import Image from 'next/image';
import { usePathname } from 'next/navigation';
import { LogOut, ArrowRight, Menu, X, LayoutDashboard, ShieldCheck, Sparkles } from 'lucide-react';

interface NavbarClientProps {
  user?: {
    name?: string | null;
    email?: string | null;
    role?: string | null;
  } | null;
  onSignOut: () => Promise<void>;
}

export function NavbarClient({ user, onSignOut }: NavbarClientProps) {
  const pathname = usePathname();
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const isTeacher = user?.role === 'TEACHER';

  const navLinks = [
    { name: 'Home', href: '/' },
    { name: 'About', href: '/about' },
  ];

  return (
    <header className="sticky top-0 z-50 w-full bg-white/95 backdrop-blur-md border-b border-[#0B1D39]/10 shadow-[0_1px_3px_rgba(11,29,57,0.03)]">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 h-18 sm:h-20 flex items-center justify-between">
        {/* Left: Proctor.AI Logo Wordmark */}
        <Link
          href="/"
          className="flex items-center group transition-transform hover:scale-[1.02] active:scale-[0.98]"
        >
          <div className="relative w-52 sm:w-64 md:w-72 h-8 sm:h-10 md:h-11 flex-shrink-0">
            <Image
              src="/3.png"
              alt="Proctor.AI"
              fill
              sizes="(max-width: 640px) 208px, (max-width: 768px) 256px, 288px"
              priority
              className="object-contain"
            />
          </div>
        </Link>


        {/* Right Desktop Navigation */}
        <div className="hidden md:flex items-center gap-6">
          <nav className="flex items-center gap-1">
            {navLinks.map((link) => {
              const isActive = pathname === link.href;
              return (
                <Link
                  key={link.name}
                  href={link.href}
                  className={`relative px-3.5 py-2 text-sm font-semibold transition-colors duration-150 rounded-md font-sans ${
                    isActive
                      ? 'text-[#0B1D39] bg-[#0B1D39]/5'
                      : 'text-[#576375] hover:text-[#0B1D39] hover:bg-slate-100/70'
                  }`}
                >
                  {link.name}
                  {isActive && (
                    <span className="absolute bottom-0 left-3.5 right-3.5 h-0.5 bg-[#2F5D8A] rounded-full" />
                  )}
                </Link>
              );
            })}
          </nav>

          <div className="h-5 w-px bg-slate-200" />

          {/* User State CTA */}
          {user ? (
            <div className="flex items-center gap-3">
              {isTeacher && (
                <Link
                  href="/teacher"
                  className="flex items-center gap-1.5 px-3.5 py-2 rounded-lg text-xs font-semibold bg-[#123A63] hover:bg-[#0B1D39] text-white shadow-sm transition-all duration-150 hover:shadow"
                >
                  <LayoutDashboard className="w-3.5 h-3.5" />
                  <span>Teacher Ledger</span>
                </Link>
              )}

              <div className="flex items-center gap-2 text-xs font-mono text-[#0B1D39] border border-[#0B1D39]/15 px-3 py-1.5 rounded-lg bg-slate-50/90 shadow-2xs">
                <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse" aria-hidden="true" />
                <span className="max-w-[140px] truncate font-medium">{user.name || user.email}</span>
                <span className="text-[10px] uppercase font-semibold text-[#576375] bg-white px-1.5 py-0.5 rounded border border-slate-200">
                  {user.role}
                </span>
              </div>

              <form action={onSignOut}>
                <button
                  type="submit"
                  className="flex items-center gap-1.5 px-3 py-2 rounded-lg text-xs font-mono text-[#576375] hover:text-[#0B1D39] hover:bg-slate-100 transition-colors border border-transparent hover:border-slate-200"
                  title="Sign Out"
                >
                  <LogOut className="w-3.5 h-3.5" />
                  <span className="hidden lg:inline">Sign Out</span>
                </button>
              </form>
            </div>
          ) : (
            <div className="flex items-center gap-2.5">
              <Link
                href="/teacher"
                className="group flex items-center gap-2 px-4 py-2 rounded-lg text-xs sm:text-sm font-bold bg-[#0B1D39] hover:bg-[#123A63] text-white shadow-sm hover:shadow-md transition-all duration-150 font-sans"
              >
                <svg className="w-4 h-4" viewBox="0 0 24 24" aria-hidden="true">
                  <path
                    fill="#4285F4"
                    d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"
                  />
                  <path
                    fill="#34A853"
                    d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"
                  />
                  <path
                    fill="#FBBC05"
                    d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.06H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.94l2.85-2.22.81-.63z"
                  />
                  <path
                    fill="#EA4335"
                    d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.06l3.66 2.84c.87-2.6 3.3-4.52 6.16-4.52z"
                  />
                </svg>
                <span>Sign In</span>
                <ArrowRight className="w-3.5 h-3.5 transition-transform group-hover:translate-x-0.5" />
              </Link>

            </div>
          )}
        </div>


        {/* Mobile Hamburger Button */}
        <div className="flex md:hidden items-center gap-2">
          <button
            onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
            className="p-2 rounded-lg text-[#0B1D39] hover:bg-slate-100 transition-colors"
            aria-label="Toggle Navigation Menu"
          >
            {mobileMenuOpen ? <X className="w-6 h-6" /> : <Menu className="w-6 h-6" />}
          </button>
        </div>
      </div>

      {/* Mobile Drawer Menu */}
      {mobileMenuOpen && (
        <div className="md:hidden border-t border-slate-200 bg-white/98 px-4 pt-3 pb-6 space-y-3 shadow-lg">
          <nav className="flex flex-col space-y-1">
            {navLinks.map((link) => {
              const isActive = pathname === link.href;
              return (
                <Link
                  key={link.name}
                  href={link.href}
                  onClick={() => setMobileMenuOpen(false)}
                  className={`flex items-center justify-between px-4 py-2.5 rounded-lg text-sm font-semibold ${
                    isActive
                      ? 'bg-[#0B1D39]/5 text-[#0B1D39]'
                      : 'text-[#576375] hover:bg-slate-50 hover:text-[#0B1D39]'
                  }`}
                >
                  <span>{link.name}</span>
                  {isActive && <span className="w-1.5 h-1.5 rounded-full bg-[#2F5D8A]" />}
                </Link>
              );
            })}
          </nav>

          <div className="pt-2 border-t border-slate-100">
            {user ? (
              <div className="space-y-3">
                <div className="p-3 bg-slate-50 rounded-lg border border-slate-200 text-xs font-mono space-y-1">
                  <div className="font-semibold text-[#0B1D39]">{user.name || 'User'}</div>
                  <div className="text-[#576375] text-[11px] truncate">{user.email}</div>
                  <div className="text-[10px] uppercase font-bold text-[#2F5D8A] pt-1">
                    Role: {user.role}
                  </div>
                </div>

                {isTeacher && (
                  <Link
                    href="/teacher"
                    onClick={() => setMobileMenuOpen(false)}
                    className="w-full flex items-center justify-center gap-2 py-2.5 px-4 rounded-lg bg-[#123A63] text-white text-xs font-semibold"
                  >
                    <LayoutDashboard className="w-4 h-4" />
                    <span>Open Teacher Ledger</span>
                  </Link>
                )}

                <form action={onSignOut}>
                  <button
                    type="submit"
                    className="w-full flex items-center justify-center gap-2 py-2 px-4 rounded-lg border border-slate-200 text-[#576375] hover:text-[#0B1D39] text-xs font-mono"
                  >
                    <LogOut className="w-3.5 h-3.5" />
                    <span>Sign Out</span>
                  </button>
                </form>
              </div>
            ) : (
              <Link
                href="/teacher"
                onClick={() => setMobileMenuOpen(false)}
                className="w-full flex items-center justify-center gap-2.5 py-3 px-4 rounded-lg bg-[#0B1D39] text-white font-semibold text-sm shadow-sm"
              >
                <svg className="w-4 h-4" viewBox="0 0 24 24" aria-hidden="true">
                  <path
                    fill="#4285F4"
                    d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"
                  />
                  <path
                    fill="#34A853"
                    d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"
                  />
                  <path
                    fill="#FBBC05"
                    d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.06H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.94l2.85-2.22.81-.63z"
                  />
                  <path
                    fill="#EA4335"
                    d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.06l3.66 2.84c.87-2.6 3.3-4.52 6.16-4.52z"
                  />
                </svg>
                <span>Sign In</span>
                <ArrowRight className="w-4 h-4" />
              </Link>


            )}
          </div>
        </div>
      )}
    </header>
  );
}
