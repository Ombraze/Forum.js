# Forum.js

Forum web développé en **Go** dans le cadre du projet Ynov. Application monolithique avec pages HTML, styles CSS personnalisés et base de données **SQLite**.

## Fonctionnalités

### En place
- Page d'accueil (présentation, navigation)
- Pages connexion et inscription (interface)
- Serveur HTTP avec fichiers statiques (CSS, icônes SVG)
- Initialisation automatique de la base SQLite et du schéma

### Prévu / en cours
- Authentification (inscription, connexion, sessions)
- CRUD posts et commentaires
- Catégories, likes / dislikes
- Espace membre connecté (`app.html`)

## Stack technique

| Couche      | Technologie                          |
|-------------|--------------------------------------|
| Backend     | Go 1.25                              |
| Base de données | SQLite (`modernc.org/sqlite`)   |
| Frontend    | HTML, CSS (pas de framework JS)    |
| Icônes      | SVG inline (`web/static/icons.svg`) |

## Prérequis

- [Go](https://go.dev/dl/) 1.25 ou plus récent
- Git

Optionnel pour le rechargement auto du front :
- [Node.js](https://nodejs.org/) (pour `npx browser-sync`)

## Installation et lancement

```bash
# Cloner le dépôt
git clone https://github.com/Ombraze/Forum.js.git
cd Forum.js

# Télécharger les dépendances
go mod download

# Lancer le serveur
go run .
```

Ouvrir **http://localhost:8080** dans le navigateur.

La base est créée automatiquement dans `data/forum.db` au premier démarrage.

### Compiler un binaire

```bash
go build -o forum .
./forum        # Linux / macOS
forum.exe      # Windows
```

## Routes HTTP

| Route            | Description              |
|------------------|--------------------------|
| `/`              | Page d'accueil           |
| `/login`         | Connexion                |
| `/register`      | Inscription              |
| `/static/*`      | CSS, icônes SVG          |

Les formulaires POST redirigent temporairement (logique métier à implémenter).

## Structure du projet

```
Forum.js/
├── main.go                 # Point d'entrée
├── src/
│   ├── db/
│   │   ├── database.go     # Connexion SQLite
│   │   └── shema.sql       # Schéma et données initiales
│   └── server/
│       └── server.go       # Routes et serveur HTTP
├── web/
│   ├── static/
│   │   ├── style.css
│   │   └── icons.svg
│   └── templates/
│       ├── index.html      # Accueil
│       ├── login.html      # Connexion
│       ├── register.html   # Inscription
│       └── app.html        # Application (à venir)
└── data/
    └── forum.db            # Base SQLite (ignorée par git)
```

## Modèle de données

- **users** — comptes (email, pseudo, mot de passe hashé)
- **sessions** — sessions utilisateur (cookie)
- **categories** — thèmes du forum (General, Go, Web, Database…)
- **posts** / **comments** — publications et réponses
- **post_reactions** / **comment_reactions** — likes et dislikes

Le détail des tables est dans `src/db/shema.sql`.

## Développement front

### Avec le serveur Go (recommandé)

```bash
go run .
```

Puis modifier `web/templates/` ou `web/static/` et actualiser le navigateur (**F5**).

### Avec Live Preview (Cursor / VS Code)

1. Installer l’extension **Live Preview**
2. Ouvrir `web/templates/index.html` → **Show Preview**

Les liens entre pages utilisent des chemins relatifs (`login.html`, `register.html`).  
Le CSS est lié via `../static/style.css`.  
La configuration projet est dans `.vscode/settings.json` (`livePreview.serverRoot`).

> Live Preview ne gère pas les routes Go ni les formulaires POST. Pour tester le site complet, utiliser `go run .`.

## Variables et fichiers ignorés

- `data/` — base SQLite locale
- `.env` — secrets (futur)
- `auth/` — fichiers d’authentification locaux

Voir `.gitignore`.

## Équipe

Projet réalisé par l’équipe **Ombraze** — Ynov.

## Licence

Projet scolaire — usage pédagogique.
