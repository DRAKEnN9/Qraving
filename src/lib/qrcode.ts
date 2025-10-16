import QRCode from 'qrcode';

/**
 * Generate QR code as Data URL
 */
export async function generateQRCode(url: string): Promise<string> {
  try {
    const qrCodeDataUrl = await QRCode.toDataURL(url, {
      errorCorrectionLevel: 'M',
      type: 'image/png',
      width: 512,
      margin: 2,
      color: {
        dark: '#000000',
        light: '#FFFFFF',
      },
    });
    return qrCodeDataUrl;
  } catch (error) {
    console.error('Error generating QR code:', error);
    throw error;
  }
}

/**
 * Generate QR code as buffer
 */
export async function generateQRCodeBuffer(url: string): Promise<Buffer> {
  try {
    const buffer = await QRCode.toBuffer(url, {
      errorCorrectionLevel: 'M',
      type: 'png',
      width: 512,
      margin: 2,
    });
    return buffer;
  } catch (error) {
    console.error('Error generating QR code buffer:', error);
    throw error;
  }
}
