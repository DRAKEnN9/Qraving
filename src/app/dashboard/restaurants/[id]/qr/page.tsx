'use client';

import { useEffect, useState } from 'react';
import { useParams, useRouter } from 'next/navigation';
import Link from 'next/link';
import { ArrowLeft, Download, Share2, Copy, ExternalLink, QrCode, Smartphone, Printer } from 'lucide-react';

interface Restaurant {
  _id: string;
  name: string;
  slug: string;
  address: string;
  logoUrl?: string;
  qrCodeUrl?: string;
}

export default function QRCodePage() {
  const params = useParams();
  const router = useRouter();
  const restaurantId = params?.id as string;
  
  const [restaurant, setRestaurant] = useState<Restaurant | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [copied, setCopied] = useState(false);

  const menuUrl = restaurant ? `${window.location.origin}/menu/${restaurant.slug}` : '';

  useEffect(() => {
    if (!restaurantId) return;

    const token = localStorage.getItem('token');
    if (!token) {
      router.push('/login');
      return;
    }

    fetch('/api/owner/restaurant', {
      headers: {
        Authorization: `Bearer ${token}`,
      },
    })
      .then((res) => {
        if (!res.ok) throw new Error('Failed to fetch restaurant');
        return res.json();
      })
      .then((data) => {
        const found = data.restaurants?.find((r: Restaurant) => r._id === restaurantId);
        if (!found) throw new Error('Restaurant not found');
        setRestaurant(found);
        setLoading(false);
      })
      .catch((err) => {
        setError(err.message);
        setLoading(false);
      });
  }, [restaurantId, router]);

  const copyToClipboard = async (text: string) => {
    try {
      await navigator.clipboard.writeText(text);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    } catch (err) {
      console.error('Failed to copy:', err);
    }
  };

  const downloadQRCode = () => {
    if (!restaurant?.qrCodeUrl) return;

    const link = document.createElement('a');
    link.href = restaurant.qrCodeUrl;
    link.download = `${restaurant.slug}-qr-code.png`;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  const printQRCode = () => {
    if (!restaurant?.qrCodeUrl) return;

    const printWindow = window.open('', '_blank');
    if (!printWindow) return;

    printWindow.document.write(`
      <!DOCTYPE html>
      <html>
        <head>
          <title>${restaurant.name} - QR Code</title>
          <style>
            body {
              font-family: Arial, sans-serif;
              text-align: center;
              padding: 40px;
              margin: 0;
            }
            .qr-container {
              max-width: 400px;
              margin: 0 auto;
            }
            .qr-code {
              width: 300px;
              height: 300px;
              margin: 20px auto;
              border: 2px solid #e5e7eb;
              border-radius: 12px;
            }
            .restaurant-name {
              font-size: 24px;
              font-weight: bold;
              margin-bottom: 8px;
              color: #111827;
            }
            .menu-text {
              font-size: 16px;
              color: #6b7280;
              margin-bottom: 20px;
            }
            .url {
              font-size: 12px;
              color: #9ca3af;
              word-break: break-all;
            }
            @media print {
              body { padding: 20px; }
            }
          </style>
        </head>
        <body>
          <div class="qr-container">
            <div class="restaurant-name">${restaurant.name}</div>
            <div class="menu-text">Scan to view our digital menu</div>
            <img src="${restaurant.qrCodeUrl}" alt="QR Code" class="qr-code" />
            <div class="url">${menuUrl}</div>
          </div>
        </body>
      </html>
    `);
    
    printWindow.document.close();
    printWindow.focus();
    printWindow.print();
    printWindow.close();
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50">
        <div className="container mx-auto px-4 py-8">
          <div className="mx-auto max-w-2xl">
            <div className="h-8 w-48 animate-pulse rounded bg-gray-200 mb-8"></div>
            <div className="rounded-xl bg-white p-8 shadow-sm">
              <div className="h-64 w-64 mx-auto animate-pulse rounded bg-gray-200"></div>
            </div>
          </div>
        </div>
      </div>
    );
  }

  if (error || !restaurant) {
    return (
      <div className="min-h-screen bg-gray-50">
        <div className="container mx-auto px-4 py-8">
          <div className="mx-auto max-w-2xl text-center">
            <div className="mb-4 text-6xl">😕</div>
            <h1 className="mb-2 text-2xl font-bold text-gray-900">Restaurant Not Found</h1>
            <p className="text-gray-600">{error}</p>
            <Link
              href="/dashboard/restaurants"
              className="mt-4 inline-flex items-center gap-2 text-indigo-600 hover:text-indigo-700"
            >
              <ArrowLeft className="h-4 w-4" />
              Back to Restaurants
            </Link>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <div className="border-b bg-white">
        <div className="container mx-auto px-4 py-6">
          <div className="flex items-center gap-4">
            <Link
              href="/dashboard/restaurants"
              className="flex items-center gap-2 text-gray-600 transition-colors hover:text-gray-900"
            >
              <ArrowLeft className="h-5 w-5" />
              Back to Restaurants
            </Link>
            <div className="h-6 w-px bg-gray-300"></div>
            <div>
              <h1 className="text-2xl font-bold text-gray-900">{restaurant.name}</h1>
              <p className="text-gray-600">QR Code & Menu Link</p>
            </div>
          </div>
        </div>
      </div>

      {/* Content */}
      <div className="container mx-auto px-4 py-8">
        <div className="mx-auto max-w-4xl">
          <div className="grid gap-8 lg:grid-cols-2">
            {/* QR Code Display */}
            <div className="rounded-xl bg-white p-8 shadow-sm">
              <div className="text-center">
                <div className="mb-6">
                  <div className="flex items-center justify-center gap-2 mb-2">
                    <QrCode className="h-6 w-6 text-indigo-600" />
                    <h2 className="text-xl font-semibold text-gray-900">Your QR Code</h2>
                  </div>
                  <p className="text-gray-600">Customers scan this to access your menu</p>
                </div>

                {restaurant.qrCodeUrl ? (
                  <div className="mb-6">
                    <div className="inline-block rounded-2xl bg-white p-6 shadow-lg ring-1 ring-gray-200">
                      <img
                        src={restaurant.qrCodeUrl}
                        alt={`QR Code for ${restaurant.name}`}
                        className="h-64 w-64 rounded-lg"
                      />
                    </div>
                    <p className="mt-4 text-sm text-gray-500">
                      High-resolution QR code ready for printing
                    </p>
                  </div>
                ) : (
                  <div className="mb-6">
                    <div className="flex h-64 w-64 mx-auto items-center justify-center rounded-2xl bg-gray-100 ring-1 ring-gray-200">
                      <div className="text-center">
                        <QrCode className="h-16 w-16 mx-auto text-gray-400 mb-2" />
                        <p className="text-gray-500">QR Code not generated</p>
                      </div>
                    </div>
                  </div>
                )}

                {/* Action Buttons */}
                <div className="flex flex-col gap-3">
                  <button
                    onClick={downloadQRCode}
                    disabled={!restaurant.qrCodeUrl}
                    className="flex items-center justify-center gap-2 rounded-lg bg-indigo-600 px-4 py-3 font-medium text-white transition-colors hover:bg-indigo-700 disabled:opacity-50"
                  >
                    <Download className="h-4 w-4" />
                    Download QR Code
                  </button>
                  
                  <div className="grid grid-cols-2 gap-3">
                    <button
                      onClick={printQRCode}
                      disabled={!restaurant.qrCodeUrl}
                      className="flex items-center justify-center gap-2 rounded-lg border border-gray-300 px-4 py-2 font-medium text-gray-700 transition-colors hover:bg-gray-50 disabled:opacity-50"
                    >
                      <Printer className="h-4 w-4" />
                      Print
                    </button>
                    
                    <Link
                      href={`/menu/${restaurant.slug}`}
                      target="_blank"
                      className="flex items-center justify-center gap-2 rounded-lg border border-gray-300 px-4 py-2 font-medium text-gray-700 transition-colors hover:bg-gray-50"
                    >
                      <ExternalLink className="h-4 w-4" />
                      Preview
                    </Link>
                  </div>
                </div>
              </div>
            </div>

            {/* Menu Link & Instructions */}
            <div className="space-y-6">
              {/* Menu URL */}
              <div className="rounded-xl bg-white p-6 shadow-sm">
                <h3 className="mb-4 flex items-center gap-2 text-lg font-semibold">
                  <Share2 className="h-5 w-5 text-indigo-600" />
                  Menu Link
                </h3>
                
                <div className="mb-4">
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Direct URL to your menu
                  </label>
                  <div className="flex rounded-lg border border-gray-300">
                    <input
                      type="text"
                      value={menuUrl}
                      readOnly
                      className="flex-1 rounded-l-lg border-0 px-3 py-2 text-sm bg-gray-50"
                    />
                    <button
                      onClick={() => copyToClipboard(menuUrl)}
                      className="rounded-r-lg bg-indigo-600 px-4 py-2 text-white transition-colors hover:bg-indigo-700"
                    >
                      {copied ? (
                        <span className="text-xs">Copied!</span>
                      ) : (
                        <Copy className="h-4 w-4" />
                      )}
                    </button>
                  </div>
                </div>
              </div>

              {/* Usage Instructions */}
              <div className="rounded-xl bg-white p-6 shadow-sm">
                <h3 className="mb-4 flex items-center gap-2 text-lg font-semibold">
                  <Smartphone className="h-5 w-5 text-indigo-600" />
                  How to Use
                </h3>
                
                <div className="space-y-4">
                  <div className="flex gap-3">
                    <div className="flex h-6 w-6 items-center justify-center rounded-full bg-indigo-100 text-xs font-semibold text-indigo-600">
                      1
                    </div>
                    <div>
                      <p className="font-medium text-gray-900">Print & Display</p>
                      <p className="text-sm text-gray-600">
                        Print the QR code and place it on tables, at the entrance, or on marketing materials.
                      </p>
                    </div>
                  </div>
                  
                  <div className="flex gap-3">
                    <div className="flex h-6 w-6 items-center justify-center rounded-full bg-indigo-100 text-xs font-semibold text-indigo-600">
                      2
                    </div>
                    <div>
                      <p className="font-medium text-gray-900">Customer Scans</p>
                      <p className="text-sm text-gray-600">
                        Customers use their phone camera to scan the QR code and access your menu instantly.
                      </p>
                    </div>
                  </div>
                  
                  <div className="flex gap-3">
                    <div className="flex h-6 w-6 items-center justify-center rounded-full bg-indigo-100 text-xs font-semibold text-indigo-600">
                      3
                    </div>
                    <div>
                      <p className="font-medium text-gray-900">Start Receiving Orders</p>
                      <p className="text-sm text-gray-600">
                        Orders come directly to your dashboard with real-time notifications.
                      </p>
                    </div>
                  </div>
                </div>
              </div>

              {/* Tips */}
              <div className="rounded-xl bg-blue-50 p-6">
                <h4 className="mb-3 font-semibold text-blue-900">💡 Pro Tips</h4>
                <ul className="space-y-2 text-sm text-blue-800">
                  <li>• Place QR codes at eye level for easy scanning</li>
                  <li>• Include a brief instruction like "Scan to view menu"</li>
                  <li>• Test the QR code regularly to ensure it works</li>
                  <li>• Consider adding your restaurant logo above the QR code</li>
                </ul>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
