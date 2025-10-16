import mongoose, { Schema, Document, Model } from 'mongoose';

export interface IModifier {
  name: string;
  priceDelta: number; // in cents
}

export interface IMenuItem extends Document {
  restaurantId: mongoose.Types.ObjectId;
  categoryId: mongoose.Types.ObjectId;
  name: string;
  description?: string;
  priceCents: number;
  images: string[];
  orderable: boolean;
  soldOut: boolean;
  modifiers: IModifier[];
  order: number;
  createdAt: Date;
  updatedAt: Date;
}

const ModifierSchema = new Schema<IModifier>(
  {
    name: {
      type: String,
      required: true,
    },
    priceDelta: {
      type: Number,
      default: 0,
    },
  },
  { _id: false }
);

const MenuItemSchema = new Schema<IMenuItem>(
  {
    restaurantId: {
      type: Schema.Types.ObjectId,
      ref: 'Restaurant',
      required: true,
    },
    categoryId: {
      type: Schema.Types.ObjectId,
      ref: 'Category',
      required: true,
    },
    name: {
      type: String,
      required: [true, 'Please provide a menu item name'],
      maxlength: [100, 'Name cannot be more than 100 characters'],
    },
    description: {
      type: String,
      maxlength: [500, 'Description cannot be more than 500 characters'],
    },
    priceCents: {
      type: Number,
      required: [true, 'Please provide a price'],
      min: [0, 'Price cannot be negative'],
    },
    images: {
      type: [String],
      default: [],
    },
    orderable: {
      type: Boolean,
      default: true,
    },
    soldOut: {
      type: Boolean,
      default: false,
    },
    modifiers: {
      type: [ModifierSchema],
      default: [],
    },
    order: {
      type: Number,
      default: 0,
    },
  },
  {
    timestamps: true,
  }
);

// Indexes for faster queries
MenuItemSchema.index({ restaurantId: 1, categoryId: 1, order: 1 });
MenuItemSchema.index({ restaurantId: 1, orderable: 1, soldOut: 1 });

const MenuItem: Model<IMenuItem> =
  mongoose.models.MenuItem || mongoose.model<IMenuItem>('MenuItem', MenuItemSchema);

export default MenuItem;
