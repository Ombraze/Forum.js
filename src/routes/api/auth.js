import { Router } from 'express';
import { authenticate, register } from '../../auth/users.js';
import { createSession, deleteSession } from '../../auth/session.js';
import { requireAuth, COOKIE_NAME } from '../../middleware/auth.js';

const router = Router();

const SEVEN_DAYS_MS = 7 * 24 * 60 * 60 * 1000;

// Options du cookie de session
function cookieOptions() {
  return {
    httpOnly: true,                                // le JS du navigateur ne peut pas lire le cookie
    sameSite: 'lax',                               // protection basique contre le CSRF
    secure: process.env.NODE_ENV === 'production', // HTTPS obligatoire en production
    maxAge: SEVEN_DAYS_MS,
    path: '/',
  };
}

// POST /api/auth/register — créer un compte
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

// POST /api/auth/login — se connecter
router.post('/login', (req, res) => {
  const { username, password } = req.body ?? {};
  try {
    const user = authenticate(username, password);
    // Si le mot de passe est bon, on crée une session et on envoie le cookie
    const session = createSession(user.id);
    res.cookie(COOKIE_NAME, session.id, cookieOptions());
    res.json({ user: { id: user.id, username: user.username, email: user.email } });
  } catch {
    res.status(401).json({ error: 'Nom d\'utilisateur ou mot de passe incorrect.' });
  }
});

// POST /api/auth/logout — se déconnecter
router.post('/logout', (req, res) => {
  deleteSession(req.cookies?.[COOKIE_NAME]);
  res.clearCookie(COOKIE_NAME, { path: '/' });
  res.json({ message: 'Déconnexion réussie' });
});

// GET /api/auth/me — récupérer le profil de l'utilisateur connecté
router.get('/me', requireAuth, (req, res) => {
  res.json({ user: req.user });
});

export default router;
