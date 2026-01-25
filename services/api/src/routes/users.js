import { Router } from 'express';
import { ensureUser, getUser } from '../dataStore.js';

const router = Router();

router.get('/:id', (req, res) => {
  const userId = req.params.id;
  const user = getUser(userId) || ensureUser(userId);
  return res.json(user);
});

export default router;
