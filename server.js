import { config } from './src/config/environment.js';
import app from './src/app.js';

console.log(`
🚀 InvoLuck API Server Started
📍 Environment: ${config.nodeEnv}
📧 Email Service: ${config.email.isConfigured ? '✅ Configured' : '⚠ Disabled'}
🗄 Database: ${config.mongoUri ? '✅ Configured' : '⚠ Using Default'}
`);

export default app;