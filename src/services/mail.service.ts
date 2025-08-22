/**
 * Mail service for InvoLuck Backend
 * Handles email template rendering and sending using Maizzle + Nodemailer
 */

import { sendMail, EmailOptions } from '../config/mail';
import logger from '../config/logger';
import { ApiErrors } from '../utils/ApiError';

// Email template data interfaces
export interface InvitationEmailData {
  name: string;
  inviteUrl: string;
  companyName?: string;
  expiresIn?: string;
}

export interface InvoiceCreatedEmailData {
  clientName: string;
  invoiceNumber: string;
  amount: number;
  currency: string;
  dueDate: string;
  invoiceUrl: string;
  companyName?: string;
}

export interface PasswordResetEmailData {
  name: string;
  resetUrl: string;
  expiresIn?: string;
}

export interface WelcomeEmailData {
  name: string;
  email: string;
  loginUrl: string;
}

class MailService {
  /**
   * Send invitation email to new team member
   */
  async sendInvitationEmail(
    to: string,
    data: InvitationEmailData
  ): Promise<void> {
    try {
      // TODO: Render template with Maizzle when templates are ready
      const html = this.renderInvitationTemplate(data);
      
      await sendMail({
        to,
        subject: `You're invited to join ${data.companyName || 'InvoLuck'}`,
        html,
      });

      logger.info({
        msg: 'Invitation email sent successfully',
        recipient: to,
        inviteeName: data.name,
      });
    } catch (error) {
      logger.error({
        msg: 'Failed to send invitation email',
        recipient: to,
        error: error instanceof Error ? error.message : 'Unknown error',
      });
      throw ApiErrors.internal('Failed to send invitation email');
    }
  }

  /**
   * Send invoice created notification email
   */
  async sendInvoiceCreatedEmail(
    to: string,
    data: InvoiceCreatedEmailData
  ): Promise<void> {
    try {
      // TODO: Render template with Maizzle when templates are ready
      const html = this.renderInvoiceCreatedTemplate(data);
      
      await sendMail({
        to,
        subject: `New Invoice ${data.invoiceNumber} - ${data.currency} ${data.amount}`,
        html,
      });

      logger.info({
        msg: 'Invoice created email sent successfully',
        recipient: to,
        invoiceNumber: data.invoiceNumber,
        amount: data.amount,
        currency: data.currency,
      });
    } catch (error) {
      logger.error({
        msg: 'Failed to send invoice created email',
        recipient: to,
        invoiceNumber: data.invoiceNumber,
        error: error instanceof Error ? error.message : 'Unknown error',
      });
      throw ApiErrors.internal('Failed to send invoice notification email');
    }
  }

  /**
   * Send password reset email
   */
  async sendPasswordResetEmail(
    to: string,
    data: PasswordResetEmailData
  ): Promise<void> {
    try {
      const html = this.renderPasswordResetTemplate(data);
      
      await sendMail({
        to,
        subject: 'Reset your InvoLuck password',
        html,
      });

      logger.info({
        msg: 'Password reset email sent successfully',
        recipient: to,
        userName: data.name,
      });
    } catch (error) {
      logger.error({
        msg: 'Failed to send password reset email',
        recipient: to,
        error: error instanceof Error ? error.message : 'Unknown error',
      });
      throw ApiErrors.internal('Failed to send password reset email');
    }
  }

  /**
   * Send welcome email to new user
   */
  async sendWelcomeEmail(
    to: string,
    data: WelcomeEmailData
  ): Promise<void> {
    try {
      const html = this.renderWelcomeTemplate(data);
      
      await sendMail({
        to,
        subject: 'Welcome to InvoLuck!',
        html,
      });

      logger.info({
        msg: 'Welcome email sent successfully',
        recipient: to,
        userName: data.name,
      });
    } catch (error) {
      logger.error({
        msg: 'Failed to send welcome email',
        recipient: to,
        error: error instanceof Error ? error.message : 'Unknown error',
      });
      // Don't throw error for welcome emails as they're not critical
      logger.warn('Welcome email failed but user registration continued');
    }
  }

  /**
   * Send invoice reminder email
   */
  async sendInvoiceReminderEmail(
    to: string,
    data: InvoiceCreatedEmailData & { daysOverdue?: number }
  ): Promise<void> {
    try {
      const html = this.renderInvoiceReminderTemplate(data);
      const isOverdue = data.daysOverdue && data.daysOverdue > 0;
      const subject = isOverdue 
        ? `Overdue Invoice ${data.invoiceNumber} - ${data.currency} ${data.amount}`
        : `Payment Reminder: Invoice ${data.invoiceNumber}`;
      
      await sendMail({
        to,
        subject,
        html,
      });

      logger.info({
        msg: 'Invoice reminder email sent successfully',
        recipient: to,
        invoiceNumber: data.invoiceNumber,
        isOverdue,
        daysOverdue: data.daysOverdue,
      });
    } catch (error) {
      logger.error({
        msg: 'Failed to send invoice reminder email',
        recipient: to,
        invoiceNumber: data.invoiceNumber,
        error: error instanceof Error ? error.message : 'Unknown error',
      });
      throw ApiErrors.internal('Failed to send invoice reminder email');
    }
  }

  /**
   * Render invitation email template
   * TODO: Replace with Maizzle template rendering
   */
  private renderInvitationTemplate(data: InvitationEmailData): string {
    return `
      <!DOCTYPE html>
      <html>
        <head>
          <meta charset="utf-8">
          <title>Invitation to ${data.companyName || 'InvoLuck'}</title>
          <style>
            body { font-family: Arial, sans-serif; line-height: 1.6; color: #333; }
            .container { max-width: 600px; margin: 0 auto; padding: 20px; }
            .button { display: inline-block; padding: 12px 24px; background: #007bff; color: white; text-decoration: none; border-radius: 4px; }
            .footer { margin-top: 40px; padding-top: 20px; border-top: 1px solid #eee; font-size: 14px; color: #666; }
          </style>
        </head>
        <body>
          <div class="container">
            <h2>You're invited to join ${data.companyName || 'InvoLuck'}!</h2>
            <p>Hello ${data.name},</p>
            <p>You've been invited to join ${data.companyName || 'InvoLuck'} on InvoLuck, our invoice management platform.</p>
            <p>Click the button below to accept the invitation and set up your account:</p>
            <p><a href="${data.inviteUrl}" class="button">Accept Invitation</a></p>
            <p>This invitation will expire in ${data.expiresIn || '7 days'}.</p>
            <p>If you have any questions, please don't hesitate to contact us.</p>
            <div class="footer">
              <p>Best regards,<br>The InvoLuck Team</p>
              <p>If you're having trouble clicking the button, copy and paste this URL into your browser: ${data.inviteUrl}</p>
            </div>
          </div>
        </body>
      </html>
    `;
  }

  /**
   * Render invoice created email template
   * TODO: Replace with Maizzle template rendering
   */
  private renderInvoiceCreatedTemplate(data: InvoiceCreatedEmailData): string {
    return `
      <!DOCTYPE html>
      <html>
        <head>
          <meta charset="utf-8">
          <title>New Invoice ${data.invoiceNumber}</title>
          <style>
            body { font-family: Arial, sans-serif; line-height: 1.6; color: #333; }
            .container { max-width: 600px; margin: 0 auto; padding: 20px; }
            .invoice-details { background: #f8f9fa; padding: 20px; border-radius: 8px; margin: 20px 0; }
            .button { display: inline-block; padding: 12px 24px; background: #28a745; color: white; text-decoration: none; border-radius: 4px; }
            .amount { font-size: 24px; font-weight: bold; color: #28a745; }
            .footer { margin-top: 40px; padding-top: 20px; border-top: 1px solid #eee; font-size: 14px; color: #666; }
          </style>
        </head>
        <body>
          <div class="container">
            <h2>New Invoice from ${data.companyName || 'InvoLuck'}</h2>
            <p>Dear ${data.clientName},</p>
            <p>A new invoice has been created for you. Here are the details:</p>
            <div class="invoice-details">
              <p><strong>Invoice Number:</strong> ${data.invoiceNumber}</p>
              <p><strong>Amount:</strong> <span class="amount">${data.currency} ${data.amount}</span></p>
              <p><strong>Due Date:</strong> ${data.dueDate}</p>
            </div>
            <p>You can view and pay your invoice by clicking the button below:</p>
            <p><a href="${data.invoiceUrl}" class="button">View Invoice</a></p>
            <p>Thank you for your business!</p>
            <div class="footer">
              <p>Best regards,<br>${data.companyName || 'The InvoLuck Team'}</p>
              <p>If you're having trouble clicking the button, copy and paste this URL into your browser: ${data.invoiceUrl}</p>
            </div>
          </div>
        </body>
      </html>
    `;
  }

  /**
   * Render password reset email template
   * TODO: Replace with Maizzle template rendering
   */
  private renderPasswordResetTemplate(data: PasswordResetEmailData): string {
    return `
      <!DOCTYPE html>
      <html>
        <head>
          <meta charset="utf-8">
          <title>Reset Your Password</title>
          <style>
            body { font-family: Arial, sans-serif; line-height: 1.6; color: #333; }
            .container { max-width: 600px; margin: 0 auto; padding: 20px; }
            .button { display: inline-block; padding: 12px 24px; background: #dc3545; color: white; text-decoration: none; border-radius: 4px; }
            .warning { background: #fff3cd; border: 1px solid #ffeaa7; padding: 15px; border-radius: 4px; margin: 20px 0; }
            .footer { margin-top: 40px; padding-top: 20px; border-top: 1px solid #eee; font-size: 14px; color: #666; }
          </style>
        </head>
        <body>
          <div class="container">
            <h2>Reset Your InvoLuck Password</h2>
            <p>Hello ${data.name},</p>
            <p>We received a request to reset your password for your InvoLuck account.</p>
            <p>Click the button below to reset your password:</p>
            <p><a href="${data.resetUrl}" class="button">Reset Password</a></p>
            <div class="warning">
              <p><strong>Important:</strong> This link will expire in ${data.expiresIn || '10 minutes'} for security reasons.</p>
            </div>
            <p>If you didn't request this password reset, please ignore this email and your password will remain unchanged.</p>
            <div class="footer">
              <p>Best regards,<br>The InvoLuck Team</p>
              <p>If you're having trouble clicking the button, copy and paste this URL into your browser: ${data.resetUrl}</p>
            </div>
          </div>
        </body>
      </html>
    `;
  }

  /**
   * Render welcome email template
   * TODO: Replace with Maizzle template rendering
   */
  private renderWelcomeTemplate(data: WelcomeEmailData): string {
    return `
      <!DOCTYPE html>
      <html>
        <head>
          <meta charset="utf-8">
          <title>Welcome to InvoLuck!</title>
          <style>
            body { font-family: Arial, sans-serif; line-height: 1.6; color: #333; }
            .container { max-width: 600px; margin: 0 auto; padding: 20px; }
            .button { display: inline-block; padding: 12px 24px; background: #007bff; color: white; text-decoration: none; border-radius: 4px; }
            .features { background: #f8f9fa; padding: 20px; border-radius: 8px; margin: 20px 0; }
            .footer { margin-top: 40px; padding-top: 20px; border-top: 1px solid #eee; font-size: 14px; color: #666; }
          </style>
        </head>
        <body>
          <div class="container">
            <h2>Welcome to InvoLuck!</h2>
            <p>Hello ${data.name},</p>
            <p>Welcome to InvoLuck! We're excited to have you on board.</p>
            <p>Your account has been successfully created with the email: <strong>${data.email}</strong></p>
            <div class="features">
              <h3>Getting Started:</h3>
              <ul>
                <li>Create and manage clients</li>
                <li>Generate professional invoices</li>
                <li>Track payments and due dates</li>
                <li>Send invoices via email</li>
              </ul>
            </div>
            <p>Ready to get started? Click the button below to log in:</p>
            <p><a href="${data.loginUrl}" class="button">Login to InvoLuck</a></p>
            <p>If you have any questions, don't hesitate to reach out to our support team.</p>
            <div class="footer">
              <p>Best regards,<br>The InvoLuck Team</p>
              <p>If you're having trouble clicking the button, copy and paste this URL into your browser: ${data.loginUrl}</p>
            </div>
          </div>
        </body>
      </html>
    `;
  }

  /**
   * Render invoice reminder email template
   */
  private renderInvoiceReminderTemplate(data: InvoiceCreatedEmailData & { daysOverdue?: number }): string {
    const isOverdue = data.daysOverdue && data.daysOverdue > 0;
    
    return `
      <!DOCTYPE html>
      <html>
        <head>
          <meta charset="utf-8">
          <title>${isOverdue ? 'Overdue' : 'Payment Reminder'}: Invoice ${data.invoiceNumber}</title>
          <style>
            body { font-family: Arial, sans-serif; line-height: 1.6; color: #333; }
            .container { max-width: 600px; margin: 0 auto; padding: 20px; }
            .invoice-details { background: #f8f9fa; padding: 20px; border-radius: 8px; margin: 20px 0; }
            .button { display: inline-block; padding: 12px 24px; background: ${isOverdue ? '#dc3545' : '#ffc107'}; color: ${isOverdue ? 'white' : '#212529'}; text-decoration: none; border-radius: 4px; }
            .amount { font-size: 24px; font-weight: bold; color: ${isOverdue ? '#dc3545' : '#ffc107'}; }
            .overdue { background: #f8d7da; border: 1px solid #f5c6cb; padding: 15px; border-radius: 4px; margin: 20px 0; color: #721c24; }
            .footer { margin-top: 40px; padding-top: 20px; border-top: 1px solid #eee; font-size: 14px; color: #666; }
          </style>
        </head>
        <body>
          <div class="container">
            <h2>${isOverdue ? 'Overdue Payment' : 'Payment Reminder'}</h2>
            <p>Dear ${data.clientName},</p>
            ${isOverdue 
              ? `<div class="overdue"><strong>This invoice is ${data.daysOverdue} days overdue.</strong> Please arrange payment as soon as possible.</div>`
              : '<p>This is a friendly reminder that the following invoice is due soon:</p>'
            }
            <div class="invoice-details">
              <p><strong>Invoice Number:</strong> ${data.invoiceNumber}</p>
              <p><strong>Amount:</strong> <span class="amount">${data.currency} ${data.amount}</span></p>
              <p><strong>Due Date:</strong> ${data.dueDate}</p>
            </div>
            <p>Please click the button below to view and pay your invoice:</p>
            <p><a href="${data.invoiceUrl}" class="button">${isOverdue ? 'Pay Now' : 'View Invoice'}</a></p>
            <p>Thank you for your prompt attention to this matter.</p>
            <div class="footer">
              <p>Best regards,<br>${data.companyName || 'The InvoLuck Team'}</p>
              <p>If you're having trouble clicking the button, copy and paste this URL into your browser: ${data.invoiceUrl}</p>
            </div>
          </div>
        </body>
      </html>
    `;
  }
}

export const mailService = new MailService();
export default mailService;
