import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const errorTemplatePath = path.join(__dirname, '..', '..', 'web', 'templates', 'error.html');

let errorTemplate;

function getErrorTemplate() {
  if (!errorTemplate) {
    errorTemplate = fs.readFileSync(errorTemplatePath, 'utf8');
  }
  return errorTemplate;
}

function isApiRequest(req) {
  return req.path.startsWith('/api');
}

function sendErrorPage(res, status, message) {
  const html = getErrorTemplate()
    .replaceAll('%%STATUS%%', String(status))
    .replaceAll('%%MESSAGE%%', message);

  res.status(status).type('html').send(html);
}

export function notFoundHandler(req, res) {
  if (isApiRequest(req)) {
    return res.status(404).json({ error: 'Ressource introuvable' });
  }

  sendErrorPage(res, 404, 'La page demandée n\'existe pas.');
}

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
