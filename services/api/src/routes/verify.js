import { Router } from 'express';
import { getSession } from '../dataStore.js';
import { hashCart, verifyPayload } from '../qr.js';

const router = Router();

router.post('/', (req, res) => {
  const { qrPayload } = req.body;
  if (!qrPayload) return res.status(400).json({ error: 'qrPayload required' });
  const valid = verifyPayload(qrPayload);
  if (!valid) return res.status(400).json({ status: 'red', reason: 'invalid signature' });
  const { sessionId, itemHash, exp } = qrPayload;
  if (Date.now() > exp) return res.status(400).json({ status: 'red', reason: 'qr expired' });
  const session = getSession(sessionId);
  if (!session) return res.status(404).json({ status: 'red', reason: 'session missing' });
  if (session.payment?.status !== 'paid') return res.status(400).json({ status: 'red', reason: 'payment not settled' });
  const currentHash = hashCart(session.items);
  const integrity = currentHash === itemHash;
  return res.json({
    status: integrity ? 'green' : 'red',
    integrity,
    sessionId,
    payment: session.payment,
    items: session.items
  });
});

export default router;
