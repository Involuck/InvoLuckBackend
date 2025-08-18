import { config } from './src/config/environment.js';
import app from './src/app.js';

const server = app.listen(config.port, () => {
  console.log(`
🚀 InvoLuck API Server Started
📍 Environment: ${config.nodeEnv}
🌐 Port: ${config.port}
🔗 URL: http://localhost:${config.port}
📊 Health Check: http://localhost:${config.port}/health-check
📧 Email Service: ${config.email.isConfigured ? '✅ Configured' : '⚠️  Disabled'}
🗄️  Database: ${config.mongoUri ? '✅ Configured' : '⚠️  Using Default'}
    `);

  if (config.nodeEnv !== 'production') {
    console.log(`
🛠️  Development Endpoints:
   • GET  /dev-info           - Development information
   • GET  /test-email         - Test email sending
   • GET  /throttle-status    - Throttle status
   • GET  /clear-throttles    - Clear throttles
        `);
  }
});


export default server;