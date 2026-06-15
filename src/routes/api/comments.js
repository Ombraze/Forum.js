import { Router } from 'express';
import { deleteComment } from '../../forum/comments.js';
import { setCommentReaction } from '../../forum/reactions.js';
import { requireAuth } from '../../middleware/auth.js';

const router = Router();

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
