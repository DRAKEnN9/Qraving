import mongoose, { Schema, Document, Model } from 'mongoose';

export interface IRestaurant extends Document {
  ownerId: mongoose.Types.ObjectId;
  name: string;
  description?: string;
  address?: string;
  contactName?: string;
  contactPhone?: string;
  phone?: string;
  email?: string;
  primaryEmail?: string;
  country?: string;
  state?: string;
  city?: string;
  pincode?: string;
  tableNumber: number;
  slug: string;
  logoUrl?: string;
  settings: {
    currency: string;
    timezone: string;
    openingHours?: string;
    enableNotifications: boolean;
  };
  qrCodeUrl?: string;
  paymentInfo?: {
    upiId?: string;
    accountHolderName?: string;
  };
  lastScanned?: Date;
  createdAt: Date;
  updatedAt: Date;
}

const RestaurantSchema = new Schema<IRestaurant>(
  {
    ownerId: {
      type: Schema.Types.ObjectId,
      ref: 'User',
      required: true,
    },
    name: {
      type: String,
      required: [true, 'Please provide a restaurant name'],
      maxlength: [100, 'Name cannot be more than 100 characters'],
    },
    description: {
      type: String,
      maxlength: [500, 'Description cannot be more than 500 characters'],
    },
    address: {
      type: String,
      maxlength: [200, 'Address cannot be more than 200 characters'],
    },
    contactName: {
      type: String,
      maxlength: [100, 'Contact name cannot be more than 100 characters'],
    },
    contactPhone: {
      type: String,
      maxlength: [20, 'Contact phone cannot be more than 20 characters'],
    },
    phone: {
      type: String,
      maxlength: [20, 'Phone cannot be more than 20 characters'],
    },
    email: {
      type: String,
      match: [/^\S+@\S+\.\S+$/, 'Please provide a valid email'],
    },
    primaryEmail: {
      type: String,
      match: [/^\S+@\S+\.\S+$/, 'Please provide a valid email'],
    },
    country: {
      type: String,
      maxlength: [100, 'Country cannot be more than 100 characters'],
    },
    state: {
      type: String,
      maxlength: [100, 'State cannot be more than 100 characters'],
    },
    city: {
      type: String,
      maxlength: [100, 'City cannot be more than 100 characters'],
    },
    pincode: {
      type: String,
      maxlength: [20, 'Pincode cannot be more than 20 characters'],
    },
    tableNumber: {
      type: Number,
      required: [true, 'Please provide number of tables'],
      min: [1, 'Must have at least 1 table'],
      default: 10,
    },
    slug: {
      type: String,
      required: true,
      unique: true,
      lowercase: true,
      trim: true,
    },
    logoUrl: {
      type: String,
    },
    settings: {
      currency: {
        type: String,
        default: 'INR',
      },
      timezone: {
        type: String,
        default: 'UTC',
      },
      openingHours: {
        type: String,
        default: '9:00 AM - 10:00 PM',
      },
      enableNotifications: {
        type: Boolean,
        default: true,
      },
    },
    lastScanned: {
      type: Date,
    },
    qrCodeUrl: {
      type: String,
    },
    paymentInfo: {
      upiId: {
        type: String,
      },
      accountHolderName: {
        type: String,
      },
    },
  },
  {
    timestamps: true,
  }
);

// Index for faster queries
RestaurantSchema.index({ ownerId: 1 });
// Note: slug index is created automatically via unique: true

const Restaurant: Model<IRestaurant> =
  mongoose.models.Restaurant || mongoose.model<IRestaurant>('Restaurant', RestaurantSchema);

export default Restaurant;
