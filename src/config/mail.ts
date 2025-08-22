/**
 * Email configuration for InvoLuck Backend
 * Nodemailer setup for SMTP email delivery
 */

import nodemailer from 'nodemailer';
import { SMTP_HOST, SMTP_PORT, SMTP_USER, SMTP_PASS, SMTP_FROM, isDevelopment } from './env';
import logger from './logger';

// Email transporter configuration
const createTransporter = (): nodemailer.Transporter => {
  const config: any = {
    host: SMTP_HOST,
    port: SMTP_PORT,
    secure: SMTP_PORT === 465, // true for 465, false for other ports
  };

  // Add authentication if credentials are provided
  if (SMTP_USER && SMTP_PASS) {
    config.auth = {
      user: SMTP_USER,
      pass: SMTP_PASS,
    };
  }

  // Development specific settings
  if (isDevelopment()) {
    config.debug = true;
    config.logger = true;
  }

  return nodemailer.createTransporter(config);
};

// Create transporter instance
export const mailTransporter = createTransporter();

// Email sending interface
export interface EmailOptions {
  to: string | string[];
  subject: string;
  html?: string;
  text?: string;
  from?: string;
  cc?: string | string[];
  bcc?: string | string[];
  attachments?: Array<{
    filename: string;
    content: Buffer | string;
    contentType?: string;
  }>;
}

/**
 * Send email using configured transporter
 */
export const sendMail = async (options: EmailOptions): Promise<void> => {
  try {
    const mailOptions = {
      from: options.from || SMTP_FROM,
      to: Array.isArray(options.to) ? options.to.join(', ') : options.to,
      cc: options.cc ? (Array.isArray(options.cc) ? options.cc.join(', ') : options.cc) : undefined,
      bcc: options.bcc ? (Array.isArray(options.bcc) ? options.bcc.join(', ') : options.bcc) : undefined,
      subject: options.subject,
      html: options.html,
      text: options.text,
      attachments: options.attachments,
    };

    const info = await mailTransporter.sendMail(mailOptions);

    logger.info({
      msg: 'Email sent successfully',
      messageId: info.messageId,
      to: options.to,
      subject: options.subject,
      preview: isDevelopment() ? nodemailer.getTestMessageUrl(info) : undefined,
    });
  } catch (error) {
    logger.error({
      msg: 'Failed to send email',
      error: error instanceof Error ? error.message : 'Unknown error',
      to: options.to,
      subject: options.subject,
    });
    throw error;
  }
};

/**
 * Verify email transporter configuration
 */
export const verifyMailConfig = async (): Promise<boolean> => {
  try {
    await mailTransporter.verify();
    logger.info({
      msg: 'Mail transporter configuration verified',
      host: SMTP_HOST,
      port: SMTP_PORT,
      hasAuth: !!(SMTP_USER && SMTP_PASS),
    });
    return true;
  } catch (error) {
    logger.error({
      msg: 'Mail transporter configuration failed',
      error: error instanceof Error ? error.message : 'Unknown error',
      host: SMTP_HOST,
      port: SMTP_PORT,
    });
    return false;
  }
};

// Export default configuration
export default {
  transporter: mailTransporter,
  sendMail,
  verifyConfig: verifyMailConfig,
};
