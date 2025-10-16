import { NextRequest, NextResponse } from 'next/server';
import crypto from 'crypto';
import dbConnect from '@/lib/mongodb';
import Order from '@/models/Order';
import Restaurant from '@/models/Restaurant';
import Payment from '@/models/Payment';
import { sendEmail, orderConfirmationEmail } from '@/lib/email';
import Subscription from '@/models/Subscription';

export async function POST(request: NextRequest) {
  try {
    await dbConnect();

    // Get webhook signature
    const signature = request.headers.get('x-razorpay-signature');
    if (!signature) {
      return NextResponse.json({ error: 'No signature provided' }, { status: 400 });
    }

    // Get raw body
    const body = await request.text();

    // Verify webhook signature
    const webhookSecret = process.env.RAZORPAY_WEBHOOK_SECRET!;
    const expectedSignature = crypto
      .createHmac('sha256', webhookSecret)
      .update(body)
      .digest('hex');

    if (signature !== expectedSignature) {
      console.error('Invalid webhook signature');
      return NextResponse.json({ error: 'Invalid signature' }, { status: 400 });
    }

    // Parse webhook payload
    const event = JSON.parse(body);

    console.log('Razorpay webhook received:', event.event);

    // Handle different event types
    switch (event.event) {
      case 'payment.captured':
        await handlePaymentCaptured(event.payload.payment.entity);
        break;
      
      case 'payment.failed':
        await handlePaymentFailed(event.payload.payment.entity);
        break;

      // Subscription lifecycle events
      case 'subscription.activated':
        await handleSubscriptionActivated(event.payload.subscription.entity);
        break;
      case 'subscription.charged':
        await handleSubscriptionCharged(
          event.payload.subscription?.entity,
          event.payload.payment?.entity
        );
        break;
      case 'invoice.paid':
        await handleInvoicePaid(
          event.payload.invoice?.entity,
          event.payload.payment?.entity
        );
        break;
      case 'subscription.pending':
        await handleSubscriptionPending(event.payload.subscription.entity);
        break;
      case 'subscription.halted':
        await handleSubscriptionHalted(event.payload.subscription.entity);
        break;
      case 'subscription.cancelled':
        await handleSubscriptionCancelled(event.payload.subscription.entity);
        break;

      default:
        console.log(`Unhandled event type: ${event.event}`);
    }

    return NextResponse.json({ received: true });
  } catch (error) {
    console.error('Webhook error:', error);
    return NextResponse.json(
      { error: 'Webhook handler failed' },
      { status: 500 }
    );
  }
}

async function handlePaymentCaptured(payment: any) {
  try {
    const { order_id, id: payment_id, notes } = payment;

    // Parse order data from notes
    const orderData = {
      restaurantId: notes.restaurantId,
      customerName: notes.customerName,
      customerEmail: notes.customerEmail,
      tableNumber: parseInt(notes.tableNumber),
      items: JSON.parse(notes.items),
    };

    // Calculate total
    const totalCents = orderData.items.reduce((sum: number, item: any) => {
      const itemTotal = item.priceCents * item.quantity;
      const modifiersTotal = item.modifiers.reduce((modSum: number, mod: any) => modSum + mod.priceDelta, 0) * item.quantity;
      return sum + itemTotal + modifiersTotal;
    }, 0);

    // Create order in database
    const order = await Order.create({
      restaurantId: orderData.restaurantId,
      items: orderData.items,
      totalCents,
      currency: 'INR',
      customerName: orderData.customerName,
      tableNumber: orderData.tableNumber,
      customerEmail: orderData.customerEmail,
      razorpayOrderId: order_id,
      razorpayPaymentId: payment_id,
      paymentStatus: 'succeeded',
      status: 'pending',
    });

    // Get restaurant info for email
    const restaurant = await Restaurant.findById(orderData.restaurantId);

    if (restaurant) {
      // Send confirmation email
      try {
        // Format items for email
        const formattedItems = orderData.items.map((item: any) => ({
          name: item.name,
          quantity: item.quantity,
          price: `₹${((item.priceCents * item.quantity) / 100).toFixed(2)}`,
        }));

        const emailData = orderConfirmationEmail({
          customerName: orderData.customerName,
          restaurantName: restaurant.name,
          orderNumber: String(order._id).slice(-8).toUpperCase(),
          items: formattedItems,
          total: `₹${(totalCents / 100).toFixed(2)}`,
          tableNumber: orderData.tableNumber,
        });

        await sendEmail({
          to: orderData.customerEmail,
          subject: emailData.subject,
          html: emailData.html,
          text: emailData.text,
        });
      } catch (emailError) {
        console.error('Error sending confirmation email:', emailError);
        // Don't fail the webhook if email fails
      }
    }

    console.log('Order created successfully:', String(order._id));

    // Emit real-time notification via Socket.io
    if (global.io) {
      global.io.to(`restaurant:${orderData.restaurantId}`).emit('new-order', {
        orderId: String(order._id),
        orderNumber: String(order._id).slice(-8).toUpperCase(),
        customerName: orderData.customerName,
        itemCount: orderData.items.length,
        totalCents: totalCents,
        tableNumber: orderData.tableNumber,
      });
    }
  } catch (error) {
    console.error('Error handling payment captured:', error);
    throw error;
  }
}

async function handlePaymentFailed(payment: any) {
  try {
    const { order_id, id: payment_id, invoice_id } = payment;

    console.log('Payment failed:', payment_id, 'for order:', order_id);

    // If this is a subscription payment, create failed Payment record
    if (invoice_id) {
      // Find subscription by invoice or payment ID
      const subscription = await Subscription.findOne({
        $or: [
          { razorpayPaymentId: payment_id },
          { razorpaySubscriptionId: payment.subscription_id }
        ]
      });

      if (subscription) {
        // Create failed Payment record
        await Payment.create({
          ownerId: subscription.ownerId,
          subscriptionId: subscription._id,
          razorpayPaymentId: payment_id,
          razorpayInvoiceId: invoice_id,
          amount: payment.amount,
          currency: payment.currency || 'INR',
          status: 'failed',
          method: payment.method,
          description: `Failed payment for ${subscription.plan} plan`,
          paidAt: new Date(),
        });

        // Update subscription status
        subscription.status = 'past_due';
        await subscription.save();
        
        console.log('Failed payment recorded for subscription');
      }
    }
  } catch (error) {
    console.error('Error handling payment failed:', error);
    throw error;
  }
}

// ===== Subscription Handlers =====
async function handleSubscriptionActivated(subEntity: any) {
  try {
    const id = subEntity?.id;
    if (!id) return;
    const ownerId = subEntity?.notes?.ownerId;
    const periodStart = subEntity?.current_start ? new Date(subEntity.current_start * 1000) : undefined;
    const periodEnd = subEntity?.current_end ? new Date(subEntity.current_end * 1000) : undefined;

    await Subscription.findOneAndUpdate(
      ownerId ? { ownerId } : { razorpaySubscriptionId: id },
      {
        provider: 'razorpay',
        razorpaySubscriptionId: id,
        status: 'active',
        currentPeriodStart: periodStart,
        currentPeriodEnd: periodEnd,
      },
      { upsert: false }
    );
  } catch (error) {
    console.error('Error handling subscription.activated:', error);
  }
}

async function handleSubscriptionCharged(subEntity: any, paymentEntity: any) {
  try {
    const id = subEntity?.id;
    if (!id) return;
    
    const periodStart = subEntity?.current_start ? new Date(subEntity.current_start * 1000) : undefined;
    const periodEnd = subEntity?.current_end ? new Date(subEntity.current_end * 1000) : undefined;

    // Find and update subscription
    const subscription = await Subscription.findOneAndUpdate(
      { razorpaySubscriptionId: id },
      {
        status: 'active',
        currentPeriodStart: periodStart,
        currentPeriodEnd: periodEnd,
      },
      { new: true }
    );

    if (!subscription) {
      console.error('Subscription not found:', id);
      return;
    }

    // Create Payment record for billing history
    if (paymentEntity) {
      await Payment.create({
        ownerId: subscription.ownerId,
        subscriptionId: subscription._id,
        razorpayPaymentId: paymentEntity.id,
        razorpayOrderId: paymentEntity.order_id,
        razorpayInvoiceId: paymentEntity.invoice_id,
        amount: paymentEntity.amount,
        currency: paymentEntity.currency || 'INR',
        status: 'captured',
        method: paymentEntity.method,
        description: `${subscription.plan} plan subscription payment`,
        paidAt: new Date(paymentEntity.created_at * 1000),
      });
      console.log('Payment record created for subscription charge:', paymentEntity.id);
    }
  } catch (error) {
    console.error('Error handling subscription.charged:', error);
  }
}

async function handleInvoicePaid(invoiceEntity: any, paymentEntity: any) {
  try {
    const subscriptionId = invoiceEntity?.subscription_id;
    if (!subscriptionId) return;

    // Find subscription
    const subscription = await Subscription.findOne({ razorpaySubscriptionId: subscriptionId });
    if (!subscription) {
      console.error('Subscription not found for invoice:', invoiceEntity.id);
      return;
    }

    // Create Payment record for billing history
    await Payment.create({
      ownerId: subscription.ownerId,
      subscriptionId: subscription._id,
      razorpayPaymentId: paymentEntity?.id,
      razorpayInvoiceId: invoiceEntity.id,
      amount: invoiceEntity.amount_paid,
      currency: invoiceEntity.currency || 'INR',
      status: 'captured',
      description: `Invoice for ${subscription.plan} plan`,
      invoiceUrl: invoiceEntity.short_url || invoiceEntity.invoice_pdf,
      paidAt: new Date(invoiceEntity.paid_at * 1000),
    });
    
    console.log('Payment record created for invoice:', invoiceEntity.id);
  } catch (error) {
    console.error('Error handling invoice.paid:', error);
  }
}

async function handleSubscriptionPending(subEntity: any) {
  try {
    const id = subEntity?.id;
    if (!id) return;
    await Subscription.findOneAndUpdate(
      { razorpaySubscriptionId: id },
      { status: 'pending' }
    );
  } catch (error) {
    console.error('Error handling subscription.pending:', error);
  }
}

async function handleSubscriptionHalted(subEntity: any) {
  try {
    const id = subEntity?.id;
    if (!id) return;
    await Subscription.findOneAndUpdate(
      { razorpaySubscriptionId: id },
      { status: 'halted' }
    );
  } catch (error) {
    console.error('Error handling subscription.halted:', error);
  }
}

async function handleSubscriptionCancelled(subEntity: any) {
  try {
    const id = subEntity?.id;
    if (!id) return;
    await Subscription.findOneAndUpdate(
      { razorpaySubscriptionId: id },
      { status: 'cancelled', cancelAtPeriodEnd: false }
    );
  } catch (error) {
    console.error('Error handling subscription.cancelled:', error);
  }
}
