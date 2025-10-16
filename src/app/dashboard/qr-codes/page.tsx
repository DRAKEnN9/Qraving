'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import {
  QrCode,
  Download,
  Printer,
  Share2,
  Copy,
  Eye,
  RefreshCw,
  ExternalLink,
  Clock,
  CheckCircle,
  AlertCircle,
} from 'lucide-react';
import QRCodeLib from 'qrcode';

interface Restaurant {
  _id: string;
  name: string;
  slug: string;
  description?: string;
  address?: string;
  phone?: string;
  lastScanned?: string;
}

export default function QRCodesPage() {
  const router = useRouter();
  const [loading, setLoading] = useState(true);
  const [restaurants, setRestaurants] = useState<Restaurant[]>([]);
  const [copiedId, setCopiedId] = useState<string | null>(null);
  const [qrPreview, setQrPreview] = useState<Record<string, string>>({});

  useEffect(() => {
    const token = localStorage.getItem('token');
    if (!token) {
      router.push('/login');
      return;
    }

    fetchRestaurants();
  }, [router]);

  const fetchRestaurants = async () => {
    try {
      const token = localStorage.getItem('token');
      const response = await fetch('/api/owner/restaurant', {
        headers: { Authorization: `Bearer ${token}` },
      });

      if (!response.ok) throw new Error('Failed to fetch restaurants');

      const data = await response.json();
      setRestaurants(data.restaurants || []);
      setLoading(false);
    } catch (err) {
      console.error('Failed to fetch restaurants:', err);
      setLoading(false);
    }
  };

  const getMenuUrl = (slug: string) => {
    return `${window.location.origin}/menu/${slug}`;
  };

  // Generate in-page QR previews for each restaurant
  useEffect(() => {
    if (!restaurants.length) return;
    let cancelled = false;
    (async () => {
      try {
        const entries = await Promise.all(
          restaurants.map(async (r) => {
            const url = getMenuUrl(r.slug);
            try {
              const dataUrl = await QRCodeLib.toDataURL(url, {
                width: 512,
                margin: 1,
                color: { dark: '#059669', light: '#ffffff' },
              });
              return [r._id, dataUrl] as const;
            } catch {
              return [r._id, ''] as const;
            }
          })
        );
        if (!cancelled) {
          const map: Record<string, string> = {};
          entries.forEach(([id, data]) => {
            if (data) map[id] = data;
          });
          setQrPreview(map);
        }
      } catch (e) {
        // ignore preview errors
      }
    })();
    return () => {
      cancelled = true;
    };
  }, [restaurants]);

  const downloadQRCode = async (restaurant: Restaurant, format: 'png' | 'svg' = 'png') => {
    const url = getMenuUrl(restaurant.slug);
    
    try {
      // Generate QR code as data URL
      const qrDataUrl = await QRCodeLib.toDataURL(url, {
        width: 1000,
        margin: 2,
        color: {
          dark: '#059669',
          light: '#ffffff',
        },
      });

      // Create download link
      const link = document.createElement('a');
      link.href = qrDataUrl;
      link.download = `${restaurant.slug}-qr.png`;
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
    } catch (err) {
      console.error('Failed to generate QR code:', err);
    }
  };

  const copyToClipboard = (text: string, id: string) => {
    navigator.clipboard.writeText(text);
    setCopiedId(id);
    setTimeout(() => setCopiedId(null), 2000);
  };

  const printQRCode = (restaurant: Restaurant) => {
    const url = getMenuUrl(restaurant.slug);
    const printWindow = window.open('', '_blank');
    
    if (printWindow) {
      printWindow.document.write(`
        <!DOCTYPE html>
        <html>
          <head>
            <title>QR Code - ${restaurant.name}</title>
            <style>
              @page { size: A4; margin: 2cm; }
              body { 
                font-family: Arial, sans-serif; 
                display: flex; 
                flex-direction: column; 
                align-items: center; 
                justify-content: center;
                min-height: 100vh;
                margin: 0;
              }
              .qr-container { text-align: center; }
              h1 { font-size: 32px; margin-bottom: 20px; color: #1f2937; }
              p { font-size: 18px; color: #6b7280; margin-bottom: 30px; }
              #qrcode { margin: 20px auto; }
              .instructions { 
                margin-top: 30px; 
                font-size: 16px; 
                color: #374151;
                max-width: 500px;
                text-align: center;
              }
            </style>
            <script src="https://cdn.rawgit.com/davidshimjs/qrcodejs/gh-pages/qrcode.min.js"></script>
          </head>
          <body>
            <div class="qr-container">
              <h1>${restaurant.name}</h1>
              <p>Scan to view menu</p>
              <div id="qrcode"></div>
              <div class="instructions">
                <strong>How to use:</strong><br>
                1. Open your camera app<br>
                2. Point it at this QR code<br>
                3. Tap the notification to view the menu
              </div>
            </div>
            <script>
              new QRCode(document.getElementById("qrcode"), {
                text: "${url}",
                width: 400,
                height: 400,
                colorDark: "#059669",
                colorLight: "#ffffff",
              });
              setTimeout(() => window.print(), 500);
            </script>
          </body>
        </html>
      `);
      printWindow.document.close();
    }
  };

  if (loading) {
    return (
      <div className="flex min-h-screen items-center justify-center">
        <div className="text-center">
          <QrCode className="mx-auto h-12 w-12 animate-pulse text-emerald-600" />
          <p className="mt-4 text-gray-600">Loading QR codes...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="px-6 py-8">
      {/* Header */}
      <div className="mb-8">
        <h1 className="text-3xl font-bold text-slate-900 dark:text-slate-100">QR Codes</h1>
        <p className="mt-2 text-slate-600 dark:text-slate-400">
          Download and print QR codes for your restaurants
        </p>
      </div>

      {/* QR Code Cards Grid */}
      {restaurants.length === 0 ? (
        <div className="flex flex-col items-center justify-center py-16">
          <div className="mb-6 rounded-full bg-emerald-100 p-6">
            <QrCode className="h-16 w-16 text-emerald-600" />
          </div>
          <h2 className="mb-2 text-2xl font-semibold text-slate-900">No Restaurants Yet</h2>
          <p className="mb-8 max-w-md text-center text-slate-600">
            Create a restaurant first to generate QR codes for your menus
          </p>
          <Link
            href="/dashboard/restaurants/new"
            className="rounded-lg bg-emerald-600 px-6 py-3 font-medium text-white transition-colors hover:bg-emerald-700"
          >
            Create Restaurant
          </Link>
        </div>
      ) : (
        <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
          {restaurants.map((restaurant) => {
            const menuUrl = getMenuUrl(restaurant.slug);
            
            return (
              <div
                key={restaurant._id}
                className="group rounded-xl border border-slate-200 bg-white p-6 shadow-sm transition-all hover:shadow-lg dark:border-slate-800 dark:bg-slate-900"
              >
                {/* Restaurant Info */}
                <div className="mb-4">
                  <h3 className="text-xl font-bold text-slate-900 dark:text-slate-100">{restaurant.name}</h3>
                  {restaurant.description && (
                    <p className="mt-1 text-sm text-slate-600 dark:text-slate-400">{restaurant.description}</p>
                  )}
                </div>

                {/* QR Code Preview */}
                <div className="mb-4 flex justify-center rounded-lg bg-slate-50 p-6 dark:bg-slate-800">
                  <div className="h-48 w-48 rounded-lg bg-white p-4 shadow-md dark:bg-slate-900 dark:border dark:border-slate-800">
                    <div className="flex h-full w-full items-center justify-center">
                      {qrPreview[restaurant._id] ? (
                        <img
                          src={qrPreview[restaurant._id]}
                          alt={`${restaurant.name} QR`}
                          className="h-40 w-40 object-contain"
                        />
                      ) : (
                        <QrCode className="h-32 w-32 text-emerald-600 animate-pulse" />
                      )}
                    </div>
                  </div>
                </div>

                {/* Stats */}
                <div className="mb-4 flex items-center justify-between rounded-lg bg-slate-50 px-4 py-3 dark:bg-slate-800">
                  <div className="flex items-center gap-2 text-sm text-slate-600 dark:text-slate-400">
                    <Clock className="h-4 w-4" />
                    <span>
                      {restaurant.lastScanned
                        ? `Scanned ${new Date(restaurant.lastScanned).toLocaleDateString()}`
                        : 'Never scanned'}
                    </span>
                  </div>
                  <div className="flex items-center gap-1">
                    <CheckCircle className="h-4 w-4 text-green-600" />
                    <span className="text-sm font-medium text-green-600">Active</span>
                  </div>
                </div>

                {/* URL Display */}
                <div className="mb-4 flex items-center gap-2 rounded-lg border border-slate-200 bg-slate-50 px-3 py-2 dark:border-slate-800 dark:bg-slate-800">
                  <ExternalLink className="h-4 w-4 flex-shrink-0 text-slate-400" />
                  <input
                    type="text"
                    value={menuUrl}
                    readOnly
                    className="flex-1 bg-transparent text-sm text-slate-600 outline-none dark:text-slate-300"
                  />
                  <button
                    onClick={() => copyToClipboard(menuUrl, restaurant._id)}
                    className="rounded p-1 text-slate-400 hover:bg-slate-200 hover:text-slate-600 dark:hover:bg-slate-700 dark:text-slate-400 dark:hover:text-slate-200"
                    title="Copy URL"
                  >
                    {copiedId === restaurant._id ? (
                      <CheckCircle className="h-4 w-4 text-green-600" />
                    ) : (
                      <Copy className="h-4 w-4" />
                    )}
                  </button>
                </div>

                {/* Action Buttons */}
                <div className="grid grid-cols-2 gap-2">
                  <button
                    onClick={() => downloadQRCode(restaurant, 'png')}
                    className="flex items-center justify-center gap-2 rounded-lg bg-emerald-600 px-4 py-2 text-sm font-medium text-white transition-colors hover:bg-emerald-700"
                  >
                    <Download className="h-4 w-4" />
                    Download
                  </button>
                  <button
                    onClick={() => printQRCode(restaurant)}
                    className="flex items-center justify-center gap-2 rounded-lg border border-slate-300 bg-white px-4 py-2 text-sm font-medium text-slate-700 transition-colors hover:bg-slate-50 dark:border-slate-700 dark:bg-slate-800 dark:text-slate-200 dark:hover:bg-slate-700"
                  >
                    <Printer className="h-4 w-4" />
                    Print
                  </button>
                </div>

                {/* Additional Actions */}
                <div className="mt-3 flex gap-2">
                  <button
                    onClick={() => window.open(menuUrl, '_blank')}
                    className="flex flex-1 items-center justify-center gap-2 rounded-lg border border-slate-300 bg-white px-3 py-2 text-sm font-medium text-slate-700 transition-colors hover:bg-slate-50 dark:border-slate-700 dark:bg-slate-800 dark:text-slate-200 dark:hover:bg-slate-700"
                  >
                    <Eye className="h-4 w-4" />
                    Preview
                  </button>
                  <button
                    onClick={() => copyToClipboard(menuUrl, `share-${restaurant._id}`)}
                    className="flex flex-1 items-center justify-center gap-2 rounded-lg border border-slate-300 bg-white px-3 py-2 text-sm font-medium text-slate-700 transition-colors hover:bg-slate-50 dark:border-slate-700 dark:bg-slate-800 dark:text-slate-200 dark:hover:bg-slate-700"
                  >
                    {copiedId === `share-${restaurant._id}` ? (
                      <>
                        <CheckCircle className="h-4 w-4 text-green-600" />
                        <span className="text-green-600">Copied!</span>
                      </>
                    ) : (
                      <>
                        <Share2 className="h-4 w-4" />
                        Share
                      </>
                    )}
                  </button>
                </div>
              </div>
            );
          })}
        </div>
      )}

      {/* Help Section */}
      <div className="mt-12 rounded-xl border border-blue-200 bg-blue-50 p-6 dark:border-blue-900/30 dark:bg-blue-900/20">
        <div className="flex items-start gap-4">
          <div className="rounded-lg bg-blue-100 p-3 dark:bg-blue-800/50">
            <AlertCircle className="h-6 w-6 text-blue-600" />
          </div>
          <div className="flex-1">
            <h3 className="mb-2 text-lg font-semibold text-blue-900 dark:text-blue-200">How to use QR Codes</h3>
            <ul className="space-y-2 text-sm text-blue-800 dark:text-blue-200/80">
              <li className="flex items-start gap-2">
                <span className="mt-1 h-1.5 w-1.5 flex-shrink-0 rounded-full bg-blue-600"></span>
                <span>
                  <strong>Download:</strong> Get the QR code as a PNG image to use in your materials
                </span>
              </li>
              <li className="flex items-start gap-2">
                <span className="mt-1 h-1.5 w-1.5 flex-shrink-0 rounded-full bg-blue-600"></span>
                <span>
                  <strong>Print:</strong> Print table tents, posters, or stickers with the QR code
                </span>
              </li>
              <li className="flex items-start gap-2">
                <span className="mt-1 h-1.5 w-1.5 flex-shrink-0 rounded-full bg-blue-600"></span>
                <span>
                  <strong>Share:</strong> Copy the link to share via WhatsApp, email, or social media
                </span>
              </li>
              <li className="flex items-start gap-2">
                <span className="mt-1 h-1.5 w-1.5 flex-shrink-0 rounded-full bg-blue-600"></span>
                <span>
                  <strong>Preview:</strong> Test how your menu looks before sharing with customers
                </span>
              </li>
            </ul>
          </div>
        </div>
      </div>
    </div>
  );
}
