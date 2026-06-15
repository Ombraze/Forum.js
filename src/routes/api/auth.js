import { Router } from 'express';
import { authenticate, register } from '../../auth/users.js';
import { createSession, deleteSession } from '../../auth/session.js';
import { requireAuth, COOKIE_NAME } from '../../middleware/auth.js';

const router = Router();

const SEVEN_DAYS_MS = 7 * 24 * 60 * 60 * 1000;

function cookieOptions() {
  return {
    httpOnly: true,                                // inaccessible au JS du navigateur (anti-XSS)
    sameSite: 'lax',                               // limite le CSRF
    secure: process.env.NODE_ENV === 'production', // cookie HTTPS-only en prod
    maxAge: SEVEN_DAYS_MS,
    path: '/',
  };
}

router.post('/register', (req, res) => {
  const { email, username, password, password_confirm: passwordConfirm } = req.body ?? {};
  try {
    const user = register(email, username, password, passwordConfirm);
    res.status(201).json({ message: 'Compte créé', user: { id: user.id, username: user.username } });
  } catch (err) {
    const messages = {
      INVALID: 'Veuillez remplir tous les champs.',
      MISMATCH: 'Les mots de passe ne correspondent pas.',
      EXISTS: 'Ce nom d\'utilisateur ou cet e-mail est déjà utilisé.',
    };
    const status = err.code === 'EXISTS' ? 409 : 400;
    res.status(status).json({ error: messages[err.code] ?? 'Erreur lors de l\'inscription' });
  }
});

router.post('/login', (req, res) => {
  const { username, password } = req.body ?? {};
  try {
    const user = authenticate(username, password);
    const session = createSession(user.id);
    res.cookie(COOKIE_NAME, session.id, cookieOptions());
    res.json({ user: { id: user.id, username: user.username, email: user.email } });
  } catch {
    res.status(401).json({ error: 'Nom d\'utilisateur ou mot de passe incorrect.' });
  }
});

router.post('/logout', (req, res) => {
  deleteSession(req.cookies?.[COOKIE_NAME]);
  res.clearCookie(COOKIE_NAME, { path: '/' });
  res.json({ message: 'Déconnexion réussie' });
});

router.get('/me', requireAuth, (req, res) => {
  res.json({ user: req.user });
});

export default router;