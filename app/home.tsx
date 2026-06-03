'use client';

import React, { useState } from 'react';
import Link from 'next/link';
import { Home, GraduationCap, ArrowRight } from 'lucide-react';
import { useAppContext } from '@/lib/AppContext';

export default function HomePage() {

  return (
    <div className="min-h-screen bg-gradient-to-br from-[#0f172a] to-[#1a1f35] text-[#f1f5f9] p-8">
      <div className="flex items-center gap-3 mb-12">
        <GraduationCap className="h-8 w-8 text-[#3b82f6]" />
        <h1 className="text-4xl font-bold">Workinspires</h1>
      </div>

      <div className="max-w-7xl">
        <p className="text-[#cbd5e1] mb-8">Features have been refactored into a modular architecture. Visit:</p>
        <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
          {[
            { href: '/dashboard', label: 'Dashboard' },
            { href: '/assignments', label: 'Assignments' },
            { href: '/forms', label: 'Forms' },
            { href: '/participants', label: 'Participants' },
            { href: '/companies', label: 'Companies' },
            { href: '/collections', label: 'Collections' },
            { href: '/results', label: 'Results' },
            { href: '/reports', label: 'Reports' },
            { href: '/settings', label: 'Settings' },
          ].map(({ href, label }) => (
            <Link key={href} href={href} className="p-4 rounded-lg border border-[#475569] bg-[#1e293b] hover:bg-[#334155] hover:border-[#3b82f6] transition-all">
              {label}
            </Link>
          ))}
        </div>
      </div>
    </div>
  );
}
