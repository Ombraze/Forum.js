import { Router } from 'express';
import { deleteComment, updateComment } from '../../forum/comments.js';
import { setCommentReaction } from '../../forum/reactions.js';
import { requireAuth } from '../../middleware/auth.js';

const router = Router();

// POST /api/comments/:id/reactions — liker ou disliker un commentaire
router.post('/:id/reactions', requireAuth, (req, res) => {
  const commentId = Number(req.params.id);
  const value = Number(req.body?.value);

  try {
    const reactions = setCommentReaction(commentId, req.user.id, value);
    res.json({ reactions });
  } catch (err) {
    const status = err.code === 'NOT_FOUND' ? 404 : 400;
    const messages = {
      NOT_FOUND: 'Commentaire introuvable.',
      INVALID: 'Réaction invalide.',
    };
    res.status(status).json({ error: messages[err.code] ?? 'Erreur serveur' });
  }
});

// PUT /api/comments/:id — modifier un commentaire
router.put('/:id', requireAuth, (req, res) => {
  const commentId = Number(req.params.id);
  const { content } = req.body ?? {};

  try {
    updateComment(commentId, req.user.id, content);
    res.json({ message: 'Commentaire modifié' });
  } catch (err) {
    const status = err.code === 'NOT_FOUND' ? 404 : err.code === 'FORBIDDEN' ? 403 : 400;
    const messages = {
      INVALID: 'Le commentaire ne peut pas être vide.',
      NOT_FOUND: 'Commentaire introuvable.',
      FORBIDDEN: 'Vous ne pouvez modifier que vos propres commentaires.',
    };
    res.status(status).json({ error: messages[err.code] ?? 'Erreur lors de la modification' });
  }
});

// DELETE /api/comments/:id — supprimer un commentaire
router.delete('/:id', requireAuth, (req, res) => {
  const commentId = Number(req.params.id);

  try {
    deleteComment(commentId, req.user.id);
    res.json({ message: 'Commentaire supprimé' });
  } catch (err) {
    const status = err.code === 'NOT_FOUND' ? 404 : err.code === 'FORBIDDEN' ? 403 : 400;
    const messages = {
      NOT_FOUND: 'Commentaire introuvable.',
      FORBIDDEN: 'Vous ne pouvez supprimer que vos propres commentaires.',
    };
    res.status(status).json({ error: messages[err.code] ?? 'Erreur lors de la suppression' });
  }
});

export default router;
