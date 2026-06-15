import 'dotenv/config';
import express from 'express';
import path from 'path';
import { fileURLToPath } from 'url';
import cookieParser from 'cookie-parser';
import { initDb } from '../db/database.js';
import { errorHandler, notFoundHandler } from '../middleware/errors.js';
import authRouter from '../routes/api/auth.js';
import categoriesRouter from '../routes/api/categories.js';
import commentsRouter from '../routes/api/comments.js';
import postsRouter from '../routes/api/posts.js';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const PORT = process.env.PORT || 8080;
const templatesDir = path.join(__dirname, '..', '..', 'web', 'templates');
const staticDir = path.join(__dirname, '..', '..', 'web', 'static');

// On initialise la base SQLite au démarrage
initDb();

const app = express();

// Middlewares globaux : parser le JSON, les formulaires et les cookies
app.use(express.json());
app.use(express.urlencoded({ extended: true }));
app.use(cookieParser());

// Fichiers statiques (CSS, JS, images...)
app.use('/static', express.static(staticDir));

// Envoie une page HTML du dossier templates
function servePage(name) {
  return (_req, res, next) => {
    res.sendFile(path.join(templatesDir, name), (err) => {
      if (err) next(err);
    });
  };
}

// Routes des pages web
app.get('/', servePage('index.html'));
app.get('/index.html', servePage('index.html'));
app.get('/login', servePage('login.html'));
app.get('/login.html', servePage('login.html'));
app.get('/register', servePage('register.html'));
app.get('/register.html', servePage('register.html'));
app.get('/app', servePage('app.html'));
app.get('/posts/:id', servePage('post.html'));

// Routes de l'API REST
app.use('/api/auth', authRouter);
app.use('/api/categories', categoriesRouter);
app.use('/api/posts', postsRouter);
app.use('/api/comments', commentsRouter);

// Gestion des erreurs 404 et 500 (toujours en dernier)
app.use(notFoundHandler);
app.use(errorHandler);

app.listen(PORT, () => {
  console.log(`Serveur démarré sur http://localhost:${PORT}`);
  console.log(`Fichiers statiques : ${staticDir}`);
});
