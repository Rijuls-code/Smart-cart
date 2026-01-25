import { Router } from 'express';
import { ensureUser, listUserCoupons } from '../dataStore.js';

const router = Router();

router.get('/:userId', (req, res) => {
  const { userId } = req.params;
  ensureUser(userId);
  const items = listUserCoupons(userId).filter((c) => !c.used && (!c.expiresAt || c.expiresAt > Date.now()));
  return res.json({ items });
});

export default router;
