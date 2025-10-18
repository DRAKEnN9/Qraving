import { NextRequest, NextResponse } from 'next/server';
import crypto from 'crypto';
import dbConnect from '@/lib/mongodb';
import Order from '@/models/Order';
import Restaurant from '@/models/Restaurant';
// Note: Order placement emails are disabled. Email will be sent only when status changes to 'preparing'.

export async function POST(request: NextRequest) {
  console.log('=== Create Order API Called ===');
  
  try {
    await dbConnect();

    const body = await request.json();
    console.log('Order creation request:', {
      razorpayOrderId: body.razorpayOrderId,
      razorpayPaymentId: body.razorpayPaymentId,
      restaurantId: body.restaurantId,
      customerName: body.customerName,
      itemCount: body.items?.length,
    });

    const {
      razorpayOrderId,
      razorpayPaymentId,
      razorpaySignature,
      restaurantId,
      customerName,
      customerEmail,
      customerPhone,
      tableNumber,
      notes,
      paymentMethod = 'upi',
      paymentStatus = 'pending',
      items,
    } = body;

    // Only verify Razorpay signature if it's a Razorpay payment
    if (paymentMethod === 'card' && razorpayPaymentId) {
      console.log('Verifying Razorpay payment signature...');
      const generatedSignature = crypto
        .createHmac('sha256', process.env.RAZORPAY_KEY_SECRET!)
        .update(`${razorpayOrderId}|${razorpayPaymentId}`)
        .digest('hex');

      if (generatedSignature !== razorpaySignature) {
        console.error('❌ Invalid payment signature');
        return NextResponse.json(
          { error: 'Invalid payment signature' },
          { status: 400 }
        );
      }
      console.log('✅ Payment signature verified');
    } else {
      console.log('💳 UPI payment - no signature verification needed');
    }

    // Calculate total
    const totalCents = items.reduce((sum: number, item: any) => {
      const itemTotal = item.priceCents * item.quantity;
      const modifiersTotal = (item.modifiers || []).reduce(
        (modSum: number, mod: any) => modSum + (mod.priceDelta || 0),
        0
      ) * item.quantity;
      return sum + itemTotal + modifiersTotal;
    }, 0);

    console.log('Creating order in database...');
    console.log('Total amount:', totalCents, 'paise (₹' + (totalCents / 100) + ')');

    // Fetch restaurant to determine currency
    const restaurantDoc = await Restaurant.findById(restaurantId).lean();
    const orderCurrency = (restaurantDoc as any)?.settings?.currency || 'INR';

    // Create order in database - only include email/phone if provided
    const orderData: any = {
      restaurantId,
      items,
      totalCents,
      currency: orderCurrency,
      customerName,
      tableNumber,
      notes: notes || undefined,
      razorpayOrderId: razorpayOrderId || undefined,
      razorpayPaymentId: razorpayPaymentId || undefined,
      razorpaySignature: razorpaySignature || undefined,
      paymentMethod: paymentMethod,
      paymentStatus: paymentStatus,
      status: 'pending',
    };

    // Only add email/phone if they exist and are not empty
    if (customerEmail && customerEmail.trim()) {
      orderData.customerEmail = customerEmail;
    }
    if (customerPhone && customerPhone.trim()) {
      orderData.customerPhone = customerPhone;
    }

    const order = await Order.create(orderData);

    console.log('✅ Order created:', String(order._id));

    // Email on order creation intentionally disabled. We notify customers when the restaurant starts preparing.

    // Emit real-time notification via Socket.io
    if (global.io) {
      console.log('Emitting Socket.io notification...');
      global.io.to(`restaurant:${restaurantId}`).emit('new-order', {
        orderId: String(order._id),
        orderNumber: String(order._id).slice(-8).toUpperCase(),
        customerName,
        itemCount: items.length,
        totalCents,
        tableNumber,
      });
      console.log('✅ Socket.io notification sent');
    }

    console.log('=== Order creation complete ===');

    return NextResponse.json({
      success: true,
      orderId: String(order._id),
      orderNumber: String(order._id).slice(-8).toUpperCase(),
      message: 'Order created successfully',
    });
  } catch (error: any) {
    console.error('❌ Create order error:', error);
    console.error('Error message:', error.message);
    console.error('Error stack:', error.stack);
    
    return NextResponse.json(
      { 
        error: error.message || 'Failed to create order',
        details: error.toString(),
      },
      { status: 500 }
    );
  }
}
