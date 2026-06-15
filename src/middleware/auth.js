import { getSession } from '../auth/session.js';
import { getUserById } from '../auth/users.js';

const COOKIE_NAME = 'sid';

export function requireAuth(req, res, next) {
  const session = getSession(req.cookies?.[COOKIE_NAME]);
  if (!session) {
    return res.status(401).json({ error: 'Authentification requise' });
  }

  const user = getUserById(session.userId);
  if (!user) {
    return res.status(401).json({ error: 'Utilisateur introuvable' });
  }

  req.user = user;
  next();
}

export function optionalAuth(req, res, next) {
  const session = getSession(req.cookies?.[COOKIE_NAME]);
  req.user = session ? (getUserById(session.userId) ?? undefined) : undefined;
  next();
}