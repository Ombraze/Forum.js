import { Router } from 'express';
import { createComment, listComments } from '../../forum/comments.js';
import { createPost, deletePost, getPostById, getPostDetail, listPosts } from '../../forum/posts.js';
import { getCommentReactionSummaries, getPostReactionSummary, setPostReaction } from '../../forum/reactions.js';
import { optionalAuth, requireAuth } from '../../middleware/auth.js';

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

router.get('/:id/comments', optionalAuth, (req, res) => {
  const postId = Number(req.params.id);
  if (!postId) {
    return res.status(400).json({ error: 'Identifiant invalide.' });
  }
  if (!getPostById(postId)) {
    return res.status(404).json({ error: 'Publication introuvable.' });
  }

  try {
    const rows = listComments(postId);
    const reactionMap = getCommentReactionSummaries(
      rows.map((c) => c.id),
      req.user?.id,
    );
    const comments = rows.map((c) => ({
      id: c.id,
      content: c.content,
      author: c.author,
      userId: c.user_id,
      createdAt: c.created_at,
      reactions: reactionMap[c.id] ?? { likes: 0, dislikes: 0, userReaction: null },
    }));
    res.json({ comments });
  } catch (err) {
    console.error('erreur list comments:', err);
    res.status(500).json({ error: 'Erreur serveur' });
  }
});

router.post('/:id/comments', requireAuth, (req, res) => {
  const postId = Number(req.params.id);
  const { content } = req.body ?? {};

  try {
    const commentId = createComment(postId, req.user.id, content);
    res.status(201).json({ id: commentId, message: 'Commentaire ajouté' });
  } catch (err) {
    const status = err.code === 'NOT_FOUND' ? 404 : 400;
    const messages = {
      INVALID: 'Le commentaire ne peut pas être vide.',
      NOT_FOUND: 'Publication introuvable.',
    };
    res.status(status).json({ error: messages[err.code] ?? 'Erreur lors de l\'ajout' });
  }
});

router.post('/:id/reactions', requireAuth, (req, res) => {
  const postId = Number(req.params.id);
  const value = Number(req.body?.value);

  try {
    const reactions = setPostReaction(postId, req.user.id, value);
    res.json({ reactions });
  } catch (err) {
    const status = err.code === 'NOT_FOUND' ? 404 : 400;
    const messages = {
      NOT_FOUND: 'Publication introuvable.',
      INVALID: 'Réaction invalide.',
    };
    res.status(status).json({ error: messages[err.code] ?? 'Erreur serveur' });
  }
});

router.get('/:id', optionalAuth, (req, res) => {
  const postId = Number(req.params.id);
  if (!postId) {
    return res.status(400).json({ error: 'Identifiant invalide.' });
  }

  try {
    const p = getPostDetail(postId);
    if (!p) {
      return res.status(404).json({ error: 'Publication introuvable.' });
    }

    res.json({
      post: {
        id: p.id,
        title: p.title,
        content: p.content,
        author: p.author,
        userId: p.user_id,
        createdAt: p.created_at,
        categories: p.categories ? p.categories.split(', ') : [],
        reactions: getPostReactionSummary(postId, req.user?.id),
      },
    });
  } catch (err) {
    console.error('erreur get post:', err);
    res.status(500).json({ error: 'Erreur serveur' });
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
