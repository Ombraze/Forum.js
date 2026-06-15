import { getDb } from '../db/database.js';
import { getPostById } from './posts.js';

export function listComments(postId) {
  return getDb()
    .prepare(`
      SELECT c.id, c.content, c.created_at, c.user_id, u.username AS author
      FROM comments c
      INNER JOIN users u ON u.id = c.user_id
      WHERE c.post_id = ?
      ORDER BY c.created_at ASC
    `)
    .all(postId);
}

export function createComment(postId, userId, content) {
  content = content?.trim() ?? '';
  if (!content) {
    throw Object.assign(new Error('Contenu requis'), { code: 'INVALID' });
  }
  if (!getPostById(postId)) {
    throw Object.assign(new Error('Publication introuvable'), { code: 'NOT_FOUND' });
  }

  const result = getDb()
    .prepare('INSERT INTO comments (post_id, user_id, content) VALUES (?, ?, ?)')
    .run(postId, userId, content);

  return result.lastInsertRowid;
}

export function getCommentById(id) {
  return getDb()
    .prepare('SELECT id, user_id, post_id FROM comments WHERE id = ?')
    .get(id);
}

export function deleteComment(commentId, userId) {
  const comment = getCommentById(commentId);
  if (!comment) {
    throw Object.assign(new Error('Commentaire introuvable'), { code: 'NOT_FOUND' });
  }
  if (comment.user_id !== userId) {
    throw Object.assign(new Error('Non autorisé'), { code: 'FORBIDDEN' });
  }
  getDb().prepare('DELETE FROM comments WHERE id = ?').run(commentId);
}
