import Link from 'next/link';
import { QrCode, ShoppingCart, BarChart3, Clock } from 'lucide-react';
import { Button } from '@/components/ui/Button';

export default function HomePage() {
  return (
    <div className="min-h-screen bg-gradient-to-br from-indigo-50 via-white to-purple-50">
      {/* Header */}
      <header className="border-b border-gray-200 bg-white/80 backdrop-blur-sm">
        <div className="container mx-auto flex items-center justify-between px-4 py-4">
          <div className="flex items-center space-x-2">
            <QrCode className="h-8 w-8 text-indigo-600" />
            <span className="text-2xl font-bold text-gray-900">QR Menu Manager</span>
          </div>
          <div className="flex space-x-3">
            <Link href="/login">
              <Button variant="outline" size="sm">
                Login
              </Button>
            </Link>
            <Link href="/signup">
              <Button size="sm">Get Started</Button>
            </Link>
          </div>
        </div>
      </header>

      {/* Hero Section */}
      <section className="container mx-auto px-4 py-20 text-center">
        <h1 className="mb-6 text-5xl font-bold text-gray-900 md:text-6xl">
          Digital Menus Made{' '}
          <span className="bg-gradient-to-r from-indigo-600 to-purple-600 bg-clip-text text-transparent">
            Simple
          </span>
        </h1>
        <p className="mx-auto mb-8 max-w-2xl text-xl text-gray-600">
          Create QR code menus, manage orders in real-time, and accept payments seamlessly.
        </p>
        <div className="flex justify-center space-x-4">
          <Link href="/signup">
            <Button size="lg">Start Free Trial</Button>
          </Link>
          <Link href="/menu/demo-restaurant">
            <Button variant="outline" size="lg">
              View Demo
            </Button>
          </Link>
        </div>
      </section>

      {/* Features */}
      <section className="bg-white py-20">
        <div className="container mx-auto px-4">
          <h2 className="mb-12 text-center text-3xl font-bold">Everything You Need</h2>
          <div className="grid gap-8 md:grid-cols-4">
            <div className="rounded-lg border p-6">
              <QrCode className="mb-4 h-12 w-12 text-indigo-600" />
              <h3 className="mb-2 text-xl font-semibold">QR Code Menus</h3>
              <p className="text-gray-600">Generate unique QR codes for each restaurant.</p>
            </div>
            <div className="rounded-lg border p-6">
              <ShoppingCart className="mb-4 h-12 w-12 text-indigo-600" />
              <h3 className="mb-2 text-xl font-semibold">Online Ordering</h3>
              <p className="text-gray-600">Accept orders via Razorpay or UPI payments.</p>
            </div>
            <div className="rounded-lg border p-6">
              <Clock className="mb-4 h-12 w-12 text-indigo-600" />
              <h3 className="mb-2 text-xl font-semibold">Real-Time Updates</h3>
              <p className="text-gray-600">See new orders instantly.</p>
            </div>
            <div className="rounded-lg border p-6">
              <BarChart3 className="mb-4 h-12 w-12 text-indigo-600" />
              <h3 className="mb-2 text-xl font-semibold">Analytics</h3>
              <p className="text-gray-600">Track orders, revenue, and popular items.</p>
            </div>
          </div>
        </div>
      </section>

      {/* Footer */}
      <footer className="border-t bg-white py-12">
        <div className="container mx-auto px-4 text-center text-gray-600">
          <p>&copy; 2025 QR Menu Manager. Built with ❤️ for modern restaurants</p>
        </div>
      </footer>
    </div>
  );
}
