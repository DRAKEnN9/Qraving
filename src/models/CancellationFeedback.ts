import mongoose, { Schema, Document, Model } from 'mongoose';

export interface ICancellationFeedback extends Document {
  ownerId: mongoose.Types.ObjectId;
  subscriptionId?: mongoose.Types.ObjectId;
  plan?: 'basic' | 'advance';
  interval?: 'monthly' | 'yearly';
  atPeriodEnd?: boolean;
  reason: string;
  details?: string;
  createdAt: Date;
  updatedAt: Date;
}

const CancellationFeedbackSchema = new Schema<ICancellationFeedback>(
  {
    ownerId: { type: Schema.Types.ObjectId, ref: 'User', required: true },
    subscriptionId: { type: Schema.Types.ObjectId, ref: 'Subscription' },
    plan: { type: String, enum: ['basic', 'advance'] },
    interval: { type: String, enum: ['monthly', 'yearly'] },
    atPeriodEnd: { type: Boolean, default: true },
    reason: { type: String, required: true },
    details: { type: String },
  },
  { timestamps: true }
);

CancellationFeedbackSchema.index({ ownerId: 1, createdAt: -1 });

const CancellationFeedback: Model<ICancellationFeedback> =
  mongoose.models.CancellationFeedback ||
  mongoose.model<ICancellationFeedback>('CancellationFeedback', CancellationFeedbackSchema);

export default CancellationFeedback;
