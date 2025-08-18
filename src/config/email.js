import { config } from './environment.js';

class EmailConfig {
    constructor() {
        this.apiKey = config.email.apiKey;
        this.fromEmail = config.email.fromEmail;
        this.adminEmail = config.email.adminEmail;

        // throttle config
        this.throttleTime = 15 * 60 * 1000;  // 15 minutes
        this.throttleTimeTest = 2 * 60 * 1000; // 2 minutes

    }

    isConfigured() {
        return !!(this.apiKey && this.fromEmail && this.adminEmail);
    }

}
export default new EmailConfig();