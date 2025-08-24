/**
 * Email template types for InvoLuck Backend
 * TypeScript interfaces for email template data
 */

// Base email data interface
export interface BaseEmailData {
  // Company information
  companyName?: string;
  companyEmail?: string;
  companyWebsite?: string;
  companyAddress?: {
    street: string;
    city: string;
    state: string;
    zip: string;
    country: string;
  };

  // Social links
  social?: {
    twitter?: string;
    linkedin?: string;
    github?: string;
  };

  // Email metadata
  unsubscribeUrl?: string;
  showUnsubscribeText?: boolean;
  headerText?: string;
  previewText?: string;
}

// Invitation email template data
export interface InvitationEmailData extends BaseEmailData {
  name: string;
  inviteUrl: string;
  expiresIn?: string;
  role?: string;
  personalMessage?: string;
}

// Invoice created email template data
export interface InvoiceCreatedEmailData extends BaseEmailData {
  clientName: string;
  invoiceNumber: string;
  amount: number | string;
  currency: string;
  dueDate: string;
  invoiceUrl: string;
  issueDate?: string;
  description?: string;
  items?: Array<{
    description: string;
    quantity: number;
    unitPrice: number;
    total: number;
  }>;
}

// Invoice reminder email template data
export interface InvoiceReminderEmailData extends InvoiceCreatedEmailData {
  daysOverdue?: number;
  isOverdue?: boolean;
  reminderType?: 'gentle' | 'urgent' | 'final';
  lateFee?: number;
}

// Password reset email template data
export interface PasswordResetEmailData extends BaseEmailData {
  name: string;
  resetUrl: string;
  expiresIn?: string;
  userEmail?: string;
}

// Welcome email template data
export interface WelcomeEmailData extends BaseEmailData {
  name: string;
  email: string;
  loginUrl: string;
  accountType?: string;
  nextSteps?: string[];
}

// Email verification template data
export interface EmailVerificationData extends BaseEmailData {
  name: string;
  verificationUrl: string;
  expiresIn?: string;
  email: string;
}

// Payment received email template data
export interface PaymentReceivedEmailData extends BaseEmailData {
  clientName: string;
  invoiceNumber: string;
  amount: number | string;
  currency: string;
  paymentDate: string;
  paymentMethod: string;
  referenceNumber?: string;
  remainingBalance?: number;
}

// Team invitation accepted email template data
export interface TeamInviteAcceptedEmailData extends BaseEmailData {
  inviteeName: string;
  inviteeEmail: string;
  inviterName: string;
  role: string;
  joinDate: string;
}

// Subscription related email template data
export interface SubscriptionEmailData extends BaseEmailData {
  name: string;
  planName: string;
  amount?: number | string;
  currency?: string;
  nextBillingDate?: string;
  managementUrl?: string;
  type: 'created' | 'updated' | 'cancelled' | 'payment_failed' | 'trial_ending';
}

// Report email template data
export interface ReportEmailData extends BaseEmailData {
  recipientName: string;
  reportType: string;
  reportPeriod: string;
  downloadUrl?: string;
  summaryData?: {
    totalInvoices?: number;
    totalRevenue?: number;
    pendingPayments?: number;
    overdueInvoices?: number;
  };
}

// Marketing/Newsletter email template data
export interface NewsletterEmailData extends BaseEmailData {
  recipientName?: string;
  subject: string;
  articles?: Array<{
    title: string;
    excerpt: string;
    url: string;
    imageUrl?: string;
  }>;
  ctaText?: string;
  ctaUrl?: string;
}

// Template validation interface
export interface TemplateValidation {
  templateName: string;
  isValid: boolean;
  errors: string[];
  warnings: string[];
}

// Email rendering options
export interface EmailRenderOptions {
  inlineCss?: boolean;
  minify?: boolean;
  removeComments?: boolean;
  optimizeImages?: boolean;
  generateTextVersion?: boolean;
}

// Email sending result
export interface EmailSendResult {
  success: boolean;
  messageId?: string;
  error?: string;
  retryable?: boolean;
  timestamp: Date;
}

// Email queue item
export interface EmailQueueItem {
  id: string;
  templateName: string;
  to: string | string[];
  cc?: string | string[];
  bcc?: string | string[];
  data: BaseEmailData;
  options?: EmailRenderOptions;
  priority?: 'low' | 'normal' | 'high' | 'urgent';
  scheduledAt?: Date;
  attempts?: number;
  maxAttempts?: number;
  createdAt: Date;
  status: 'pending' | 'processing' | 'sent' | 'failed' | 'cancelled';
}

// Email template metadata
export interface EmailTemplateMetadata {
  name: string;
  displayName: string;
  description: string;
  category: 'transactional' | 'marketing' | 'system';
  requiredFields: string[];
  optionalFields: string[];
  supportsPreview: boolean;
  lastModified: Date;
  version: string;
}

// Email analytics data
export interface EmailAnalytics {
  templateName: string;
  sentCount: number;
  deliveredCount: number;
  openedCount: number;
  clickedCount: number;
  bouncedCount: number;
  unsubscribedCount: number;
  spamCount: number;
  openRate: number;
  clickRate: number;
  bounceRate: number;
  period: {
    start: Date;
    end: Date;
  };
}

// Union type for all email template data
export type EmailTemplateData =
  | InvitationEmailData
  | InvoiceCreatedEmailData
  | InvoiceReminderEmailData
  | PasswordResetEmailData
  | WelcomeEmailData
  | EmailVerificationData
  | PaymentReceivedEmailData
  | TeamInviteAcceptedEmailData
  | SubscriptionEmailData
  | ReportEmailData
  | NewsletterEmailData;

// Template name enum
export enum EmailTemplate {
  INVITATION = 'invitation',
  INVOICE_CREATED = 'invoice-created',
  INVOICE_REMINDER = 'invoice-reminder',
  PASSWORD_RESET = 'password-reset',
  WELCOME = 'welcome',
  EMAIL_VERIFICATION = 'email-verification',
  PAYMENT_RECEIVED = 'payment-received',
  TEAM_INVITE_ACCEPTED = 'team-invite-accepted',
  SUBSCRIPTION_CREATED = 'subscription-created',
  SUBSCRIPTION_UPDATED = 'subscription-updated',
  SUBSCRIPTION_CANCELLED = 'subscription-cancelled',
  PAYMENT_FAILED = 'payment-failed',
  TRIAL_ENDING = 'trial-ending',
  MONTHLY_REPORT = 'monthly-report',
  NEWSLETTER = 'newsletter',
}

// Email provider configuration
export interface EmailProviderConfig {
  provider: 'smtp' | 'sendgrid' | 'mailgun' | 'ses' | 'postmark';
  settings: {
    [key: string]: any;
  };
  rateLimits?: {
    perSecond?: number;
    perMinute?: number;
    perHour?: number;
    perDay?: number;
  };
  webhooks?: {
    delivery?: string;
    bounce?: string;
    complaint?: string;
    open?: string;
    click?: string;
    unsubscribe?: string;
  };
}

export default {
  EmailTemplate,
};
