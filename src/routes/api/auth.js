import { Router } from 'express';
import { authenticate, register } from '../../auth/users.js';
import { signToken } from '../../auth/jwt.js';
import { requireAuth } from '../../middleware/auth.js';

const router = Router();

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
    const token = signToken(user);
    res.json({
      token,
      user: { id: user.id, username: user.username, email: user.email },
    });
  } catch {
    res.status(401).json({ error: 'Nom d\'utilisateur ou mot de passe incorrect.' });
  }
});

router.get('/me', requireAuth, (req, res) => {
  res.json({ user: req.user });
});

export default router;
