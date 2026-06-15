import { getDb } from '../db/database.js';

// Récupère toutes les catégories, triées par nom
export function listCategories() {
  return getDb()
    .prepare('SELECT id, name FROM categories ORDER BY name ASC')
    .all();
}

// Récupère une catégorie par son id
export function getCategoryById(id) {
  return getDb()
    .prepare('SELECT id, name FROM categories WHERE id = ?')
    .get(id);
}

// Cherche une catégorie par son nom (insensible à la casse)
export function getCategoryByName(name) {
  const trimmed = name?.trim() ?? '';
  if (!trimmed) return null;
  return getDb()
    .prepare('SELECT id, name FROM categories WHERE LOWER(name) = LOWER(?)')
    .get(trimmed);
}

// Crée une nouvelle catégorie (ou renvoie celle qui existe déjà)
export function createCategory(name) {
  name = name?.trim() ?? '';
  if (!name || name.length > 50) {
    throw Object.assign(new Error('Nom de catégorie invalide'), { code: 'INVALID' });
  }

  // Si la catégorie existe déjà, on la renvoie directement
  const existing = getCategoryByName(name);
  if (existing) return existing;

  try {
    const result = getDb()
      .prepare('INSERT INTO categories (name) VALUES (?)')
      .run(name);
    return { id: result.lastInsertRowid, name };
  } catch (err) {
    // Deux requêtes en même temps : on récupère la catégorie existante
    if (err.code === 'SQLITE_CONSTRAINT_UNIQUE') {
      return getCategoryByName(name);
    }
    throw err;
  }
}
