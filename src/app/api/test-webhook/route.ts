import { NextRequest, NextResponse } from 'next/server';

export const dynamic = 'force-dynamic';

export async function POST(request: NextRequest) {
  const body = await request.text();
  const signature = request.headers.get('x-razorpay-signature');
  
  console.log('🧪 Test webhook received:', {
    timestamp: new Date().toISOString(),
    signature: signature ? 'present' : 'missing',
    bodyLength: body.length,
    body: body.substring(0, 200) + (body.length > 200 ? '...' : '')
  });
  
  return NextResponse.json({ received: true, timestamp: new Date().toISOString() });
}

export async function GET() {
  return NextResponse.json({ 
    message: 'Test webhook endpoint is working',
    timestamp: new Date().toISOString()
  });
}
