import { Router } from 'express';
import { createComment, listComments } from '../../forum/comments.js';
import { createPost, deletePost, getPostById, getPostCategoryIds, getPostDetail, listPosts, updatePost } from '../../forum/posts.js';
import { getCommentReactionSummaries, getPostReactionSummary, setPostReaction } from '../../forum/reactions.js';
import { optionalAuth, requireAuth } from '../../middleware/auth.js';

const router = Router();

// GET /api/posts — liste les posts (avec filtres optionnels)
router.get('/', optionalAuth, (req, res) => {
  try {
    const categoryId = req.query.category ? Number(req.query.category) : null;
    // Les filtres mine/liked ne marchent que si l'utilisateur est connecté
    const wantsMine = (req.query.mine === 'true' || req.query.mine === '1') && req.user;
    const wantsLiked = (req.query.liked === 'true' || req.query.liked === '1') && req.user;

    const posts = listPosts({
      categoryId: categoryId || null,
      userId: wantsMine ? req.user.id : null,
      likedByUserId: wantsLiked ? req.user.id : null,
    }).map((p) => ({
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

// POST /api/posts — créer un post
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

// GET /api/posts/:id/comments — liste les commentaires d'un post
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

// POST /api/posts/:id/comments — ajouter un commentaire
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

// POST /api/posts/:id/reactions — liker ou disliker un post
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

// GET /api/posts/:id — détail d'un post
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
        categoryIds: getPostCategoryIds(postId),
        reactions: getPostReactionSummary(postId, req.user?.id),
      },
    });
  } catch (err) {
    console.error('erreur get post:', err);
    res.status(500).json({ error: 'Erreur serveur' });
  }
});

// PUT /api/posts/:id — modifier un post
router.put('/:id', requireAuth, (req, res) => {
  const postId = Number(req.params.id);
  const { title, content, categoryIds, categoryNames } = req.body ?? {};

  try {
    updatePost(postId, req.user.id, title, content, categoryIds, categoryNames);
    res.json({ message: 'Publication modifiée' });
  } catch (err) {
    const status = err.code === 'NOT_FOUND' ? 404 : err.code === 'FORBIDDEN' ? 403 : 400;
    const messages = {
      INVALID: 'Titre et contenu requis.',
      NO_CATEGORY: 'Sélectionnez ou proposez au moins une catégorie.',
      INVALID_CATEGORY: 'Catégorie invalide.',
      NOT_FOUND: 'Publication introuvable.',
      FORBIDDEN: 'Vous ne pouvez modifier que vos propres publications.',
    };
    res.status(status).json({ error: messages[err.code] ?? 'Erreur lors de la modification' });
  }
});

// DELETE /api/posts/:id — supprimer un post
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
