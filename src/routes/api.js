import express from 'express';
import authRoute from './authRoutes.js';

const router = express.Router();

router.use('/auth', authRoute);

/* router.use('/invoices', invoiceRoutes); */

router.use('*', (req, res) => {
  res.status(404).json({
    error: 'Route not found',
    message: `The route ${req.method} ${req.originalUrl} does not exist`,
  });
});

export default router;
