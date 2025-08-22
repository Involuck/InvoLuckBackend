/**
 * Invoice model for InvoLuck Backend
 * Mongoose schema for invoice management
 */

import mongoose, { Document, Schema, Types } from 'mongoose';

// Invoice item interface
export interface IInvoiceItem {
  description: string;
  quantity: number;
  unitPrice: number;
  taxRate: number;
  discount: number;
  category?: string;
  unit?: string;
  subtotal: number;
  taxAmount: number;
  total: number;
}

// Payment terms interface
export interface IPaymentTerms {
  dueDate: Date;
  lateFee: number;
  discountRate: number;
  discountDays: number;
  paymentMethods: string[];
}

// Payment record interface
export interface IPaymentRecord {
  amount: number;
  date: Date;
  method: string;
  reference?: string;
  notes?: string;
}

// Invoice interface extending Mongoose Document
export interface IInvoice extends Document {
  userId: Types.ObjectId;
  clientId: Types.ObjectId;
  number: string;
  issueDate: Date;
  dueDate: Date;
  status: 'draft' | 'sent' | 'viewed' | 'paid' | 'overdue' | 'cancelled';
  items: IInvoiceItem[];
  subtotal: number;
  taxRate: number;
  taxAmount: number;
  discountType: 'percentage' | 'fixed';
  discountValue: number;
  discountAmount: number;
  shippingCost: number;
  total: number;
  currency: string;
  notes?: string;
  terms?: string;
  paymentTerms?: IPaymentTerms;
  payments: IPaymentRecord[];
  totalPaid: number;
  remainingBalance: number;
  sentAt?: Date;
  viewedAt?: Date;
  paidAt?: Date;
  tags: string[];
  metadata: Record<string, any>;
  createdAt: Date;
  updatedAt: Date;
  
  // Instance methods
  calculateTotals(): void;
  addPayment(payment: Partial<IPaymentRecord>): void;
  markAsSent(): void;
  markAsViewed(): void;
  markAsPaid(paymentData?: Partial<IPaymentRecord>): void;
  isOverdue(): boolean;
  getDaysUntilDue(): number;
  toJSON(): any;
}

// Invoice item schema
const invoiceItemSchema = new Schema<IInvoiceItem>({
  description: {
    type: String,
    required: [true, 'Item description is required'],
    trim: true,
    maxlength: [500, 'Description cannot exceed 500 characters'],
  },
  quantity: {
    type: Number,
    required: [true, 'Quantity is required'],
    min: [0.01, 'Quantity must be greater than 0'],
    max: [999999.99, 'Quantity too large'],
  },
  unitPrice: {
    type: Number,
    required: [true, 'Unit price is required'],
    min: [0, 'Unit price cannot be negative'],
    max: [999999.99, 'Unit price too large'],
  },
  taxRate: {
    type: Number,
    min: [0, 'Tax rate cannot be negative'],
    max: [100, 'Tax rate cannot exceed 100%'],
    default: 0,
  },
  discount: {
    type: Number,
    min: [0, 'Discount cannot be negative'],
    max: [100, 'Discount cannot exceed 100%'],
    default: 0,
  },
  category: {
    type: String,
    trim: true,
    maxlength: [50, 'Category cannot exceed 50 characters'],
  },
  unit: {
    type: String,
    trim: true,
    maxlength: [20, 'Unit cannot exceed 20 characters'],
  },
  subtotal: {
    type: Number,
    default: 0,
  },
  taxAmount: {
    type: Number,
    default: 0,
  },
  total: {
    type: Number,
    default: 0,
  },
}, { _id: false });

// Payment terms schema
const paymentTermsSchema = new Schema<IPaymentTerms>({
  dueDate: {
    type: Date,
    required: [true, 'Due date is required'],
  },
  lateFee: {
    type: Number,
    min: [0, 'Late fee cannot be negative'],
    default: 0,
  },
  discountRate: {
    type: Number,
    min: [0, 'Discount rate cannot be negative'],
    max: [100, 'Discount rate cannot exceed 100%'],
    default: 0,
  },
  discountDays: {
    type: Number,
    min: [0, 'Discount days cannot be negative'],
    default: 0,
  },
  paymentMethods: {
    type: [String],
    enum: ['cash', 'check', 'credit_card', 'bank_transfer', 'paypal', 'other'],
    default: ['bank_transfer'],
  },
}, { _id: false });

// Payment record schema
const paymentRecordSchema = new Schema<IPaymentRecord>({
  amount: {
    type: Number,
    required: [true, 'Payment amount is required'],
    min: [0.01, 'Payment amount must be greater than 0'],
  },
  date: {
    type: Date,
    required: [true, 'Payment date is required'],
    default: Date.now,
  },
  method: {
    type: String,
    required: [true, 'Payment method is required'],
    enum: ['cash', 'check', 'credit_card', 'bank_transfer', 'paypal', 'other'],
  },
  reference: {
    type: String,
    trim: true,
    maxlength: [100, 'Payment reference cannot exceed 100 characters'],
  },
  notes: {
    type: String,
    trim: true,
    maxlength: [500, 'Payment notes cannot exceed 500 characters'],
  },
}, { timestamps: true });

// Invoice schema definition
const invoiceSchema = new Schema<IInvoice>(
  {
    userId: {
      type: Schema.Types.ObjectId,
      ref: 'User',
      required: [true, 'User ID is required'],
    },
    
    clientId: {
      type: Schema.Types.ObjectId,
      ref: 'Client',
      required: [true, 'Client ID is required'],
    },
    
    number: {
      type: String,
      required: [true, 'Invoice number is required'],
      trim: true,
      maxlength: [50, 'Invoice number cannot exceed 50 characters'],
    },
    
    issueDate: {
      type: Date,
      required: [true, 'Issue date is required'],
      default: Date.now,
    },
    
    dueDate: {
      type: Date,
      required: [true, 'Due date is required'],
    },
    
    status: {
      type: String,
      enum: ['draft', 'sent', 'viewed', 'paid', 'overdue', 'cancelled'],
      default: 'draft',
    },
    
    items: {
      type: [invoiceItemSchema],
      required: [true, 'At least one item is required'],
      validate: {
        validator: function (v: IInvoiceItem[]) {
          return v.length > 0 && v.length <= 100;
        },
        message: 'Invoice must have between 1 and 100 items',
      },
    },
    
    subtotal: {
      type: Number,
      min: [0, 'Subtotal cannot be negative'],
      default: 0,
    },
    
    taxRate: {
      type: Number,
      min: [0, 'Tax rate cannot be negative'],
      max: [100, 'Tax rate cannot exceed 100%'],
      default: 0,
    },
    
    taxAmount: {
      type: Number,
      min: [0, 'Tax amount cannot be negative'],
      default: 0,
    },
    
    discountType: {
      type: String,
      enum: ['percentage', 'fixed'],
      default: 'percentage',
    },
    
    discountValue: {
      type: Number,
      min: [0, 'Discount value cannot be negative'],
      default: 0,
    },
    
    discountAmount: {
      type: Number,
      min: [0, 'Discount amount cannot be negative'],
      default: 0,
    },
    
    shippingCost: {
      type: Number,
      min: [0, 'Shipping cost cannot be negative'],
      default: 0,
    },
    
    total: {
      type: Number,
      min: [0, 'Total cannot be negative'],
      default: 0,
    },
    
    currency: {
      type: String,
      required: [true, 'Currency is required'],
      uppercase: true,
      length: [3, 'Currency must be a 3-letter code'],
      default: 'USD',
    },
    
    notes: {
      type: String,
      trim: true,
      maxlength: [1000, 'Notes cannot exceed 1000 characters'],
    },
    
    terms: {
      type: String,
      trim: true,
      maxlength: [1000, 'Terms cannot exceed 1000 characters'],
    },
    
    paymentTerms: paymentTermsSchema,
    
    payments: {
      type: [paymentRecordSchema],
      default: [],
    },
    
    totalPaid: {
      type: Number,
      min: [0, 'Total paid cannot be negative'],
      default: 0,
    },
    
    remainingBalance: {
      type: Number,
      default: 0,
    },
    
    sentAt: Date,
    viewedAt: Date,
    paidAt: Date,
    
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
  },
  {
    timestamps: true,
    toJSON: { virtuals: true },
    toObject: { virtuals: true },
  }
);

// Indexes
invoiceSchema.index({ userId: 1, number: 1 }, { unique: true });
invoiceSchema.index({ userId: 1, clientId: 1 });
invoiceSchema.index({ userId: 1, status: 1 });
invoiceSchema.index({ userId: 1, issueDate: -1 });
invoiceSchema.index({ userId: 1, dueDate: 1 });
invoiceSchema.index({ userId: 1, total: -1 });
invoiceSchema.index({ userId: 1, tags: 1 });
invoiceSchema.index({ status: 1, dueDate: 1 }); // For overdue queries

// Virtuals
invoiceSchema.virtual('isOverdueVirtual').get(function () {
  return this.status !== 'paid' && this.status !== 'cancelled' && new Date() > this.dueDate;
});

invoiceSchema.virtual('daysUntilDue').get(function () {
  const now = new Date();
  const timeDiff = this.dueDate.getTime() - now.getTime();
  return Math.ceil(timeDiff / (1000 * 3600 * 24));
});

// Pre-save middleware to calculate totals
invoiceSchema.pre('save', function (next) {
  this.calculateTotals();
  next();
});

// Pre-save middleware to auto-generate invoice number
invoiceSchema.pre('save', async function (next) {
  if (this.isNew && !this.number) {
    const count = await mongoose.model('Invoice').countDocuments({ userId: this.userId });
    const year = new Date().getFullYear();
    this.number = `INV-${year}-${String(count + 1).padStart(4, '0')}`;
  }
  next();
});

// Pre-save middleware to update status based on dates
invoiceSchema.pre('save', function (next) {
  const now = new Date();
  
  // Auto-mark as overdue
  if (this.status === 'sent' || this.status === 'viewed') {
    if (now > this.dueDate) {
      this.status = 'overdue';
    }
  }
  
  next();
});

// Instance method to calculate totals
invoiceSchema.methods.calculateTotals = function (): void {
  // Calculate item totals
  this.items.forEach((item: IInvoiceItem) => {
    item.subtotal = item.quantity * item.unitPrice;
    
    // Apply item discount
    if (item.discount > 0) {
      item.subtotal -= (item.subtotal * item.discount) / 100;
    }
    
    // Calculate tax
    item.taxAmount = (item.subtotal * item.taxRate) / 100;
    item.total = item.subtotal + item.taxAmount;
  });
  
  // Calculate invoice subtotal
  this.subtotal = this.items.reduce((sum, item) => sum + item.subtotal, 0);
  
  // Apply invoice-level discount
  if (this.discountValue > 0) {
    if (this.discountType === 'percentage') {
      this.discountAmount = (this.subtotal * this.discountValue) / 100;
    } else {
      this.discountAmount = this.discountValue;
    }
  } else {
    this.discountAmount = 0;
  }
  
  // Calculate tax
  const taxableAmount = this.subtotal - this.discountAmount;
  this.taxAmount = (taxableAmount * this.taxRate) / 100;
  
  // Calculate total
  this.total = taxableAmount + this.taxAmount + this.shippingCost;
  
  // Calculate remaining balance
  this.remainingBalance = this.total - this.totalPaid;
  
  // Ensure values are rounded to 2 decimal places
  this.subtotal = Math.round(this.subtotal * 100) / 100;
  this.discountAmount = Math.round(this.discountAmount * 100) / 100;
  this.taxAmount = Math.round(this.taxAmount * 100) / 100;
  this.total = Math.round(this.total * 100) / 100;
  this.remainingBalance = Math.round(this.remainingBalance * 100) / 100;
};

// Instance method to add payment
invoiceSchema.methods.addPayment = function (payment: Partial<IPaymentRecord>): void {
  this.payments.push({
    amount: payment.amount!,
    date: payment.date || new Date(),
    method: payment.method!,
    reference: payment.reference,
    notes: payment.notes,
  });
  
  // Recalculate total paid
  this.totalPaid = this.payments.reduce((sum, p) => sum + p.amount, 0);
  this.remainingBalance = this.total - this.totalPaid;
  
  // Update status if fully paid
  if (this.remainingBalance <= 0.01) { // Allow for small rounding differences
    this.status = 'paid';
    this.paidAt = new Date();
  }
};

// Instance method to mark as sent
invoiceSchema.methods.markAsSent = function (): void {
  if (this.status === 'draft') {
    this.status = 'sent';
    this.sentAt = new Date();
  }
};

// Instance method to mark as viewed
invoiceSchema.methods.markAsViewed = function (): void {
  if (this.status === 'sent') {
    this.status = 'viewed';
    this.viewedAt = new Date();
  }
};

// Instance method to mark as paid
invoiceSchema.methods.markAsPaid = function (paymentData?: Partial<IPaymentRecord>): void {
  if (paymentData) {
    this.addPayment({
      amount: paymentData.amount || this.remainingBalance,
      method: paymentData.method || 'other',
      reference: paymentData.reference,
      notes: paymentData.notes,
    });
  } else {
    this.status = 'paid';
    this.paidAt = new Date();
    this.totalPaid = this.total;
    this.remainingBalance = 0;
  }
};

// Instance method to check if overdue
invoiceSchema.methods.isOverdue = function (): boolean {
  return this.status !== 'paid' && this.status !== 'cancelled' && new Date() > this.dueDate;
};

// Instance method to get days until due
invoiceSchema.methods.getDaysUntilDue = function (): number {
  const now = new Date();
  const timeDiff = this.dueDate.getTime() - now.getTime();
  return Math.ceil(timeDiff / (1000 * 3600 * 24));
};

// Override toJSON
invoiceSchema.methods.toJSON = function () {
  const invoiceObject = this.toObject();
  delete invoiceObject.__v;
  return invoiceObject;
};

// Static methods
invoiceSchema.statics.findByUser = function (userId: Types.ObjectId) {
  return this.find({ userId }).populate('clientId', 'name email company');
};

invoiceSchema.statics.findOverdue = function () {
  return this.find({
    status: { $in: ['sent', 'viewed', 'overdue'] },
    dueDate: { $lt: new Date() },
  }).populate('clientId', 'name email company');
};

// Create and export the Invoice model
export const Invoice = mongoose.model<IInvoice>('Invoice', invoiceSchema);
export default Invoice;
