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
