

import express from 'express';
import cors from 'cors';
import mongoose from 'mongoose';
import connectDB from './config/db.js';
    

const app = express();
const PORT = process.env.PORT || 5000;

// Middleware
app.use(cors());
app.use(express.json());
connectDB();

// API Routes
// We will import and use the routes from the 'routes' directory here
// import authRoutes from './routes/auth.js';
// import invoiceRoutes from './routes/invoices.js';
// import clientRoutes from './routes/clients.js';
// app.use('/api/auth', authRoutes);
// app.use('/api/invoices', invoiceRoutes);
// app.use('/api/clients', clientRoutes);

app.get('/', (req, res) => {
  res.send('InvoLuck API is running...');
});

app.listen(PORT, () => {
  console.log(`Server is running on port: ${PORT}`);
}); 