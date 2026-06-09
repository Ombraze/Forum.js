import bcrypt from 'bcryptjs';
import { getDb } from '../db/database.js';

export function register(email, username, password, passwordConfirm) {
  email = email?.trim() ?? '';
  username = username?.trim() ?? '';

  if (!email || !username || !password) {
    throw Object.assign(new Error('Champs invalides'), { code: 'INVALID' });
  }
  if (password !== passwordConfirm) {
    throw Object.assign(new Error('Mots de passe différents'), { code: 'MISMATCH' });
  }

  const hash = bcrypt.hashSync(password, 10);

  try {
    const result = getDb()
      .prepare('INSERT INTO users (email, username, password_hash) VALUES (?, ?, ?)')
      .run(email, username, hash);
    return { id: result.lastInsertRowid, email, username };
  } catch (err) {
    if (err.code === 'SQLITE_CONSTRAINT_UNIQUE') {
      throw Object.assign(new Error('Utilisateur déjà existant'), { code: 'EXISTS' });
    }
    throw err;
  }
}

export function authenticate(username, password) {
  username = username?.trim() ?? '';
  if (!username || !password) {
    throw Object.assign(new Error('Identifiants invalides'), { code: 'INVALID' });
  }

  const row = getDb()
    .prepare('SELECT id, email, username, password_hash FROM users WHERE username = ?')
    .get(username);

  if (!row || !bcrypt.compareSync(password, row.password_hash)) {
    throw Object.assign(new Error('Identifiants invalides'), { code: 'INVALID' });
  }

  return { id: row.id, email: row.email, username: row.username };
}

export function getUserById(id) {
  const row = getDb()
    .prepare('SELECT id, email, username FROM users WHERE id = ?')
    .get(id);

  if (!row) return null;
  return { id: row.id, email: row.email, username: row.username };
}
