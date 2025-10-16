import mongoose, { Schema, Document, Model } from 'mongoose';

export interface IPayment extends Document {
  ownerId: mongoose.Types.ObjectId;
  subscriptionId: mongoose.Types.ObjectId;
  razorpayPaymentId?: string;
  razorpayOrderId?: string;
  razorpayInvoiceId?: string;
  amount: number; // in paise
  currency: string;
  status: 'created' | 'authorized' | 'captured' | 'refunded' | 'failed';
  method?: string; // card, upi, netbanking, wallet
  description?: string;
  invoiceUrl?: string;
  paidAt?: Date;
  createdAt: Date;
  updatedAt: Date;
}

const PaymentSchema = new Schema<IPayment>(
  {
    ownerId: {
      type: Schema.Types.ObjectId,
      ref: 'User',
      required: true,
      index: true,
    },
    subscriptionId: {
      type: Schema.Types.ObjectId,
      ref: 'Subscription',
      required: true,
    },
    razorpayPaymentId: {
      type: String,
      unique: true,
      sparse: true,
    },
    razorpayOrderId: {
      type: String,
    },
    razorpayInvoiceId: {
      type: String,
    },
    amount: {
      type: Number,
      required: true,
    },
    currency: {
      type: String,
      default: 'INR',
    },
    status: {
      type: String,
      enum: ['created', 'authorized', 'captured', 'refunded', 'failed'],
      default: 'created',
    },
    method: {
      type: String,
    },
    description: {
      type: String,
    },
    invoiceUrl: {
      type: String,
    },
    paidAt: {
      type: Date,
    },
  },
  {
    timestamps: true,
  }
);

// Indexes for faster queries
PaymentSchema.index({ ownerId: 1, createdAt: -1 });
PaymentSchema.index({ razorpayPaymentId: 1 });
PaymentSchema.index({ status: 1 });

const Payment: Model<IPayment> =
  mongoose.models.Payment || mongoose.model<IPayment>('Payment', PaymentSchema);

export default Payment;
