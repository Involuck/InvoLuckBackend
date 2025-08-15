import dotenv from 'dotenv';
import { validateEnvironment } from './src/config/environment.js';
import app from './src/app.js';

dotenv.config();

validateEnvironment();

const PORT = process.env.PORT || 5000;

if (process.env.NODE_ENV !== 'production') {
  app.listen(PORT, () => {
    console.log(`✅ Server running on port ${PORT}`);
    console.log(`🌐 Environment: ${process.env.NODE_ENV || 'development'}`);
    console.log(`🔗 URL: http://localhost:${PORT}`);
  });
}