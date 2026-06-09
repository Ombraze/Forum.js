import { getDb } from '../db/database.js';
import { getCategoryById } from './categories.js';

export function listPosts(categoryId = null) {
  let query = `
    SELECT
      p.id,
      p.title,
      p.content,
      p.created_at,
      u.username AS author,
      GROUP_CONCAT(c.name, ', ') AS categories
    FROM posts p
    INNER JOIN users u ON u.id = p.user_id
    LEFT JOIN post_categories pc ON pc.post_id = p.id
    LEFT JOIN categories c ON c.id = pc.category_id
  `;

  const params = [];
  if (categoryId) {
    query += `
    WHERE p.id IN (
      SELECT post_id FROM post_categories WHERE category_id = ?
    )`;
    params.push(categoryId);
  }

  query += `
    GROUP BY p.id
    ORDER BY p.created_at DESC
  `;

  return getDb().prepare(query).all(...params);
}

export function createPost(userId, title, content, categoryIds) {
  title = title?.trim() ?? '';
  content = content?.trim() ?? '';

  if (!title || !content) {
    throw Object.assign(new Error('Titre et contenu requis'), { code: 'INVALID' });
  }

  const ids = [...new Set((categoryIds ?? []).map(Number).filter((id) => id > 0))];
  if (!ids.length) {
    throw Object.assign(new Error('Au moins une catégorie requise'), { code: 'NO_CATEGORY' });
  }

  for (const id of ids) {
    if (!getCategoryById(id)) {
      throw Object.assign(new Error('Catégorie invalide'), { code: 'INVALID_CATEGORY' });
    }
  }

  const db = getDb();
  const insertPost = db.prepare(
    'INSERT INTO posts (user_id, title, content) VALUES (?, ?, ?)',
  );
  const linkCategory = db.prepare(
    'INSERT INTO post_categories (post_id, category_id) VALUES (?, ?)',
  );

  const create = db.transaction(() => {
    const result = insertPost.run(userId, title, content);
    const postId = result.lastInsertRowid;
    for (const categoryId of ids) {
      linkCategory.run(postId, categoryId);
    }
    return postId;
  });

  return create();
}
