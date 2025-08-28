import express from 'express';
import authRoute from './authRoutes.js';

const router = express.Router();

router.use('/auth', authRoute);
<<<<<<< HEAD
=======

/* router.use('/invoices', invoiceRoutes); */
>>>>>>> origin/asmakhokharr/eng-34-implement-user-authentication-api

/* router.use('/invoices', invoiceRoutes); */

router.use('*', (req, res) => {
  res.status(404).json({
    error: 'Route not found',
    message: `The route ${req.method} ${req.originalUrl} does not exist`,
  });
});

export default router;
