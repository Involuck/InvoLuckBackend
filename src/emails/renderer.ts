/**
 * Email template renderer for InvoLuck Backend
 * Handles compilation and rendering of Maizzle email templates
 */

import fs from 'fs/promises';
import path from 'path';
import { isDevelopment } from '../config/env';
import logger from '../config/logger';
import { ApiErrors } from '../utils/ApiError';

// Template data interface
export interface TemplateData {
  [key: string]: any;
}

// Renderer class
class EmailRenderer {
  private readonly templatesPath: string;
  private readonly compiledPath: string;

  constructor() {
    this.templatesPath = path.resolve(__dirname, 'maizzle/src/templates');
    this.compiledPath = path.resolve(__dirname, 'compiled');
  }

  /**
   * Render email template with data
   * In development: reads and compiles template on-the-fly
   * In production: reads pre-compiled template
   */
  async renderTemplate(templateName: string, data: TemplateData = {}): Promise<string> {
    try {
      if (isDevelopment()) {
        return await this.renderDevelopmentTemplate(templateName, data);
      } else {
        return await this.renderProductionTemplate(templateName, data);
      }
    } catch (error) {
      logger.error({
        msg: 'Failed to render email template',
        templateName,
        error: error instanceof Error ? error.message : 'Unknown error',
      });
      throw ApiErrors.internal(`Failed to render email template: ${templateName}`);
    }
  }

  /**
   * Render template in development mode
   * TODO: Implement Maizzle compilation
   */
  private async renderDevelopmentTemplate(templateName: string, data: TemplateData): Promise<string> {
    logger.debug({
      msg: 'Rendering development template (stub)',
      templateName,
      dataKeys: Object.keys(data),
    });

    // TODO: Implement Maizzle compilation
    // This would involve:
    // 1. Reading the template file
    // 2. Processing with Maizzle compiler
    // 3. Injecting data variables
    // 4. Returning compiled HTML

    // For now, return a simple template
    return this.getFallbackTemplate(templateName, data);
  }

  /**
   * Render pre-compiled template in production
   */
  private async renderProductionTemplate(templateName: string, data: TemplateData): Promise<string> {
    const templatePath = path.join(this.compiledPath, `${templateName}.html`);

    try {
      // Check if compiled template exists
      await fs.access(templatePath);
      
      // Read compiled template
      let html = await fs.readFile(templatePath, 'utf-8');
      
      // Replace variables (simple string replacement for now)
      // TODO: Implement proper template variable replacement
      html = this.replaceVariables(html, data);
      
      logger.debug({
        msg: 'Rendered production template',
        templateName,
        templatePath,
      });

      return html;
    } catch (error) {
      logger.warn({
        msg: 'Compiled template not found, using fallback',
        templateName,
        templatePath,
      });
      
      // Fallback to development rendering or simple template
      return this.getFallbackTemplate(templateName, data);
    }
  }

  /**
   * Simple variable replacement in HTML
   * TODO: Replace with proper template engine
   */
  private replaceVariables(html: string, data: TemplateData): string {
    let result = html;

    // Replace simple variables like {{ variable }}
    const variableRegex = /\{\{\s*([^}]+)\s*\}\}/g;
    
    result = result.replace(variableRegex, (match, variable) => {
      const trimmedVariable = variable.trim();
      
      // Handle nested object access (e.g., user.name)
      const value = this.getNestedValue(data, trimmedVariable);
      
      if (value !== undefined && value !== null) {
        return String(value);
      }
      
      // Return empty string if variable not found
      return '';
    });

    return result;
  }

  /**
   * Get nested object value using dot notation
   */
  private getNestedValue(obj: any, path: string): any {
    return path.split('.').reduce((current, key) => {
      return current && current[key] !== undefined ? current[key] : undefined;
    }, obj);
  }

  /**
   * Generate fallback template when compiled version is not available
   */
  private getFallbackTemplate(templateName: string, data: TemplateData): string {
    switch (templateName) {
      case 'invitation':
        return this.getInvitationFallback(data);
      case 'invoice-created':
        return this.getInvoiceCreatedFallback(data);
      default:
        return this.getGenericFallback(templateName, data);
    }
  }

  /**
   * Fallback invitation template
   */
  private getInvitationFallback(data: TemplateData): string {
    return `
      <!DOCTYPE html>
      <html>
        <head>
          <meta charset="utf-8">
          <title>Invitation to ${data.companyName || 'InvoLuck'}</title>
          <style>
            body { font-family: Arial, sans-serif; line-height: 1.6; color: #333; margin: 0; padding: 20px; }
            .container { max-width: 600px; margin: 0 auto; background: #fff; padding: 40px; border-radius: 8px; box-shadow: 0 2px 4px rgba(0,0,0,0.1); }
            .header { text-align: center; margin-bottom: 30px; padding-bottom: 20px; border-bottom: 1px solid #eee; }
            .button { display: inline-block; padding: 15px 30px; background: #2563eb; color: white; text-decoration: none; border-radius: 5px; font-weight: bold; }
            .footer { margin-top: 30px; padding-top: 20px; border-top: 1px solid #eee; font-size: 14px; color: #666; }
          </style>
        </head>
        <body style="background-color: #f5f5f5;">
          <div class="container">
            <div class="header">
              <h1>You're Invited!</h1>
              <p>Join ${data.companyName || 'InvoLuck'} on InvoLuck</p>
            </div>
            
            <h2>Hello ${data.name || 'there'},</h2>
            
            <p>You've been invited to join <strong>${data.companyName || 'InvoLuck'}</strong> on InvoLuck, our invoice management platform.</p>
            
            <p style="text-align: center; margin: 30px 0;">
              <a href="${data.inviteUrl || '#'}" class="button">Accept Invitation</a>
            </p>
            
            <p>This invitation will expire in ${data.expiresIn || '7 days'}.</p>
            
            <div class="footer">
              <p>Best regards,<br>The InvoLuck Team</p>
            </div>
          </div>
        </body>
      </html>
    `;
  }

  /**
   * Fallback invoice created template
   */
  private getInvoiceCreatedFallback(data: TemplateData): string {
    return `
      <!DOCTYPE html>
      <html>
        <head>
          <meta charset="utf-8">
          <title>New Invoice ${data.invoiceNumber || ''}</title>
          <style>
            body { font-family: Arial, sans-serif; line-height: 1.6; color: #333; margin: 0; padding: 20px; }
            .container { max-width: 600px; margin: 0 auto; background: #fff; padding: 40px; border-radius: 8px; box-shadow: 0 2px 4px rgba(0,0,0,0.1); }
            .header { text-align: center; margin-bottom: 30px; padding-bottom: 20px; border-bottom: 1px solid #eee; }
            .invoice-details { background: #f8f9fa; padding: 20px; border-radius: 5px; margin: 20px 0; }
            .amount { font-size: 24px; font-weight: bold; color: #28a745; }
            .button { display: inline-block; padding: 15px 30px; background: #28a745; color: white; text-decoration: none; border-radius: 5px; font-weight: bold; }
            .footer { margin-top: 30px; padding-top: 20px; border-top: 1px solid #eee; font-size: 14px; color: #666; }
          </style>
        </head>
        <body style="background-color: #f5f5f5;">
          <div class="container">
            <div class="header">
              <h1>New Invoice</h1>
              <p>From ${data.companyName || 'InvoLuck'}</p>
            </div>
            
            <h2>Dear ${data.clientName || 'Valued Customer'},</h2>
            
            <p>A new invoice has been created for you. Here are the details:</p>
            
            <div class="invoice-details">
              <p><strong>Invoice Number:</strong> ${data.invoiceNumber || 'N/A'}</p>
              <p><strong>Amount:</strong> <span class="amount">${data.currency || ''} ${data.amount || '0'}</span></p>
              <p><strong>Due Date:</strong> ${data.dueDate || 'N/A'}</p>
            </div>
            
            <p style="text-align: center; margin: 30px 0;">
              <a href="${data.invoiceUrl || '#'}" class="button">View Invoice</a>
            </p>
            
            <p>Thank you for your business!</p>
            
            <div class="footer">
              <p>Best regards,<br>${data.companyName || 'The InvoLuck Team'}</p>
            </div>
          </div>
        </body>
      </html>
    `;
  }

  /**
   * Generic fallback template
   */
  private getGenericFallback(templateName: string, data: TemplateData): string {
    return `
      <!DOCTYPE html>
      <html>
        <head>
          <meta charset="utf-8">
          <title>Email from InvoLuck</title>
          <style>
            body { font-family: Arial, sans-serif; line-height: 1.6; color: #333; margin: 0; padding: 20px; }
            .container { max-width: 600px; margin: 0 auto; background: #fff; padding: 40px; border-radius: 8px; box-shadow: 0 2px 4px rgba(0,0,0,0.1); }
          </style>
        </head>
        <body style="background-color: #f5f5f5;">
          <div class="container">
            <h1>Email from InvoLuck</h1>
            <p>This is a placeholder email template for: <strong>${templateName}</strong></p>
            <p>The email system is working, but the specific template needs to be compiled.</p>
            <p>Template data keys: ${Object.keys(data).join(', ')}</p>
          </div>
        </body>
      </html>
    `;
  }

  /**
   * Check if template exists
   */
  async templateExists(templateName: string): Promise<boolean> {
    try {
      const templatePath = isDevelopment()
        ? path.join(this.templatesPath, `${templateName}.html`)
        : path.join(this.compiledPath, `${templateName}.html`);
      
      await fs.access(templatePath);
      return true;
    } catch {
      return false;
    }
  }

  /**
   * Get available templates
   */
  async getAvailableTemplates(): Promise<string[]> {
    try {
      const basePath = isDevelopment() ? this.templatesPath : this.compiledPath;
      const files = await fs.readdir(basePath);
      
      return files
        .filter(file => file.endsWith('.html'))
        .map(file => file.replace('.html', ''));
    } catch {
      return ['invitation', 'invoice-created']; // Fallback list
    }
  }
}

// Export singleton instance
export const emailRenderer = new EmailRenderer();
export default emailRenderer;
