import mongoose, { Schema, Document, Model } from 'mongoose';

export interface IOrderItem {
  menuItemId: mongoose.Types.ObjectId;
  name: string;
  priceCents: number;
  quantity: number;
  modifiers: string[];
  specialRequest?: string;
}

export interface IOrder extends Document {
  restaurantId: mongoose.Types.ObjectId;
  items: IOrderItem[];
  totalCents: number;
  currency: string;
  customerName: string;
  customerEmail?: string;
  customerPhone?: string;
  tableNumber: number;
  notes?: string;
  paymentMethod?: string;
  razorpayOrderId?: string;
  razorpayPaymentId?: string;
  razorpaySignature?: string;
  paymentStatus: 'pending' | 'processing' | 'succeeded' | 'failed';
  status: 'pending' | 'preparing' | 'completed' | 'cancelled';
  createdAt: Date;
  updatedAt: Date;
}

const OrderItemSchema = new Schema<IOrderItem>(
  {
    menuItemId: {
      type: Schema.Types.ObjectId,
      ref: 'MenuItem',
      required: true,
    },
    name: {
      type: String,
      required: true,
    },
    priceCents: {
      type: Number,
      required: true,
    },
    quantity: {
      type: Number,
      required: true,
      min: 1,
    },
    modifiers: {
      type: [String],
      default: [],
    },
    specialRequest: {
      type: String,
      maxlength: [200, 'Special request cannot be more than 200 characters'],
    },
  },
  { _id: false }
);

const OrderSchema = new Schema<IOrder>(
  {
    restaurantId: {
      type: Schema.Types.ObjectId,
      ref: 'Restaurant',
      required: true,
    },
    items: {
      type: [OrderItemSchema],
      required: true,
      validate: {
        validator: function (v: IOrderItem[]) {
          return v && v.length > 0;
        },
        message: 'Order must have at least one item',
      },
    },
    totalCents: {
      type: Number,
      required: true,
      min: 0,
    },
    currency: {
      type: String,
      default: 'USD',
    },
    customerName: {
      type: String,
      required: [true, 'Please provide customer name'],
      maxlength: [100, 'Name cannot be more than 100 characters'],
    },
    tableNumber: {
      type: Number,
      required: [true, 'Please provide table number'],
      min: [1, 'Table number must be at least 1'],
    },
    customerEmail: {
      type: String,
      required: false,
      validate: {
        validator: function(v: string) {
          // Only validate if email is provided
          return !v || /^\S+@\S+\.\S+$/.test(v);
        },
        message: 'Please provide a valid email'
      },
    },
    customerPhone: {
      type: String,
    },
    notes: {
      type: String,
      maxlength: [500, 'Notes cannot be more than 500 characters'],
    },
    paymentMethod: {
      type: String,
      enum: ['upi', 'card', 'cash'],
      default: 'upi',
    },
    razorpayOrderId: {
      type: String,
    },
    razorpayPaymentId: {
      type: String,
    },
    razorpaySignature: {
      type: String,
    },
    paymentStatus: {
      type: String,
      enum: ['pending', 'processing', 'succeeded', 'failed'],
      default: 'pending',
    },
    status: {
      type: String,
      enum: ['pending', 'preparing', 'completed', 'cancelled'],
      default: 'pending',
    },
  },
  {
    timestamps: true,
  }
);

// Indexes for faster queries
OrderSchema.index({ restaurantId: 1, createdAt: -1 });
OrderSchema.index({ restaurantId: 1, status: 1 });
OrderSchema.index({ razorpayOrderId: 1 });
OrderSchema.index({ razorpayPaymentId: 1 });
OrderSchema.index({ customerEmail: 1 });

const Order: Model<IOrder> =
  mongoose.models.Order || mongoose.model<IOrder>('Order', OrderSchema);

export default Order;
