# Forum.js

Forum web développé en **Node.js** dans le cadre du projet Ynov. Application avec pages HTML, styles CSS et API REST sécurisée par **JWT**.

## Fonctionnalités

### En place
- Page d'accueil (présentation, navigation)
- Inscription et connexion (JWT stocké côté client)
- Liste des publications sur `/app`
- Serveur HTTP avec fichiers statiques (CSS, JS, icônes SVG)
- Base SQLite avec schéma automatique

### Prévu / en cours
- CRUD posts et commentaires
- Catégories, likes / dislikes
- Détail d'un post

## Stack technique

| Couche          | Technologie                          |
|-----------------|--------------------------------------|
| Backend         | Node.js 18+, Express                 |
| Authentification| JWT (`jsonwebtoken`) + bcrypt        |
| Base de données | SQLite (`better-sqlite3`)            |
| Frontend        | HTML, CSS, JavaScript (modules ES)   |

## Prérequis

- [Node.js](https://nodejs.org/) 18 ou plus récent
- Git

## Installation et lancement

```bash
git clone https://github.com/Ombraze/Forum.js.git
cd Forum.js

npm install

# Copier et personnaliser le secret JWT
cp .env.example .env

npm start
```

Ouvrir **http://localhost:8080** dans le navigateur.

La base est créée automatiquement dans `data/forum.db` au premier démarrage.

### Mode développement (rechargement auto du serveur)

```bash
npm run dev
```

## Routes

### Pages HTML

| Route       | Description    |
|-------------|----------------|
| `/`         | Accueil        |
| `/login`    | Connexion      |
| `/register` | Inscription    |
| `/app`      | Publications   |
| `/static/*` | CSS, JS, SVG   |

### API REST

| Route                  | Méthode | Description              |
|------------------------|---------|--------------------------|
| `/api/auth/register`   | POST    | Créer un compte          |
| `/api/auth/login`      | POST    | Connexion → JWT          |
| `/api/auth/me`         | GET     | Profil (Bearer token)    |
| `/api/posts`           | GET     | Liste des publications   |

## Structure du projet

```
Forum.js/
├── server.js               # Point d'entrée
├── src/
│   ├── auth/               # Utilisateurs + JWT
│   ├── db/                 # SQLite + schéma
│   ├── forum/              # Logique posts
│   ├── middleware/         # Vérification JWT
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

| Variable     | Description                    |
|--------------|--------------------------------|
| `JWT_SECRET` | Clé secrète pour signer les JWT |
| `PORT`       | Port du serveur (défaut : 8080) |

## Équipe

Projet réalisé par l'équipe **Ombraze** — Ynov.
