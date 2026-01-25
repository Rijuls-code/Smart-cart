import { Router } from 'express';
import { config } from '../config.js';
import {
  calculateCartTotal,
  createSession,
  ensureUser,
  getSession,
  getUser,
  listSessions,
  listUserCoupons,
  setUserCoupons,
  updateSession,
  updateUser
} from '../dataStore.js';
import { hashCart, signPayload } from '../qr.js';

const router = Router();

router.post('/', (req, res) => {
  const { storeId } = req.body;
  const userId = req.header('x-user-id') || 'demo-user';
  if (!storeId) return res.status(400).json({ error: 'storeId required' });
  const session = createSession({ userId, storeId });
  return res.json(session);
});

router.get('/', (_req, res) => {
  return res.json({ items: listSessions() });
});

router.get('/:id', (req, res) => {
  const session = getSession(req.params.id);
  if (!session) return res.status(404).json({ error: 'session not found' });
  return res.json(session);
});

router.post('/:id/scan', (req, res) => {
  const { barcode, name, price, taxRate = 0, qty = 1 } = req.body;
  if (!barcode || !price) return res.status(400).json({ error: 'barcode and price required' });
  const updated = updateSession(req.params.id, (session) => {
    if (session.status !== 'active') return session;
    const existing = session.items.find((i) => i.barcode === barcode);
    if (existing) {
      existing.qty += qty;
    } else {
      session.items.push({ barcode, name, price, taxRate, qty });
    }
    return session;
  });
  if (!updated) return res.status(404).json({ error: 'session not found' });
  return res.json(updated);
});

router.delete('/:id/item/:barcode', (req, res) => {
  const { id, barcode } = req.params;
  const updated = updateSession(id, (session) => {
    session.items = session.items.filter((i) => i.barcode !== barcode);
    return session;
  });
  if (!updated) return res.status(404).json({ error: 'session not found' });
  return res.json(updated);
});

router.post('/:id/pay', (req, res) => {
  const { paymentRef = 'demo-payment', couponCode = '', creditsToUse = 0 } = req.body;
  const session = getSession(req.params.id);
  if (!session) return res.status(404).json({ error: 'session not found' });
  if (session.payment?.status === 'paid') {
    return res.json({ session, payment: session.payment, user: ensureUser(session.userId) });
  }

  const userId = session.userId;
  const user = ensureUser(userId) || getUser(userId);
  const total = calculateCartTotal(session.items);

  const availableCoupons = listUserCoupons(userId);
  const coupon = availableCoupons.find((c) => c.code === couponCode && !c.used && (!c.expiresAt || c.expiresAt > Date.now()));
  const couponDiscount = coupon
    ? Math.min(coupon.type === 'percent' ? total * coupon.value : coupon.value, total)
    : 0;

  const creditsAvailable = user?.credits || 0;
  const creditsUsed = Math.max(0, Math.min(Number(creditsToUse) || 0, creditsAvailable, total - couponDiscount));
  const payable = Math.max(total - couponDiscount - creditsUsed, 0);
  const cashback = Math.round(payable * 0.02 * 100) / 100;
  const rounded = Math.ceil(payable / 10) * 10;
  const piggySavings = Math.round(Math.max(0, rounded - payable) * 100) / 100;

  const updated = updateSession(req.params.id, (current) => {
    current.payment = {
      status: 'paid',
      ref: paymentRef,
      paidAt: Date.now(),
      total,
      couponCode: coupon?.code || null,
      couponDiscount,
      creditsUsed,
      finalPayableAmount: payable,
      cashback,
      piggySavings
    };
    current.status = 'locked';
    return current;
  });

  if (coupon) {
    const updatedCoupons = availableCoupons.map((c) => (c.code === coupon.code ? { ...c, used: true, usedAt: Date.now() } : c));
    setUserCoupons(userId, updatedCoupons);
  }

  const updatedUser = updateUser(userId, (u) => {
    const remainingCredits = (u.credits || 0) - creditsUsed;
    return {
      ...u,
      credits: Math.max(0, remainingCredits + cashback),
      piggyBank: (u.piggyBank || 0) + piggySavings
    };
  });

  return res.json({ session: updated, payment: updated?.payment, user: updatedUser });
});

router.post('/:id/qr', (req, res) => {
  const session = getSession(req.params.id);
  if (!session) return res.status(404).json({ error: 'session not found' });
  if (session.payment?.status !== 'paid') return res.status(400).json({ error: 'payment not verified' });
  const cartHash = hashCart(session.items);
  const payload = {
    sessionId: session.id,
    total: session.items.reduce((acc, i) => acc + i.price * i.qty * (1 + i.taxRate), 0),
    itemHash: cartHash,
    ts: Date.now(),
    exp: Date.now() + config.qrExpirySeconds * 1000
  };
  const signed = signPayload(payload);
  return res.json({ qrPayload: signed });
});

export default router;
