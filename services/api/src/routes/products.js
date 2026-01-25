import { Router } from 'express';
import { deleteProduct, listProducts, upsertProduct } from '../dataStore.js';

const router = Router();

router.get('/', (_req, res) => {
  return res.json({ items: listProducts() });
});

router.post('/', (req, res) => {
  const { barcode, name, price, taxRate = 0, stock = 0 } = req.body;
  if (!barcode || !name || price == null) {
    return res.status(400).json({ error: 'barcode, name, price required' });
  }
  const saved = upsertProduct({ barcode, name, price, taxRate, stock });
  return res.json(saved);
});

router.delete('/:barcode', (req, res) => {
  const removed = deleteProduct(req.params.barcode);
  if (!removed) {
    return res.status(404).json({ error: 'product not found' });
  }
  return res.json({ deleted: true });
});

export default router;
