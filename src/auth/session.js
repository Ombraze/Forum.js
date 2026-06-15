import { randomUUID } from 'crypto';
import { getDb } from '../db/database.js';

const SESSION_TTL_MS = 7 * 24 * 60 * 60 * 1000; // 7 jours

export function createSession(userId) {
  const db = getDb();
  const id = randomUUID();
  const expiresAt = new Date(Date.now() + SESSION_TTL_MS).toISOString();

//Règle "une seule session par utilisateur" :
  const replace = db.transaction(() => {
    db.prepare('DELETE FROM sessions WHERE user_id = ?').run(userId);
    db.prepare(
      'INSERT INTO sessions (id, user_id, expires_at) VALUES (?, ?, ?)',
    ).run(id, userId, expiresAt);
  });
  replace();

  return { id, expiresAt };
}

export function getSession(id) {
  if (!id) return null;

  const row = getDb()
    .prepare('SELECT id, user_id, expires_at FROM sessions WHERE id = ?')
    .get(id);

  if (!row) return null;

  if (new Date(row.expires_at).getTime() < Date.now()) {
    deleteSession(id);
    return null;
  }

  return { id: row.id, userId: row.user_id, expiresAt: row.expires_at };
}

export function deleteSession(id) {
  if (!id) return;
  getDb().prepare('DELETE FROM sessions WHERE id = ?').run(id);
}