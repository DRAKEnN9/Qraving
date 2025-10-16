import mongoose, { Schema, Document, Model } from 'mongoose';

export interface IAccountMember extends Document {
  ownerId: mongoose.Types.ObjectId; // account owner user id
  userId?: mongoose.Types.ObjectId | null; // linked user if accepted
  email: string;
  role: 'owner' | 'admin';
  status: 'invited' | 'active';
  inviteTokenHash?: string | null;
  invitedAt?: Date | null;
  acceptedAt?: Date | null;
  createdAt: Date;
  updatedAt: Date;
}

const AccountMemberSchema = new Schema<IAccountMember>(
  {
    ownerId: { type: Schema.Types.ObjectId, ref: 'User', required: true },
    userId: { type: Schema.Types.ObjectId, ref: 'User', default: null },
    email: { type: String, required: true, lowercase: true, trim: true },
    role: { type: String, enum: ['owner', 'admin'], default: 'admin', required: true },
    status: { type: String, enum: ['invited', 'active'], default: 'invited' },
    inviteTokenHash: { type: String, default: null },
    invitedAt: { type: Date, default: null },
    acceptedAt: { type: Date, default: null },
  },
  { timestamps: true }
);

AccountMemberSchema.index({ ownerId: 1, email: 1 }, { unique: true });

const AccountMember: Model<IAccountMember> =
  mongoose.models.AccountMember || mongoose.model<IAccountMember>('AccountMember', AccountMemberSchema);

export default AccountMember;
