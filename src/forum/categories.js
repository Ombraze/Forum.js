import { getDb } from '../db/database.js';

export function listCategories() {
  return getDb()
    .prepare('SELECT id, name FROM categories ORDER BY name ASC')
    .all();
}

export function getCategoryById(id) {
  return getDb()
    .prepare('SELECT id, name FROM categories WHERE id = ?')
    .get(id);
}

export function getCategoryByName(name) {
  const trimmed = name?.trim() ?? '';
  if (!trimmed) return null;
  return getDb()
    .prepare('SELECT id, name FROM categories WHERE LOWER(name) = LOWER(?)')
    .get(trimmed);
}

export function createCategory(name) {
  name = name?.trim() ?? '';
  if (!name || name.length > 50) {
    throw Object.assign(new Error('Nom de catégorie invalide'), { code: 'INVALID' });
  }

  const existing = getCategoryByName(name);
  if (existing) return existing;

  try {
    const result = getDb()
      .prepare('INSERT INTO categories (name) VALUES (?)')
      .run(name);
    return { id: result.lastInsertRowid, name };
  } catch (err) {
    if (err.code === 'SQLITE_CONSTRAINT_UNIQUE') {
      return getCategoryByName(name);
    }
    throw err;
  }
}
