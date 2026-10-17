'use client';

import React, { useState, useEffect } from 'react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { useAuth } from '@/context/AuthContext';

export default function Navbar() {
  const { user, isAdmin, logout } = useAuth();
  const pathname = usePathname();
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);
  }, []);

  if (!mounted || pathname === '/login' || !user) {
    return null;
  }

  const navLinks = [
    { label: 'Dashboard', href: '/dashboard' },
    { label: 'Orders', href: '/orders' },
    { label: 'Menu', href: '/menu' }
  ];

  if (isAdmin) {
    navLinks.push({ label: 'Settings', href: '/settings' });
  }

  const isActive = (href) => {
    if (href === '/orders' && pathname.startsWith('/orders/new')) return false;
    if (href === '/orders' && pathname.startsWith('/orders/')) return true;
    return pathname === href;
  };

  return (
    <header className="sticky top-0 z-40 bg-white border-b border-stone-200">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex items-center justify-between h-16">
          {/* Brand Identity */}
          <div className="flex items-center gap-6">
            <Link href="/dashboard" className="flex items-center gap-2">
              <span className="text-base font-bold tracking-tight text-stone-900">
                Foodly Kitchen
              </span>
              <span className="text-[10px] font-bold text-stone-700 uppercase tracking-wider bg-white border border-stone-200 px-1.5 py-0.5 rounded-[3px]">
                POS
              </span>
            </Link>

            {/* Desktop Navigation - Thin borders with 3px border radius */}
            <nav className="hidden md:flex items-center gap-1.5">
              {navLinks.map((link) => {
                const active = isActive(link.href);
                return (
                  <Link
                    key={link.href}
                    href={link.href}
                    className={`px-3 py-1.5 text-xs transition-colors rounded-[3px] border ${
                      active
                        ? 'border-[#B8421E] bg-white text-[#B8421E] font-bold'
                        : 'border-transparent text-stone-600 hover:border-stone-200 hover:text-stone-900 font-medium'
                    }`}
                  >
                    {link.label}
                  </Link>
                );
              })}

              <Link
                href="/orders/new"
                className="ml-3 inline-flex items-center px-4 py-1.5 bg-[#B8421E] hover:bg-[#9E3515] text-white text-xs font-bold rounded-[3px] border border-[#B8421E] transition-colors"
              >
                + New Order
              </Link>
            </nav>
          </div>

          {/* User Status & Sign Out */}
          <div className="hidden md:flex items-center gap-4">
            <div className="flex items-center gap-2 pr-3 border-r border-stone-200">
              <span className="text-xs font-semibold text-stone-800">
                {user.name}
              </span>
              <span className="text-stone-400 text-xs">&middot;</span>
              <span className="text-[10px] uppercase font-bold text-stone-700 bg-white border border-stone-200 px-1.5 py-0.5 rounded-[3px]">
                {user.role}
              </span>
            </div>

            <button
              onClick={logout}
              className="text-xs font-medium text-stone-500 hover:text-stone-900 transition-colors cursor-pointer"
            >
              Sign out
            </button>
          </div>

          {/* Mobile hamburger */}
          <div className="flex md:hidden items-center gap-2">
            <Link
              href="/orders/new"
              className="px-2.5 py-1 bg-[#B8421E] text-white text-xs font-bold rounded-[3px] border border-[#B8421E]"
            >
              New
            </Link>
            <button
              onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
              className="p-1.5 rounded-[3px] border border-stone-200 text-stone-700 hover:text-stone-900 bg-white"
              aria-label="Toggle navigation"
            >
              <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                {mobileMenuOpen ? (
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                ) : (
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6h16M4 12h16M4 18h16" />
                )}
              </svg>
            </button>
          </div>
        </div>
      </div>

      {/* Mobile drawer */}
      {mobileMenuOpen && (
        <div className="md:hidden border-t border-stone-200 bg-white px-4 pt-3 pb-4 space-y-2">
          <div className="pb-2 border-b border-stone-200 flex items-center justify-between">
            <div>
              <p className="text-xs font-bold text-stone-900">{user.name}</p>
              <p className="text-[10px] text-stone-400">{user.email}</p>
            </div>
            <span className="text-[9px] uppercase font-bold px-1.5 py-0.5 rounded-[3px] border border-stone-200 bg-white text-stone-700">
              {user.role}
            </span>
          </div>

          <div className="space-y-1">
            {navLinks.map((link) => (
              <Link
                key={link.href}
                href={link.href}
                onClick={() => setMobileMenuOpen(false)}
                className={`block px-3 py-1.5 rounded-[3px] border text-xs font-bold ${
                  isActive(link.href)
                    ? 'border-[#B8421E] bg-white text-[#B8421E]'
                    : 'border-transparent text-stone-600 hover:border-stone-200 hover:text-stone-900'
                }`}
              >
                {link.label}
              </Link>
            ))}
          </div>

          <div className="pt-2 border-t border-stone-200">
            <button
              onClick={logout}
              className="w-full text-left px-3 py-1.5 rounded-[3px] border border-stone-200 text-xs font-medium text-rose-600 hover:bg-stone-50"
            >
              Sign out
            </button>
          </div>
        </div>
      )}
    </header>
  );
}
