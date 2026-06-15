import { getDb } from '../db/database.js';
import { createCategory, getCategoryById } from './categories.js';

// Liste les posts avec filtres optionnels (catégorie, auteur, posts likés)
export function listPosts({ categoryId = null, userId = null, likedByUserId = null } = {}) {
  let query = `
    SELECT
      p.id,
      p.title,
      p.content,
      p.created_at,
      p.user_id,
      u.username AS author,
      GROUP_CONCAT(c.name, ', ') AS categories
    FROM posts p
    INNER JOIN users u ON u.id = p.user_id
    LEFT JOIN post_categories pc ON pc.post_id = p.id
    LEFT JOIN categories c ON c.id = pc.category_id
  `;

  const conditions = [];
  const params = [];

  // Filtre par catégorie
  if (categoryId) {
    conditions.push('p.id IN (SELECT post_id FROM post_categories WHERE category_id = ?)');
    params.push(categoryId);
  }
  // Filtre "mes posts" : seulement les posts de cet utilisateur
  if (userId) {
    conditions.push('p.user_id = ?');
    params.push(userId);
  }
  // Filtre "posts likés" : seulement les posts que l'utilisateur a likés
  if (likedByUserId) {
    conditions.push(
      'p.id IN (SELECT post_id FROM post_reactions WHERE user_id = ? AND value = 1)',
    );
    params.push(likedByUserId);
  }

  if (conditions.length) {
    query += ` WHERE ${conditions.join(' AND ')}`;
  }

  query += `
    GROUP BY p.id
    ORDER BY p.created_at DESC
  `;

  return getDb().prepare(query).all(...params);
}

// Prépare la liste des catégories à partir des ids sélectionnés et des noms proposés
function resolveCategoryIds(categoryIds, categoryNames) {
  const ids = [...new Set((categoryIds ?? []).map(Number).filter((id) => id > 0))];

  const names = [...new Set(
    (categoryNames ?? [])
      .map((name) => name?.trim())
      .filter((name) => name),
  )];

  // Si l'utilisateur propose une nouvelle catégorie, on la crée
  for (const name of names) {
    ids.push(createCategory(name).id);
  }

  const uniqueIds = [...new Set(ids)];
  if (!uniqueIds.length) {
    throw Object.assign(new Error('Au moins une catégorie requise'), { code: 'NO_CATEGORY' });
  }

  // On vérifie que chaque catégorie existe bien
  for (const id of uniqueIds) {
    if (!getCategoryById(id)) {
      throw Object.assign(new Error('Catégorie invalide'), { code: 'INVALID_CATEGORY' });
    }
  }

  return uniqueIds;
}

// Crée un nouveau post avec ses catégories
export function createPost(userId, title, content, categoryIds, categoryNames = []) {
  title = title?.trim() ?? '';
  content = content?.trim() ?? '';

  if (!title || !content) {
    throw Object.assign(new Error('Titre et contenu requis'), { code: 'INVALID' });
  }

  const uniqueIds = resolveCategoryIds(categoryIds, categoryNames);

  const db = getDb();
  const insertPost = db.prepare(
    'INSERT INTO posts (user_id, title, content) VALUES (?, ?, ?)',
  );
  const linkCategory = db.prepare(
    'INSERT INTO post_categories (post_id, category_id) VALUES (?, ?)',
  );

  // Tout se fait en une transaction : si une étape échoue, rien n'est enregistré
  const create = db.transaction(() => {
    const result = insertPost.run(userId, title, content);
    const postId = result.lastInsertRowid;
    for (const categoryId of uniqueIds) {
      linkCategory.run(postId, categoryId);
    }
    return postId;
  });

  return create();
}

// Récupère les ids des catégories liées à un post
export function getPostCategoryIds(postId) {
  return getDb()
    .prepare('SELECT category_id FROM post_categories WHERE post_id = ?')
    .all(postId)
    .map((row) => row.category_id);
}

// Modifie un post (seul l'auteur peut le faire)
export function updatePost(postId, userId, title, content, categoryIds, categoryNames = []) {
  const post = getPostById(postId);
  if (!post) {
    throw Object.assign(new Error('Publication introuvable'), { code: 'NOT_FOUND' });
  }
  if (post.user_id !== userId) {
    throw Object.assign(new Error('Non autorisé'), { code: 'FORBIDDEN' });
  }

  title = title?.trim() ?? '';
  content = content?.trim() ?? '';

  if (!title || !content) {
    throw Object.assign(new Error('Titre et contenu requis'), { code: 'INVALID' });
  }

  const uniqueIds = resolveCategoryIds(categoryIds, categoryNames);

  const db = getDb();
  const linkCategory = db.prepare(
    'INSERT INTO post_categories (post_id, category_id) VALUES (?, ?)',
  );

  const save = db.transaction(() => {
    db.prepare(
      'UPDATE posts SET title = ?, content = ?, updated_at = CURRENT_TIMESTAMP WHERE id = ?',
    ).run(title, content, postId);
    // On remplace toutes les catégories du post
    db.prepare('DELETE FROM post_categories WHERE post_id = ?').run(postId);
    for (const categoryId of uniqueIds) {
      linkCategory.run(postId, categoryId);
    }
  });

  save();
}

// Récupère les infos basiques d'un post (pour vérifier qu'il existe)
export function getPostById(id) {
  return getDb()
    .prepare('SELECT id, user_id, title FROM posts WHERE id = ?')
    .get(id);
}

// Récupère le détail complet d'un post (auteur, catégories, contenu...)
export function getPostDetail(id) {
  return getDb()
    .prepare(`
      SELECT
        p.id,
        p.title,
        p.content,
        p.created_at,
        p.user_id,
        u.username AS author,
        GROUP_CONCAT(c.name, ', ') AS categories
      FROM posts p
      INNER JOIN users u ON u.id = p.user_id
      LEFT JOIN post_categories pc ON pc.post_id = p.id
      LEFT JOIN categories c ON c.id = pc.category_id
      WHERE p.id = ?
      GROUP BY p.id
    `)
    .get(id);
}

// Supprime un post (seul l'auteur peut le faire)
export function deletePost(postId, userId) {
  const post = getPostById(postId);
  if (!post) {
    throw Object.assign(new Error('Publication introuvable'), { code: 'NOT_FOUND' });
  }
  if (post.user_id !== userId) {
    throw Object.assign(new Error('Non autorisé'), { code: 'FORBIDDEN' });
  }
  getDb().prepare('DELETE FROM posts WHERE id = ?').run(postId);
}
