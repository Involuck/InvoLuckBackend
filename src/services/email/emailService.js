import path from 'path';
import fs from 'fs/promises';
import { Resend } from 'resend';
import config from '../../config/email.js';
import { emailTemplates } from './emailTemplates.js';
import { generatePlainText } from './helpers/textGenerator.js';

class EmailService {
    constructor() {
        this.config = config;
        this.resend = null;
        this.errorThrottle = new Map();
        this.initialized = false;

        this.initializeResend();
    }

    initializeResend() {
        if (!this.config.isConfigured()) {
            console.warn('⚠️  Email service not configured - email notifications will be disabled');
            return;
        }

        try {
            this.resend = new Resend(this.config.apiKey);
            this.initialized = true;
            console.log('✅ Email service initialized successfully');
        } catch (error) {
            console.error('❌ Failed to initialize email service:', error.message);
            this.initialized = false;
        }
    }

    async loadTemplate(templateName, replacements) {
        try {
            let content = await fs.readFile(
                path.join(process.cwd(), 'src', 'services', 'email', 'templates', `${templateName}.html`),
                'utf-8'
            );

            for (const [key, value] of Object.entries(replacements)) {
                const regex = new RegExp(`{{${key}}}`, 'g');
                content = content.replace(regex, value || '');
            }

            return content;
        } catch (error) {
            console.warn(`⚠️  Template not found: ${templateName}`);
            return `<p>Template not found: ${templateName}</p>`;
        }
    }

    async sendEmail(type, data) {
        if (!this.isConfigured() || !this.initialized) {
            return {
                success: false,
                error: 'Email service not configured or initialized',
                message: 'Email service is not available'
            };
        }

        // verify throttle
        const errorKey = this.getErrorKey(type, data);
        const throttleInfo = this.shouldThrottleError(errorKey, type);

        if (throttleInfo.throttled) {
            const waitTimeMinutes = Math.ceil(throttleInfo.waitMs / (1000 * 60));
            const waitTimeSeconds = Math.ceil(throttleInfo.waitMs / 1000);

            console.log(`📧 Email throttled for ${type} - wait ${waitTimeSeconds}s`);

            return {
                success: false,
                throttled: true,
                waitMs: throttleInfo.waitMs,
                waitTimeMinutes,
                waitTimeSeconds,
                message: `You must wait ${waitTimeMinutes} minute(s) before sending another ${type} email. Try again in ${waitTimeSeconds} seconds.`,
                nextAllowedTime: new Date(Date.now() + throttleInfo.waitMs).toISOString()
            };
        }

        try {
            const { templateName, getReplacements, subject } = await emailTemplates[type](data);
            const replacements = getReplacements(data);
            const html = await this.loadTemplate(templateName, replacements);

            const result = await this.resend.emails.send({
                from: this.config.fromEmail,
                to: [this.config.adminEmail],
                subject,
                html,
                text: generatePlainText(type, data)
            });

            console.log(`✅ ${type} email sent successfully:`, result.data?.id);

            this.updateThrottle(errorKey);

            return {
                success: true,
                emailId: result.data?.id,
                message: `${type} email sent successfully`
            };
        } catch (err) {
            console.error(`❌ Error sending email [${type}]:`, err.message);
            return {
                success: false,
                error: err.message,
                message: `Failed to send ${type} email: ${err.message}`
            };
        }
    }

    async sendDatabaseErrorEmail(dbError, connectionInfo) {
        return this.sendEmail('database', { dbError, connectionInfo });
    }

    async sendRecoveryEmail(recoveryInfo) {
        return this.sendEmail('recovery', recoveryInfo);
    }

    async sendTestEmail(timestamp, environment) {
        return this.sendEmail('testEmail', { timestamp, environment });
    }

    getErrorKey(type, data) {
        switch (type) {
            case 'database':
                return `database-${data.dbError?.name || 'connection'}`;

            case 'testEmail':
                return 'testEmail';

            case 'recovery':
                return 'recovery';

            default:
                return `${type}-error`;
        }
    }

    shouldThrottleError(errorKey, type) {
        const lastSent = this.errorThrottle.get(errorKey);

        let throttleTime;
        switch (type) {
            case 'testEmail':
                throttleTime = this.config.throttleTimeTest; // 2 minutes
                break;
            case 'database':
            case 'recovery':
                throttleTime = this.config.throttleTime; // 15 minutes
                break;
            default:
                throttleTime = this.config.throttleTime; // default to 15 minutes
        }

        if (!lastSent) {
            return { throttled: false, waitMs: 0 };
        }

        const elapsed = Date.now() - lastSent;

        if (elapsed < throttleTime) {
            const waitMs = throttleTime - elapsed;
            return {
                throttled: true,
                waitMs,
                lastSent: new Date(lastSent).toISOString(),
                throttleTimeMs: throttleTime
            };
        }

        return { throttled: false, waitMs: 0 };
    }

    updateThrottle(errorKey) {
        const timestamp = Date.now();
        this.errorThrottle.set(errorKey, timestamp);

        console.log(`🕒 Throttle updated for key: ${errorKey} at ${new Date(timestamp).toISOString()}`);
    }

    // method to check throttle status without sending email
    getThrottleStatus(type, data) {
        const errorKey = this.getErrorKey(type, data);
        return this.shouldThrottleError(errorKey, type);
    }

    // method to clean up old throttles
    cleanOldThrottles() {
        const now = Date.now();
        const maxAge = Math.max(this.config.throttleTime, this.config.throttleTimeTest);

        for (const [key, timestamp] of this.errorThrottle.entries()) {
            if (now - timestamp > maxAge) {
                this.errorThrottle.delete(key);
            }
        }
    }

    formatErrorDetails(error, context) {
        return {
            name: error.name,
            message: error.message,
            stack: error.stack,
            timestamp: new Date().toISOString(),
            environment: process.env.NODE_ENV || 'development',
            nodeVersion: process.version,
            uptime: Math.floor(process.uptime()),
            memoryUsage: process.memoryUsage(),
            context,
            url: context.req?.originalUrl || 'N/A',
            method: context.req?.method || 'N/A',
            userAgent: context.req?.get('User-Agent') || 'N/A',
            ip: context.req?.ip || 'N/A'
        };
    }

    isConfigured() {
        return this.config.isConfigured();
    }
}

export default new EmailService();