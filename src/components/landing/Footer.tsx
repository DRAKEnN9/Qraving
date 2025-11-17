import Link from 'next/link';
import {
  UtensilsCrossed,
  Mail,
  Phone,
  MapPin,
  Facebook,
  Twitter,
  Instagram,
  Linkedin,
} from 'lucide-react';

export default function Footer() {
  return (
    <footer className="border-t border-gray-800 bg-gray-900 text-gray-300">
      <div className="container mx-auto px-4 py-16">
        <div className="grid gap-12 md:grid-cols-4">
          {/* Brand */}
          <div>
            <Link href="/" className="mb-6 flex items-center gap-2.5">
              <div className="rounded-lg bg-gradient-to-br from-orange-500 to-red-600 p-2">
                <UtensilsCrossed className="h-7 w-7 text-white" />
              </div>
              <span className="text-xl font-black text-white">QR Menu Manager</span>
            </Link>
            <p className="mb-6 text-sm leading-relaxed text-gray-400">
              Modern contactless ordering solution for restaurants. Fast, secure, and easy to use.
            </p>
            {/* Social Links */}
            <div className="flex gap-3">
              <a
                href="#"
                className="rounded-lg bg-gray-800 p-2 transition-colors hover:bg-orange-600"
              >
                <Facebook className="h-5 w-5" />
              </a>
              <a
                href="#"
                className="rounded-lg bg-gray-800 p-2 transition-colors hover:bg-orange-600"
              >
                <Twitter className="h-5 w-5" />
              </a>
              <a
                href="#"
                className="rounded-lg bg-gray-800 p-2 transition-colors hover:bg-orange-600"
              >
                <Instagram className="h-5 w-5" />
              </a>
              <a
                href="#"
                className="rounded-lg bg-gray-800 p-2 transition-colors hover:bg-orange-600"
              >
                <Linkedin className="h-5 w-5" />
              </a>
            </div>
          </div>

          {/* Product */}
          <div>
            <h3 className="mb-6 text-lg font-bold text-white">Product</h3>
            <ul className="space-y-3 text-sm">
              <li>
                <Link href="#features" className="transition-colors hover:text-orange-400">
                  Features
                </Link>
              </li>
              <li>
                <Link href="#pricing" className="transition-colors hover:text-orange-400">
                  Pricing
                </Link>
              </li>
              <li>
                <Link href="#how-it-works" className="transition-colors hover:text-orange-400">
                  How It Works
                </Link>
              </li>
              <li>
                <Link
                  href="/signup?plan=advance&interval=yearly"
                  className="font-semibold text-orange-400 transition-colors hover:text-orange-300"
                >
                  Start Free Trial →
                </Link>
              </li>
            </ul>
          </div>

          {/* Company */}
          <div>
            <h3 className="mb-6 text-lg font-bold text-white">Company</h3>
            <ul className="space-y-3 text-sm">
              <li>
                <Link href="/about" className="transition-colors hover:text-orange-400">
                  About Us
                </Link>
              </li>
              <li>
                <Link href="/contact" className="transition-colors hover:text-orange-400">
                  Contact
                </Link>
              </li>
              <li>
                <Link href="/blog" className="transition-colors hover:text-orange-400">
                  Blog
                </Link>
              </li>
              <li>
                <Link href="/careers" className="transition-colors hover:text-orange-400">
                  Careers
                </Link>
              </li>
            </ul>
          </div>

          {/* Contact */}
          <div>
            <h3 className="mb-6 text-lg font-bold text-white">Contact</h3>
            <ul className="space-y-4 text-sm">
              <li className="flex items-start gap-3">
                <Mail className="mt-0.5 h-5 w-5 flex-shrink-0 text-orange-400" />
                <a
                  href="mailto:support@qrmenumanager.com"
                  className="transition-colors hover:text-orange-400"
                >
                  adityadiwakar202@gmail.com
                </a>
              </li>
              <li className="flex items-start gap-3">
                <Phone className="mt-0.5 h-5 w-5 flex-shrink-0 text-orange-400" />
                <a href="tel:+911234567890" className="transition-colors hover:text-orange-400">
                  +91 917 984 2239
                </a>
              </li>
              <li className="flex items-start gap-3">
                <MapPin className="mt-0.5 h-5 w-5 flex-shrink-0 text-orange-400" />
                <span>Gwalior, Madhya Pradesh, India</span>
              </li>
            </ul>
          </div>
        </div>

        {/* Bottom Bar */}
        <div className="mt-12 border-t border-gray-800 pt-8">
          <div className="flex flex-col items-center justify-between gap-4 md:flex-row">
            <div className="text-sm text-gray-400">
              <p>&copy; {new Date().getFullYear()} QR Menu Manager. All rights reserved.</p>
            </div>
            <div className="flex flex-wrap justify-center gap-6 text-sm">
              <Link href="/privacy" className="transition-colors hover:text-orange-400">
                Privacy Policy
              </Link>
              <Link href="/terms" className="transition-colors hover:text-orange-400">
                Terms of Service
              </Link>
              <Link href="/refund" className="transition-colors hover:text-orange-400">
                Refund Policy
              </Link>
            </div>
          </div>
        </div>
      </div>
    </footer>
  );
}
