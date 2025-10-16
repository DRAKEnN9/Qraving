import mongoose, { Schema, Document, Model } from 'mongoose';

export interface IWebhookLog extends Document {
  provider: string;
  eventId: string;
  rawPayload: unknown;
  signatureVerified: boolean;
  handled: boolean;
  receivedAt: Date;
  handledAt?: Date;
  notes?: string;
}

const WebhookLogSchema = new Schema<IWebhookLog>({
  provider: {
    type: String,
    required: true,
    enum: ['stripe'],
  },
  eventId: {
    type: String,
    required: true,
    unique: true,
  },
  rawPayload: {
    type: Schema.Types.Mixed,
    required: true,
  },
  signatureVerified: {
    type: Boolean,
    required: true,
    default: false,
  },
  handled: {
    type: Boolean,
    default: false,
  },
  receivedAt: {
    type: Date,
    default: Date.now,
  },
  handledAt: {
    type: Date,
  },
  notes: {
    type: String,
  },
});

// Index for faster queries
WebhookLogSchema.index({ provider: 1, eventId: 1 });
WebhookLogSchema.index({ receivedAt: -1 });

const WebhookLog: Model<IWebhookLog> =
  mongoose.models.WebhookLog || mongoose.model<IWebhookLog>('WebhookLog', WebhookLogSchema);

export default WebhookLog;
