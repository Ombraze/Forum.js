# Forum.js

Forum web développé en **Node.js** dans le cadre du projet Ynov. Application avec pages HTML, styles CSS et API REST sécurisée par **sessions cookie**.

## Fonctionnalités

### En place
- Page d'accueil (présentation, navigation)
- Inscription, connexion et déconnexion (cookie `httpOnly`)
- Liste des publications sur `/app` avec filtres par catégorie
- **Détail d'une publication** sur `/posts/:id`
- **Commentaires** sur les publications (ajout, liste, suppression)
- **Likes / dislikes** sur les publications et commentaires
- Création de publications (catégories existantes ou nouvelles proposées)
- Suppression de ses propres publications
- Serveur HTTP avec fichiers statiques (CSS, JS, icônes SVG)
- Base SQLite avec schéma automatique

### Prévu / en cours
- Édition de posts

## Stack technique

| Couche           | Technologie                        |
|------------------|------------------------------------|
| Backend          | Node.js 18+, Express 5             |
| Authentification | Sessions cookie + bcrypt           |
| Base de données  | SQLite (`better-sqlite3`)          |
| Frontend         | HTML, CSS, JavaScript (modules ES) |

## Prérequis

- [Node.js](https://nodejs.org/) 18 ou plus récent
- Git

## Installation et lancement

```bash
git clone https://github.com/Ombraze/Forum.js.git
cd Forum.js

npm install

cp .env.example .env

npm start
```

Ouvrir **http://localhost:8080** dans le navigateur.

La base est créée automatiquement dans `data/forum.db` au premier démarrage.

### Mode développement (rechargement auto du serveur)

```bash
npm run dev
```

### Note Windows / WSL

`better-sqlite3` est un module natif. Utilise **toujours le même terminal** (PowerShell **ou** bash/WSL) pour `npm install` et `npm run dev`. Si tu changes d'environnement :

```bash
npm rebuild better-sqlite3
```

## Routes

### Pages HTML

| Route       | Description    |
|-------------|----------------|
| `/`         | Accueil        |
| `/login`    | Connexion      |
| `/register` | Inscription    |
| `/app`      | Publications   |
| `/posts/:id`| Détail d'un post |
| `/static/*` | CSS, JS, SVG   |

### API REST

| Route                  | Méthode | Auth   | Description                    |
|------------------------|---------|--------|--------------------------------|
| `/api/auth/register`   | POST    | Non    | Créer un compte                |
| `/api/auth/login`      | POST    | Non    | Connexion → cookie de session  |
| `/api/auth/logout`     | POST    | Cookie | Déconnexion                    |
| `/api/auth/me`         | GET     | Cookie | Profil de l'utilisateur        |
| `/api/categories`      | GET     | Non    | Liste des catégories           |
| `/api/posts`           | GET     | Non    | Liste des publications (`?category=`, `?mine=true`, `?liked=true`) |
| `/api/posts/:id`       | GET     | Non    | Détail d'une publication       |
| `/api/posts/:id/comments` | GET  | Non    | Liste des commentaires         |
| `/api/posts/:id/comments` | POST | Cookie | Ajouter un commentaire         |
| `/api/posts/:id/reactions` | POST | Cookie | Like (+1) ou dislike (-1) sur un post |
| `/api/comments/:id/reactions` | POST | Cookie | Like ou dislike sur un commentaire |
| `/api/comments/:id`    | PUT     | Cookie | Modifier son commentaire         |
| `/api/comments/:id`    | DELETE  | Cookie | Supprimer son commentaire      |
| `/api/posts`           | POST    | Cookie | Créer une publication          |
| `/api/posts/:id`       | PUT     | Cookie | Modifier sa publication (titre, contenu, catégories) |
| `/api/posts/:id`       | DELETE  | Cookie | Supprimer sa publication       |

## Structure du projet

```
Forum.js/
├── src/
│   ├── server/
│   │   └── server.js       # Point d'entrée
│   ├── auth/               # Utilisateurs + sessions
│   ├── db/                 # SQLite + schéma
│   ├── forum/              # Logique posts & catégories
│   ├── middleware/         # Auth + gestion des erreurs HTTP
│   └── routes/api/         # Routes REST
├── web/
│   ├── static/
│   │   ├── style.css
│   │   ├── icons.svg
│   │   └── js/             # Scripts client
│   └── templates/          # Pages HTML
└── data/
    └── forum.db            # Base SQLite (ignorée par git)
```

## Variables d'environnement

| Variable   | Description                              |
|------------|------------------------------------------|
| `PORT`     | Port du serveur (défaut : 8080)          |
| `NODE_ENV` | `production` active le cookie `secure`   |

## Équipe

Projet réalisé par  **Ombraze** — Ynov.
