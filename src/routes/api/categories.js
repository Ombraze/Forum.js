import { Router } from 'express';
import { listCategories } from '../../forum/categories.js';

const router = Router();

// GET /api/categories — liste toutes les catégories
router.get('/', (_req, res) => {
  try {
    const categories = listCategories();
    res.json({ categories });
  } catch (err) {
    console.error('erreur list categories:', err);
    res.status(500).json({ error: 'Erreur serveur' });
  }
});

export default router;
