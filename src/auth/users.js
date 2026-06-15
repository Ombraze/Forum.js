import bcrypt from 'bcryptjs';
import { getDb } from '../db/database.js';

// Inscription d'un nouvel utilisateur
export function register(email, username, password, passwordConfirm) {
  email = email?.trim() ?? '';
  username = username?.trim() ?? '';

  // On vérifie que tous les champs sont remplis
  if (!email || !username || !password) {
    throw Object.assign(new Error('Champs invalides'), { code: 'INVALID' });
  }
  // Les deux mots de passe doivent être identiques
  if (password !== passwordConfirm) {
    throw Object.assign(new Error('Mots de passe différents'), { code: 'MISMATCH' });
  }

  // On hash le mot de passe avant de le stocker en base
  const hash = bcrypt.hashSync(password, 10);

  try {
    const result = getDb()
      .prepare('INSERT INTO users (email, username, password_hash) VALUES (?, ?, ?)')
      .run(email, username, hash);
    return { id: result.lastInsertRowid, email, username };
  } catch (err) {
    // Email ou pseudo déjà pris
    if (err.code === 'SQLITE_CONSTRAINT_UNIQUE') {
      throw Object.assign(new Error('Utilisateur déjà existant'), { code: 'EXISTS' });
    }
    throw err;
  }
}

// Connexion : on vérifie le pseudo et le mot de passe
export function authenticate(username, password) {
  username = username?.trim() ?? '';
  if (!username || !password) {
    throw Object.assign(new Error('Identifiants invalides'), { code: 'INVALID' });
  }

  const row = getDb()
    .prepare('SELECT id, email, username, password_hash FROM users WHERE username = ?')
    .get(username);

  // Si l'utilisateur n'existe pas ou si le mot de passe est mauvais
  if (!row || !bcrypt.compareSync(password, row.password_hash)) {
    throw Object.assign(new Error('Identifiants invalides'), { code: 'INVALID' });
  }

  return { id: row.id, email: row.email, username: row.username };
}

// Récupère un utilisateur par son id (sans le mot de passe)
export function getUserById(id) {
  const row = getDb()
    .prepare('SELECT id, email, username FROM users WHERE id = ?')
    .get(id);

  if (!row) return null;
  return { id: row.id, email: row.email, username: row.username };
}
