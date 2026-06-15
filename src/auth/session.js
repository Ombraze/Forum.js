import { randomUUID } from 'crypto';
import { getDb } from '../db/database.js';

// Durée de vie d'une session : 7 jours
const SESSION_TTL_MS = 7 * 24 * 60 * 60 * 1000;

// Crée une session pour un utilisateur connecté
export function createSession(userId) {
  const db = getDb();
  const id = randomUUID();
  const expiresAt = new Date(Date.now() + SESSION_TTL_MS).toISOString();

  // On supprime l'ancienne session avant d'en créer une nouvelle
  // Comme ça, un utilisateur n'a qu'une seule session active à la fois
  const replace = db.transaction(() => {
    db.prepare('DELETE FROM sessions WHERE user_id = ?').run(userId);
    db.prepare(
      'INSERT INTO sessions (id, user_id, expires_at) VALUES (?, ?, ?)',
    ).run(id, userId, expiresAt);
  });
  replace();

  return { id, expiresAt };
}

// Récupère une session à partir de l'id du cookie
export function getSession(id) {
  if (!id) return null;

  const row = getDb()
    .prepare('SELECT id, user_id, expires_at FROM sessions WHERE id = ?')
    .get(id);

  if (!row) return null;

  // Si la session est expirée, on la supprime et on renvoie null
  if (new Date(row.expires_at).getTime() < Date.now()) {
    deleteSession(id);
    return null;
  }

  return { id: row.id, userId: row.user_id, expiresAt: row.expires_at };
}

// Supprime une session (déconnexion)
export function deleteSession(id) {
  if (!id) return;
  getDb().prepare('DELETE FROM sessions WHERE id = ?').run(id);
}
