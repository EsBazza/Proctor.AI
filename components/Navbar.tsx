import React from 'react';
import { auth, signOut } from '@/lib/auth';
import { NavbarClient } from './NavbarClient';

export async function Navbar() {
  const session = await auth();
  const user = session?.user;

  const handleSignOut = async () => {
    'use server';
    await signOut({ redirectTo: '/' });
  };

  return <NavbarClient user={user} onSignOut={handleSignOut} />;
}
