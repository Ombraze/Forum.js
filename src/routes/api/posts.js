import { Router } from 'express';
import { createPost, deletePost, listPosts } from '../../forum/posts.js';
import { requireAuth } from '../../middleware/auth.js';

const router = Router();

router.get('/', (req, res) => {
  try {
    const categoryId = req.query.category ? Number(req.query.category) : null;
    const posts = listPosts(categoryId || null).map((p) => ({
      id: p.id,
      title: p.title,
      content: p.content,
      author: p.author,
      userId: p.user_id,
      createdAt: p.created_at,
      categories: p.categories ? p.categories.split(', ') : [],
    }));
    res.json({ posts });
  } catch (err) {
    console.error('erreur list posts:', err);
    res.status(500).json({ error: 'Erreur serveur' });
  }
});

router.post('/', requireAuth, (req, res) => {
  const { title, content, categoryIds, categoryNames } = req.body ?? {};

  try {
    const postId = createPost(req.user.id, title, content, categoryIds, categoryNames);
    res.status(201).json({ id: postId, message: 'Post créé' });
  } catch (err) {
    const messages = {
      INVALID: 'Titre et contenu requis.',
      NO_CATEGORY: 'Sélectionnez ou proposez au moins une catégorie.',
      INVALID_CATEGORY: 'Catégorie invalide.',
    };
    res.status(400).json({ error: messages[err.code] ?? 'Erreur lors de la création' });
  }
});

router.delete('/:id', requireAuth, (req, res) => {
  const postId = Number(req.params.id);

  try {
    deletePost(postId, req.user.id);
    res.json({ message: 'Publication supprimée' });
  } catch (err) {
    const status = err.code === 'NOT_FOUND' ? 404 : err.code === 'FORBIDDEN' ? 403 : 400;
    const messages = {
      NOT_FOUND: 'Publication introuvable.',
      FORBIDDEN: 'Vous ne pouvez supprimer que vos propres publications.',
    };
    res.status(status).json({ error: messages[err.code] ?? 'Erreur lors de la suppression' });
  }
});

export default router;
