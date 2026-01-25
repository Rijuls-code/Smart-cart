import express from 'express';
import cors from 'cors';
import { config } from './config.js';
import sessionRoutes from './routes/sessions.js';
import productRoutes from './routes/products.js';
import verifyRoutes from './routes/verify.js';
import userRoutes from './routes/users.js';
import userCouponRoutes from './routes/userCoupons.js';
import visionRoutes from './routes/vision.js';

const app = express();
app.use(cors());
app.use(express.json({ limit: '8mb' }));

app.get('/health', (_req, res) => res.json({ ok: true }));
app.use('/sessions', sessionRoutes);
app.use('/products', productRoutes);
app.use('/verify-qr', verifyRoutes);
app.use('/users', userRoutes);
app.use('/user-coupons', userCouponRoutes);
app.use('/vision', visionRoutes);

app.use((err, _req, res, _next) => {
  console.error(err);
  res.status(500).json({ error: 'internal error' });
});

app.listen(config.port, () => {
  console.log(`API listening on ${config.port}`);
});
