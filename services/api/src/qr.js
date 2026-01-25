import crypto from 'crypto';
import { config } from './config.js';

export function hashCart(items) {
  const normalized = items
    .slice()
    .sort((a, b) => a.barcode.localeCompare(b.barcode))
    .map((i) => `${i.barcode}:${i.qty}:${i.price}`)
    .join('|');
  return crypto.createHash('sha256').update(normalized).digest('hex');
}

export function signPayload(payload) {
  const hmac = crypto
    .createHmac('sha256', config.qrSecret)
    .update(JSON.stringify(payload))
    .digest('hex');
  return { ...payload, sig: hmac };
}

export function verifyPayload(payload) {
  const { sig, ...rest } = payload;
  const hmac = crypto
    .createHmac('sha256', config.qrSecret)
    .update(JSON.stringify(rest))
    .digest('hex');
  return hmac === sig;
}
