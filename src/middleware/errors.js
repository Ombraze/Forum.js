import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const errorTemplatePath = path.join(__dirname, '..', '..', 'web', 'templates', 'error.html');

let errorTemplate;

// Charge le template HTML une seule fois en mémoire
function getErrorTemplate() {
  if (!errorTemplate) {
    errorTemplate = fs.readFileSync(errorTemplatePath, 'utf8');
  }
  return errorTemplate;
}

// Vérifie si la requête vient de l'API (renvoie du JSON) ou d'une page web (renvoie du HTML)
function isApiRequest(req) {
  return req.path.startsWith('/api');
}

// Envoie une page d'erreur HTML avec le bon code et message
function sendErrorPage(res, status, message) {
  const html = getErrorTemplate()
    .replaceAll('%%STATUS%%', String(status))
    .replaceAll('%%MESSAGE%%', message);

  res.status(status).type('html').send(html);
}

// Middleware 404 : aucune route ne correspond à l'URL demandée
export function notFoundHandler(req, res) {
  if (isApiRequest(req)) {
    return res.status(404).json({ error: 'Ressource introuvable' });
  }

  sendErrorPage(res, 404, 'La page demandée n\'existe pas.');
}

// Middleware 500 : une erreur inattendue s'est produite
export function errorHandler(err, req, res, next) {
  if (res.headersSent) {
    return next(err);
  }

  console.error(err);

  if (isApiRequest(req)) {
    return res.status(500).json({ error: 'Erreur serveur' });
  }

  sendErrorPage(res, 500, 'Une erreur interne est survenue.');
}
