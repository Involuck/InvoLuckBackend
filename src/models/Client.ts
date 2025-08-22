/**
 * Client model for InvoLuck Backend
 * Mongoose schema for client management
 */

import mongoose, { Document, Schema, Types } from 'mongoose';

// Address interface
export interface IAddress {
  street: string;
  city: string;
  state: string;
  postalCode: string;
  country: string;
}

// Contact person interface
export interface IContactPerson {
  name: string;
  email?: string;
  phone?: string;
  position?: string;
}

// Client interface extending Mongoose Document
export interface IClient extends Document {
  userId: Types.ObjectId;
  name: string;
  email: string;
  phone?: string;
  company?: string;
  taxId?: string;
  website?: string;
  notes?: string;
  status: 'active' | 'inactive' | 'suspended';
  billingAddress?: IAddress;
  shippingAddress?: IAddress;
  contactPerson?: IContactPerson;
  paymentTerms: number;
  currency: string;
  tags: string[];
  metadata: Record<string, any>;
  lastInvoiceDate?: Date;
  totalInvoiced: number;
  totalPaid: number;
  outstandingBalance: number;
  invoiceCount: number;
  createdAt: Date;
  updatedAt: Date;
  
  // Instance methods
  updateFinancials(): Promise<void>;
  toJSON(): any;
}

// Address schema
const addressSchema = new Schema<IAddress>({
  street: {
    type: String,
    required: [true, 'Street is required'],
    trim: true,
    maxlength: [100, 'Street cannot exceed 100 characters'],
  },
  city: {
    type: String,
    required: [true, 'City is required'],
    trim: true,
    maxlength: [50, 'City cannot exceed 50 characters'],
  },
  state: {
    type: String,
    required: [true, 'State is required'],
    trim: true,
    maxlength: [50, 'State cannot exceed 50 characters'],
  },
  postalCode: {
    type: String,
    required: [true, 'Postal code is required'],
    trim: true,
    maxlength: [20, 'Postal code cannot exceed 20 characters'],
  },
  country: {
    type: String,
    required: [true, 'Country is required'],
    trim: true,
    maxlength: [50, 'Country cannot exceed 50 characters'],
  },
}, { _id: false });

// Contact person schema
const contactPersonSchema = new Schema<IContactPerson>({
  name: {
    type: String,
    required: [true, 'Contact name is required'],
    trim: true,
    maxlength: [50, 'Contact name cannot exceed 50 characters'],
  },
  email: {
    type: String,
    lowercase: true,
    trim: true,
    match: [/^\w+([.-]?\w+)*@\w+([.-]?\w+)*(\.\w{2,3})+$/, 'Please enter a valid email'],
  },
  phone: {
    type: String,
    trim: true,
    maxlength: [20, 'Phone number cannot exceed 20 characters'],
  },
  position: {
    type: String,
    trim: true,
    maxlength: [50, 'Position cannot exceed 50 characters'],
  },
}, { _id: false });

// Client schema definition
const clientSchema = new Schema<IClient>(
  {
    userId: {
      type: Schema.Types.ObjectId,
      ref: 'User',
      required: [true, 'User ID is required'],
    },
    
    name: {
      type: String,
      required: [true, 'Client name is required'],
      trim: true,
      maxlength: [100, 'Client name cannot exceed 100 characters'],
    },
    
    email: {
      type: String,
      required: [true, 'Email is required'],
      lowercase: true,
      trim: true,
      match: [/^\w+([.-]?\w+)*@\w+([.-]?\w+)*(\.\w{2,3})+$/, 'Please enter a valid email'],
    },
    
    phone: {
      type: String,
      trim: true,
      maxlength: [20, 'Phone number cannot exceed 20 characters'],
    },
    
    company: {
      type: String,
      trim: true,
      maxlength: [100, 'Company name cannot exceed 100 characters'],
    },
    
    taxId: {
      type: String,
      trim: true,
      maxlength: [50, 'Tax ID cannot exceed 50 characters'],
    },
    
    website: {
      type: String,
      trim: true,
      validate: {
        validator: function (v: string) {
          if (!v) return true;
          return /^https?:\/\/.+/.test(v);
        },
        message: 'Website must be a valid URL',
      },
    },
    
    notes: {
      type: String,
      trim: true,
      maxlength: [500, 'Notes cannot exceed 500 characters'],
    },
    
    status: {
      type: String,
      enum: ['active', 'inactive', 'suspended'],
      default: 'active',
    },
    
    billingAddress: addressSchema,
    
    shippingAddress: addressSchema,
    
    contactPerson: contactPersonSchema,
    
    paymentTerms: {
      type: Number,
      min: [0, 'Payment terms cannot be negative'],
      max: [365, 'Payment terms cannot exceed 365 days'],
      default: 30,
    },
    
    currency: {
      type: String,
      required: [true, 'Currency is required'],
      uppercase: true,
      length: [3, 'Currency must be a 3-letter code'],
      default: 'USD',
    },
    
    tags: {
      type: [String],
      validate: {
        validator: function (v: string[]) {
          return v.length <= 10;
        },
        message: 'Maximum 10 tags allowed',
      },
      default: [],
    },
    
    metadata: {
      type: Schema.Types.Mixed,
      default: {},
    },
    
    lastInvoiceDate: {
      type: Date,
    },
    
    totalInvoiced: {
      type: Number,
      min: [0, 'Total invoiced cannot be negative'],
      default: 0,
    },
    
    totalPaid: {
      type: Number,
      min: [0, 'Total paid cannot be negative'],
      default: 0,
    },
    
    outstandingBalance: {
      type: Number,
      default: 0,
    },
    
    invoiceCount: {
      type: Number,
      min: [0, 'Invoice count cannot be negative'],
      default: 0,
    },
  },
  {
    timestamps: true,
    toJSON: { virtuals: true },
    toObject: { virtuals: true },
  }
);

// Indexes
clientSchema.index({ userId: 1, email: 1 }, { unique: true });
clientSchema.index({ userId: 1, name: 1 });
clientSchema.index({ userId: 1, status: 1 });
clientSchema.index({ userId: 1, company: 1 });
clientSchema.index({ userId: 1, tags: 1 });
clientSchema.index({ userId: 1, createdAt: -1 });
clientSchema.index({ userId: 1, lastInvoiceDate: -1 });

// Text search index
clientSchema.index({
  name: 'text',
  email: 'text',
  company: 'text',
  'contactPerson.name': 'text',
}, {
  weights: {
    name: 10,
    email: 5,
    company: 8,
    'contactPerson.name': 3,
  },
  name: 'client_text_index',
});

// Virtual for client display name
clientSchema.virtual('displayName').get(function () {
  return this.company ? `${this.name} (${this.company})` : this.name;
});

// Virtual for full address
clientSchema.virtual('fullBillingAddress').get(function () {
  if (!this.billingAddress) return null;
  const addr = this.billingAddress;
  return `${addr.street}, ${addr.city}, ${addr.state} ${addr.postalCode}, ${addr.country}`;
});

// Virtual for payment status
clientSchema.virtual('paymentStatus').get(function () {
  if (this.outstandingBalance > 0) return 'has_outstanding';
  if (this.totalPaid > 0) return 'paid';
  return 'no_payments';
});

// Pre-save middleware to calculate outstanding balance
clientSchema.pre('save', function (next) {
  this.outstandingBalance = this.totalInvoiced - this.totalPaid;
  next();
});

// Instance method to update financial data
clientSchema.methods.updateFinancials = async function (): Promise<void> {
  const Invoice = mongoose.model('Invoice');
  
  const stats = await Invoice.aggregate([
    { $match: { clientId: this._id } },
    {
      $group: {
        _id: null,
        totalInvoiced: { $sum: '$total' },
        totalPaid: { $sum: { $cond: [{ $eq: ['$status', 'paid'] }, '$total', 0] } },
        invoiceCount: { $sum: 1 },
        lastInvoiceDate: { $max: '$issueDate' },
      },
    },
  ]);
  
  if (stats.length > 0) {
    const stat = stats[0];
    this.totalInvoiced = stat.totalInvoiced || 0;
    this.totalPaid = stat.totalPaid || 0;
    this.invoiceCount = stat.invoiceCount || 0;
    this.lastInvoiceDate = stat.lastInvoiceDate;
    this.outstandingBalance = this.totalInvoiced - this.totalPaid;
  } else {
    this.totalInvoiced = 0;
    this.totalPaid = 0;
    this.invoiceCount = 0;
    this.lastInvoiceDate = undefined;
    this.outstandingBalance = 0;
  }
  
  await this.save();
};

// Override toJSON to format output
clientSchema.methods.toJSON = function () {
  const clientObject = this.toObject();
  
  // Remove internal fields
  delete clientObject.__v;
  
  return clientObject;
};

// Static methods
clientSchema.statics.findByUser = function (userId: Types.ObjectId) {
  return this.find({ userId, status: { $ne: 'suspended' } });
};

clientSchema.statics.findActiveByUser = function (userId: Types.ObjectId) {
  return this.find({ userId, status: 'active' });
};

clientSchema.statics.searchByUser = function (userId: Types.ObjectId, searchTerm: string) {
  return this.find({
    userId,
    $text: { $search: searchTerm },
  }).select({ score: { $meta: 'textScore' } });
};

// Create and export the Client model
export const Client = mongoose.model<IClient>('Client', clientSchema);
export default Client;
