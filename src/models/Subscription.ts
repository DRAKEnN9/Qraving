import mongoose, { Schema, Document, Model } from 'mongoose';

export interface ISubscription extends Document {
  ownerId: mongoose.Types.ObjectId;
  provider: 'razorpay';
  razorpayCustomerId?: string;
  razorpaySubscriptionId?: string;
  plan: 'basic' | 'advance';
  planPricePaise?: number;
  status: 'trialing' | 'active' | 'cancelled' | 'past_due' | 'incomplete' | 'halted' | 'pending';
  trialEndsAt?: Date;
  currentPeriodStart?: Date;
  currentPeriodEnd?: Date;
  cancelAtPeriodEnd?: boolean;
  createdAt: Date;
  updatedAt: Date;
}

const SubscriptionSchema = new Schema<ISubscription>(
  {
    ownerId: {
      type: Schema.Types.ObjectId,
      ref: 'User',
      required: true,
      unique: true,
    },
    provider: {
      type: String,
      enum: ['razorpay'],
      default: 'razorpay',
      required: true,
    },
    razorpayCustomerId: {
      type: String,
    },
    razorpaySubscriptionId: {
      type: String,
    },
    plan: {
      type: String,
      enum: ['basic', 'advance'],
      default: 'basic',
      required: true,
    },
    planPricePaise: {
      type: Number,
    },
    status: {
      type: String,
      enum: ['trialing', 'active', 'cancelled', 'past_due', 'incomplete', 'halted', 'pending'],
      default: 'trialing',
    },
    trialEndsAt: {
      type: Date,
    },
    currentPeriodStart: {
      type: Date,
    },
    currentPeriodEnd: {
      type: Date,
    },
    cancelAtPeriodEnd: {
      type: Boolean,
      default: false,
    },
  },
  {
    timestamps: true,
  }
);

// Index for faster queries
SubscriptionSchema.index({ razorpaySubscriptionId: 1 });
SubscriptionSchema.index({ status: 1 });

const Subscription: Model<ISubscription> =
  mongoose.models.Subscription || mongoose.model<ISubscription>('Subscription', SubscriptionSchema);

export default Subscription;
