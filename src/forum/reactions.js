import { getDb } from '../db/database.js';
import { getCommentById } from './comments.js';
import { getPostById } from './posts.js';

// Construit le résumé des likes/dislikes à partir des données SQL
function buildSummary(rows, userRow) {
  let likes = 0;
  let dislikes = 0;
  for (const row of rows) {
    if (row.value === 1) likes = row.count;
    if (row.value === -1) dislikes = row.count;
  }
  return {
    likes,
    dislikes,
    userReaction: userRow?.value ?? null,
  };
}

// Compte les likes/dislikes d'un post (+ la réaction de l'utilisateur connecté)
export function getPostReactionSummary(postId, userId = null) {
  const counts = getDb()
    .prepare(`
      SELECT value, COUNT(*) AS count
      FROM post_reactions
      WHERE post_id = ?
      GROUP BY value
    `)
    .all(postId);

  let userRow = null;
  if (userId) {
    userRow = getDb()
      .prepare('SELECT value FROM post_reactions WHERE post_id = ? AND user_id = ?')
      .get(postId, userId);
  }

  return buildSummary(counts, userRow);
}

// Même chose mais pour plusieurs commentaires en une seule requête
export function getCommentReactionSummaries(commentIds, userId = null) {
  if (!commentIds.length) return {};

  const placeholders = commentIds.map(() => '?').join(',');
  const counts = getDb()
    .prepare(`
      SELECT comment_id, value, COUNT(*) AS count
      FROM comment_reactions
      WHERE comment_id IN (${placeholders})
      GROUP BY comment_id, value
    `)
    .all(...commentIds);

  const map = Object.fromEntries(
    commentIds.map((id) => [id, { likes: 0, dislikes: 0, userReaction: null }]),
  );

  for (const row of counts) {
    if (row.value === 1) map[row.comment_id].likes = row.count;
    if (row.value === -1) map[row.comment_id].dislikes = row.count;
  }

  if (userId) {
    const userRows = getDb()
      .prepare(`
        SELECT comment_id, value
        FROM comment_reactions
        WHERE user_id = ? AND comment_id IN (${placeholders})
      `)
      .all(userId, ...commentIds);

    for (const row of userRows) {
      map[row.comment_id].userReaction = row.value;
    }
  }

  return map;
}

// Ajoute, change ou retire un like/dislike
function setReaction(table, idColumn, id, userId, value) {
  if (value !== 1 && value !== -1) {
    throw Object.assign(new Error('Valeur invalide'), { code: 'INVALID' });
  }

  const existing = getDb()
    .prepare(`SELECT value FROM ${table} WHERE ${idColumn} = ? AND user_id = ?`)
    .get(id, userId);

  // Si on reclique sur le même bouton, on retire la réaction
  if (existing?.value === value) {
    getDb()
      .prepare(`DELETE FROM ${table} WHERE ${idColumn} = ? AND user_id = ?`)
      .run(id, userId);
    return null;
  }

  // Si on avait déjà réagi, on change (like → dislike ou l'inverse)
  if (existing) {
    getDb()
      .prepare(`UPDATE ${table} SET value = ? WHERE ${idColumn} = ? AND user_id = ?`)
      .run(value, id, userId);
  } else {
    // Sinon on crée une nouvelle réaction
    getDb()
      .prepare(`INSERT INTO ${table} (${idColumn}, user_id, value) VALUES (?, ?, ?)`)
      .run(id, userId, value);
  }

  return value;
}

// Like ou dislike sur un post
export function setPostReaction(postId, userId, value) {
  if (!getPostById(postId)) {
    throw Object.assign(new Error('Publication introuvable'), { code: 'NOT_FOUND' });
  }
  setReaction('post_reactions', 'post_id', postId, userId, value);
  return getPostReactionSummary(postId, userId);
}

// Like ou dislike sur un commentaire
export function setCommentReaction(commentId, userId, value) {
  const comment = getCommentById(commentId);
  if (!comment) {
    throw Object.assign(new Error('Commentaire introuvable'), { code: 'NOT_FOUND' });
  }
  setReaction('comment_reactions', 'comment_id', commentId, userId, value);
  return getCommentReactionSummaries([commentId], userId)[commentId];
}
