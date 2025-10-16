import nodemailer from 'nodemailer';
import sgMail from '@sendgrid/mail';

// Validate SendGrid API key format (should start with 'SG.')
const SENDGRID_KEY = process.env.SENDGRID_API_KEY;
const USE_SENDGRID = SENDGRID_KEY && SENDGRID_KEY.startsWith('SG.');
const EMAIL_FROM = process.env.EMAIL_FROM || 'noreply@qrmenumanager.com';

// Initialize SendGrid if valid API key is available
if (USE_SENDGRID) {
  sgMail.setApiKey(SENDGRID_KEY!);
}

// Initialize Nodemailer transporter for Gmail
const nodemailerTransporter = nodemailer.createTransport({
  service: 'gmail',
  auth: {
    user: process.env.GMAIL_USER,
    pass: process.env.GMAIL_APP_PASSWORD,
  },
});

export interface EmailOptions {
  to: string;
  subject: string;
  html: string;
  text?: string;
}

/**
 * Send email using SendGrid or Nodemailer
 */
export async function sendEmail(options: EmailOptions): Promise<void> {
  try {
    if (USE_SENDGRID) {
      await sgMail.send({
        to: options.to,
        from: EMAIL_FROM,
        subject: options.subject,
        html: options.html,
        text: options.text,
      });
    } else if (process.env.GMAIL_USER && process.env.GMAIL_APP_PASSWORD) {
      await nodemailerTransporter.sendMail({
        from: EMAIL_FROM,
        to: options.to,
        subject: options.subject,
        html: options.html,
        text: options.text,
      });
    } else {
      console.log('Email service not configured. Email content:', options);
      // In development, just log the email
      if (process.env.NODE_ENV === 'development') {
        console.log('DEV MODE: Email would be sent:', options);
      }
    }
  } catch (error) {
    console.error('Error sending email:', error);
    throw error;
  }
}

/**
 * Email template for order confirmation
 */
export function orderConfirmationEmail(params: {
  customerName: string;
  restaurantName: string;
  orderNumber: string;
  items: Array<{ name: string; quantity: number; price: string }>;
  total: string;
  tableNumber: number;
}) {
  const itemsHtml = params.items
    .map(
      (item) =>
        `<tr>
          <td style="padding: 8px; border-bottom: 1px solid #eee;">${item.name}</td>
          <td style="padding: 8px; border-bottom: 1px solid #eee;">${item.quantity}</td>
          <td style="padding: 8px; border-bottom: 1px solid #eee;">${item.price}</td>
        </tr>`
    )
    .join('');

  return {
    subject: `Order Confirmation - ${params.restaurantName}`,
    html: `
      <!DOCTYPE html>
      <html>
      <head>
        <meta charset="utf-8">
        <meta name="viewport" content="width=device-width, initial-scale=1.0">
        <title>Order Confirmation</title>
      </head>
      <body style="font-family: Arial, sans-serif; line-height: 1.6; color: #333; max-width: 600px; margin: 0 auto; padding: 20px;">
        <div style="background: linear-gradient(135deg, #667eea 0%, #764ba2 100%); color: white; padding: 30px; text-align: center; border-radius: 10px 10px 0 0;">
          <h1 style="margin: 0;">Order Confirmed!</h1>
        </div>
        
        <div style="background: #f9fafb; padding: 30px; border-radius: 0 0 10px 10px;">
          <p>Hello ${params.customerName},</p>
          <p>Your order at <strong>${params.restaurantName}</strong> has been confirmed!</p>
          
          <div style="background: white; padding: 20px; border-radius: 8px; margin: 20px 0;">
            <h2 style="margin-top: 0; color: #667eea;">Order Details</h2>
            <p><strong>Order Number:</strong> ${params.orderNumber}</p>
            <p><strong>Table Number:</strong> ${params.tableNumber}</p>
            
            <table style="width: 100%; margin-top: 20px; border-collapse: collapse;">
              <thead>
                <tr style="background: #f3f4f6;">
                  <th style="padding: 8px; text-align: left; border-bottom: 2px solid #ddd;">Item</th>
                  <th style="padding: 8px; text-align: left; border-bottom: 2px solid #ddd;">Qty</th>
                  <th style="padding: 8px; text-align: left; border-bottom: 2px solid #ddd;">Price</th>
                </tr>
              </thead>
              <tbody>
                ${itemsHtml}
              </tbody>
              <tfoot>
                <tr>
                  <td colspan="2" style="padding: 12px 8px; font-weight: bold;">Total:</td>
                  <td style="padding: 12px 8px; font-weight: bold; color: #667eea;">${params.total}</td>
                </tr>
              </tfoot>
            </table>
          </div>
          
          <p>We'll notify you when your order status changes.</p>
          <p style="color: #6b7280; font-size: 14px; margin-top: 30px;">Thank you for your order!</p>
        </div>
      </body>
      </html>
    `,
    text: `Order Confirmed!\n\nHello ${params.customerName},\n\nYour order at ${params.restaurantName} has been confirmed!\n\nOrder Number: ${params.orderNumber}\nTable Number: ${params.tableNumber}\nTotal: ${params.total}\n\nThank you for your order!`,
  };
}

/**
 * Email template for order status update
 */
export function orderStatusUpdateEmail(params: {
  customerName: string;
  restaurantName: string;
  orderNumber: string;
  status: string;
  tableNumber: number;
}) {
  const statusMessages = {
    pending: 'Your order has been received and will be prepared shortly.',
    preparing: 'Your order is being prepared right now!',
    ready: 'Your order is ready! Please collect it from the counter.',
    completed: 'Your order has been completed. Enjoy your meal!',
    cancelled: 'Your order has been cancelled.',
  };

  const message = statusMessages[params.status as keyof typeof statusMessages] || 'Your order status has been updated.';

  return {
    subject: `Order Update - ${params.restaurantName}`,
    html: `
      <!DOCTYPE html>
      <html>
      <head>
        <meta charset="utf-8">
        <meta name="viewport" content="width=device-width, initial-scale=1.0">
        <title>Order Status Update</title>
      </head>
      <body style="font-family: Arial, sans-serif; line-height: 1.6; color: #333; max-width: 600px; margin: 0 auto; padding: 20px;">
        <div style="background: linear-gradient(135deg, #667eea 0%, #764ba2 100%); color: white; padding: 30px; text-align: center; border-radius: 10px 10px 0 0;">
          <h1 style="margin: 0;">Order Status Update</h1>
        </div>
        
        <div style="background: #f9fafb; padding: 30px; border-radius: 0 0 10px 10px;">
          <p>Hello ${params.customerName},</p>
          
          <div style="background: white; padding: 20px; border-radius: 8px; margin: 20px 0; text-align: center;">
            <h2 style="color: #667eea; margin-top: 0;">Order Status: ${params.status.toUpperCase()}</h2>
            <p style="font-size: 16px;">${message}</p>
            <p style="color: #6b7280;"><strong>Order Number:</strong> ${params.orderNumber}</p>
            <p style="color: #6b7280;"><strong>Table Number:</strong> ${params.tableNumber}</p>
          </div>
          
          <p style="color: #6b7280; font-size: 14px; margin-top: 30px;">Thank you for dining with ${params.restaurantName}!</p>
        </div>
      </body>
      </html>
    `,
    text: `Order Status Update\n\nHello ${params.customerName},\n\nOrder Status: ${params.status.toUpperCase()}\n${message}\n\nOrder Number: ${params.orderNumber}\nTable Number: ${params.tableNumber}\n\nThank you for dining with ${params.restaurantName}!`,
  };
}
