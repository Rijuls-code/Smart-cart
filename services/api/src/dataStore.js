import { v4 as uuid } from 'uuid';

const stores = [{ id: 'store-1', name: 'Demo Store', taxes: 0.08 }];
const products = new Map();
const sessions = new Map();
const users = new Map();
const coupons = new Map();

function seedProducts() {
  const demo = [
    { barcode: '12345', name: 'Milk 1L', price: 60, taxRate: 0.05 },
    { barcode: '67890', name: 'Bread', price: 40, taxRate: 0.05 },
    { barcode: '54321', name: 'Eggs (12)', price: 80, taxRate: 0.05 }
  ];
  demo.forEach((p) => products.set(p.barcode, { ...p, stock: 100 }));
}
seedProducts();

function seedUsers() {
  const defaultUser = { id: 'demo-user', credits: 120, piggyBank: 40 };
  users.set(defaultUser.id, defaultUser);
  coupons.set(defaultUser.id, [
    { code: 'SAVE10', label: '10% off any bill', type: 'percent', value: 0.1, used: false, expiresAt: Date.now() + 1000 * 60 * 60 * 24 * 14 },
    { code: 'FLAT25', label: '₹25 off once', type: 'flat', value: 25, used: false, expiresAt: Date.now() + 1000 * 60 * 60 * 24 * 30 }
  ]);
}
seedUsers();

export function getStores() {
  return stores;
}

export function listProducts() {
  return Array.from(products.values());
}

export function upsertProduct(prod) {
  products.set(prod.barcode, { ...prod });
  return products.get(prod.barcode);
}

export function deleteProduct(barcode) {
  const existing = products.get(barcode);
  if (!existing) return null;
  products.delete(barcode);
  return existing;
}

export function createSession({ userId, storeId }) {
  ensureUser(userId);
  const id = uuid();
  const session = {
    id,
    userId,
    storeId,
    status: 'active',
    items: [],
    payment: { status: 'pending' },
    createdAt: Date.now(),
    updatedAt: Date.now()
  };
  sessions.set(id, session);
  return session;
}

export function getSession(id) {
  return sessions.get(id);
}

export function listSessions() {
  return Array.from(sessions.values());
}

export function updateSession(id, updater) {
  const session = sessions.get(id);
  if (!session) return null;
  const next = updater({ ...session });
  next.updatedAt = Date.now();
  sessions.set(id, next);
  return next;
}

export function ensureUser(id) {
  if (users.has(id)) return users.get(id);
  const fresh = { id, credits: 0, piggyBank: 0 };
  users.set(id, fresh);
  return fresh;
}

export function getUser(id) {
  return users.get(id) || null;
}

export function updateUser(id, updater) {
  const user = users.get(id);
  if (!user) return null;
  const next = updater({ ...user });
  users.set(id, next);
  return next;
}

export function listUserCoupons(userId) {
  return coupons.get(userId) || [];
}

export function setUserCoupons(userId, list) {
  coupons.set(userId, list);
  return list;
}

export function calculateCartTotal(items = []) {
  return items.reduce((acc, i) => acc + i.price * i.qty * (1 + (i.taxRate || 0)), 0);
}
