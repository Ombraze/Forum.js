import { getSession } from '../auth/session.js';
import { getUserById } from '../auth/users.js';

// Nom du cookie qui contient l'id de session
export const COOKIE_NAME = 'sid';

// Middleware : bloque la route si l'utilisateur n'est pas connecté
export function requireAuth(req, res, next) {
  const session = getSession(req.cookies?.[COOKIE_NAME]);
  if (!session) {
    return res.status(401).json({ error: 'Authentification requise' });
  }

  // On vérifie que l'utilisateur existe avant de continuer
  const user = getUserById(session.userId);
  if (!user) {
    return res.status(401).json({ error: 'Utilisateur introuvable' });
  }

  req.user = user;
  next();
}

// Middleware : récupère l'utilisateur s'il est connecté, sinon on continue quand même
export function optionalAuth(req, res, next) {
  const session = getSession(req.cookies?.[COOKIE_NAME]);
  req.user = session ? (getUserById(session.userId) ?? undefined) : undefined;
  next();
}
