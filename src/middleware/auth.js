import { verifyToken } from '../auth/jwt.js';
import { getUserById } from '../auth/users.js';

export function requireAuth(req, res, next) {
  const header = req.headers.authorization;
  if (!header?.startsWith('Bearer ')) {
    return res.status(401).json({ error: 'Authentification requise' });
  }

  try {
    const payload = verifyToken(header.slice(7));
    const user = getUserById(payload.sub);
    if (!user) {
      return res.status(401).json({ error: 'Utilisateur introuvable' });
    }
    req.user = user;
    next();
  } catch {
    return res.status(401).json({ error: 'Token invalide ou expiré' });
  }
}

export function optionalAuth(req, res, next) {
  const header = req.headers.authorization;
  if (header?.startsWith('Bearer ')) {
    try {
      const payload = verifyToken(header.slice(7));
      req.user = getUserById(payload.sub) ?? undefined;
    } catch {
      req.user = undefined;
    }
  }
  next();
}
