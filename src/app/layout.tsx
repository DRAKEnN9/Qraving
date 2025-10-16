import type { Metadata } from 'next';
import { Inter } from 'next/font/google';
import './globals.css';
import { ThemeProvider } from '@/contexts/ThemeContext';
import { Toaster } from 'react-hot-toast';
import { CartProvider } from '@/contexts/CartContext';
import { SocketProvider } from '@/contexts/SocketContext';
import { NotificationProvider } from '@/contexts/NotificationContext';

const inter = Inter({ subsets: ['latin'] });

export const metadata: Metadata = {
  title: 'QR Menu Manager - Contactless Ordering & Digital Menus for Restaurants',
  description:
    'Turn any table into a checkout with QR menus, instant ordering & analytics. Accept UPI payments, manage orders in real-time, and grow revenue. Start your 14-day free trial.',
  keywords: 'QR menu, digital menu, restaurant ordering, contactless ordering, UPI payments, QR code menu, online ordering, restaurant management, food ordering system',
  authors: [{ name: 'QR Menu Manager' }],
  openGraph: {
    title: 'QR Menu Manager - Contactless Ordering Made Simple',
    description: 'QR menus, ordering & analytics. Fast, contactless, and easy-to-manage. Accept UPI payments and grow your restaurant revenue.',
    url: 'https://qrmenumanager.com',
    siteName: 'QR Menu Manager',
    images: [
      {
        url: '/og-image.jpg',
        width: 1200,
        height: 630,
        alt: 'QR Menu Manager Dashboard',
      },
    ],
    locale: 'en_IN',
    type: 'website',
  },
  twitter: {
    card: 'summary_large_image',
    title: 'QR Menu Manager - Contactless Restaurant Ordering',
    description: 'QR menus, UPI payments, real-time orders. Start your 14-day free trial today.',
    images: ['/og-image.jpg'],
  },
  robots: {
    index: true,
    follow: true,
    googleBot: {
      index: true,
      follow: true,
      'max-video-preview': -1,
      'max-image-preview': 'large',
      'max-snippet': -1,
    },
  },
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en">
      <head>
        <script src="https://checkout.razorpay.com/v1/checkout.js"></script>
      </head>
      <body className={inter.className}>
        <ThemeProvider>
          <SocketProvider>
            <NotificationProvider>
              <CartProvider>
                {children}
              </CartProvider>
            </NotificationProvider>
          </SocketProvider>
        </ThemeProvider>
        <Toaster
          position="top-right"
          toastOptions={{
            duration: 4000,
            style: {
              background: '#363636',
              color: '#fff',
            },
            success: {
              duration: 3000,
              iconTheme: {
                primary: '#10b981',
                secondary: '#fff',
              },
            },
            error: {
              duration: 4000,
              iconTheme: {
                primary: '#ef4444',
                secondary: '#fff',
              },
            },
          }}
        />
      </body>
    </html>
  );
}
