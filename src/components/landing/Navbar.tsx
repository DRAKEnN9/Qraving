'use client';

import Link from 'next/link';
import { Menu, X, UtensilsCrossed } from 'lucide-react';
import { useState, useEffect } from 'react';

export default function Navbar() {
  const [isMenuOpen, setIsMenuOpen] = useState(false);
  const [scrolled, setScrolled] = useState(false);

  useEffect(() => {
    const handleScroll = () => {
      setScrolled(window.scrollY > 20);
    };
    window.addEventListener('scroll', handleScroll);
    return () => window.removeEventListener('scroll', handleScroll);
  }, []);

  const handleAnchorClick = (e: React.MouseEvent<HTMLAnchorElement>, selector: string) => {
    // Smoothly scroll to in-page anchors and account for fixed navbar using scroll-margin on sections
    if (selector.startsWith('#')) {
      e.preventDefault();
      setIsMenuOpen(false);
      const target = document.querySelector(selector) as HTMLElement | null;
      if (target) {
        target.scrollIntoView({ behavior: 'smooth', block: 'start' });
        // Focus for accessibility
        target.setAttribute('tabindex', '-1');
        target.focus({ preventScroll: true });
      }
    }
  };

  return (
    <nav
      className={`fixed left-0 right-0 top-0 z-50 transition-all duration-300 ${
        scrolled ? 'bg-white/95 shadow-lg backdrop-blur-md' : 'bg-transparent'
      }`}
    >
      <div className="container mx-auto flex items-center justify-between px-4 py-4">
        {/* Logo */}
        <Link href="/" className="animate-fadeInDown group flex items-center gap-2.5">
          <div className="relative">
            <div className="absolute inset-0 rounded-full bg-gradient-to-br from-orange-500 to-red-600 opacity-20 blur-xl transition-opacity group-hover:opacity-40"></div>
            <UtensilsCrossed
              className={`relative h-9 w-9 transition-colors ${
                scrolled ? 'text-orange-600' : 'text-white drop-shadow-lg'
              }`}
            />
          </div>
          <span
            className={`text-2xl font-bold transition-colors ${
              scrolled ? 'gradient-text' : 'text-white drop-shadow-lg'
            }`}
          >
            QR Menu Manager
          </span>
        </Link>

        {/* Desktop Navigation */}
        <div className="hidden items-center gap-8 md:flex">
          <Link
            href="#features"
            className={`font-semibold transition-all hover:scale-105 ${
              scrolled ? 'text-gray-700 hover:text-orange-600' : 'text-white hover:text-orange-200'
            }`}
            onClick={(e) => handleAnchorClick(e, '#features')}
          >
            Features
          </Link>
          <Link
            href="#how-it-works"
            className={`font-semibold transition-all hover:scale-105 ${
              scrolled ? 'text-gray-700 hover:text-orange-600' : 'text-white hover:text-orange-200'
            }`}
            onClick={(e) => handleAnchorClick(e, '#how-it-works')}
          >
            How It Works
          </Link>
          <Link
            href="#pricing"
            className={`font-semibold transition-all hover:scale-105 ${
              scrolled ? 'text-gray-700 hover:text-orange-600' : 'text-white hover:text-orange-200'
            }`}
            onClick={(e) => handleAnchorClick(e, '#pricing')}
          >
            Pricing
          </Link>
          <Link
            href="/login"
            className={`font-semibold transition-all hover:scale-105 ${
              scrolled ? 'text-gray-700 hover:text-orange-600' : 'text-white hover:text-orange-200'
            }`}
          >
            Login
          </Link>
          <Link
            href="/signup?plan=advance&interval=yearly"
            className="group relative overflow-hidden rounded-full bg-gradient-to-r from-orange-600 to-red-600 px-8 py-3 font-bold text-white shadow-xl transition-all hover:scale-105 hover:shadow-2xl"
          >
            <span className="relative z-10">Get Started Free</span>
            <div className="absolute inset-0 bg-gradient-to-r from-red-600 to-orange-600 opacity-0 transition-opacity group-hover:opacity-100"></div>
          </Link>
        </div>

        {/* Mobile Menu Button */}
        <button
          onClick={() => setIsMenuOpen(!isMenuOpen)}
          className={`rounded-lg p-2 transition-colors md:hidden ${
            scrolled ? 'text-gray-700 hover:bg-gray-100' : 'text-white hover:bg-white/20'
          }`}
          aria-label="Toggle menu"
        >
          {isMenuOpen ? <X className="h-6 w-6" /> : <Menu className="h-6 w-6" />}
        </button>
      </div>

      {/* Mobile Menu */}
      {isMenuOpen && (
        <div className="animate-fadeInDown border-t border-white/20 bg-white/95 backdrop-blur-md md:hidden">
          <div className="container mx-auto space-y-2 px-4 py-4">
            <Link
              href="#features"
              className="block rounded-lg px-4 py-3 font-semibold text-gray-700 transition-colors hover:bg-gradient-to-r hover:from-orange-50 hover:to-red-50 hover:text-orange-600"
              onClick={(e) => handleAnchorClick(e, '#features')}
            >
              Features
            </Link>
            <Link
              href="#how-it-works"
              className="block rounded-lg px-4 py-3 font-semibold text-gray-700 transition-colors hover:bg-gradient-to-r hover:from-orange-50 hover:to-red-50 hover:text-orange-600"
              onClick={(e) => handleAnchorClick(e, '#how-it-works')}
            >
              How It Works
            </Link>
            <Link
              href="#pricing"
              className="block rounded-lg px-4 py-3 font-semibold text-gray-700 transition-colors hover:bg-gradient-to-r hover:from-orange-50 hover:to-red-50 hover:text-orange-600"
              onClick={(e) => handleAnchorClick(e, '#pricing')}
            >
              Pricing
            </Link>
            <Link
              href="/login"
              className="block rounded-lg px-4 py-3 font-semibold text-gray-700 transition-colors hover:bg-gradient-to-r hover:from-orange-50 hover:to-red-50 hover:text-orange-600"
              onClick={() => setIsMenuOpen(false)}
            >
              Login
            </Link>
            <Link
              href="/signup?plan=advance&interval=yearly"
              className="block rounded-lg bg-gradient-to-r from-orange-600 to-red-600 px-4 py-3 text-center font-bold text-white shadow-lg transition-all hover:shadow-xl"
              onClick={() => setIsMenuOpen(false)}
            >
              Get Started Free
            </Link>
          </div>
        </div>
      )}
    </nav>
  );
}
