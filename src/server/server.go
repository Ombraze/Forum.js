package server

import (
	"log"
	"net/http"
	"os"
	"path/filepath"
)

const DefaultAddr = ":8080"

var webRoot string

func resolveWebRoot() string {
	if webRoot != "" {
		return webRoot
	}

	dir, err := os.Getwd()
	if err != nil {
		webRoot = "web"
		return webRoot
	}

	for {
		if _, err := os.Stat(filepath.Join(dir, "go.mod")); err == nil {
			webRoot = filepath.Join(dir, "web")
			return webRoot
		}
		parent := filepath.Dir(dir)
		if parent == dir {
			webRoot = "web"
			return webRoot
		}
		dir = parent
	}
}

func templatePath(name string) string {
	return filepath.Join(resolveWebRoot(), "templates", name)
}

func serveTemplate(w http.ResponseWriter, r *http.Request, name string) {
	http.ServeFile(w, r, templatePath(name))
}

func serveGET(file string) http.HandlerFunc {
	return func(w http.ResponseWriter, r *http.Request) {
		if r.Method != http.MethodGet && r.Method != http.MethodHead {
			http.Error(w, "Méthode non autorisée", http.StatusMethodNotAllowed)
			return
		}
		serveTemplate(w, r, file)
	}
}

func Start(addr string) error {
	if addr == "" {
		addr = DefaultAddr
	}

	root := resolveWebRoot()
	staticDir := filepath.Join(root, "static")

	mux := http.NewServeMux()
	mux.Handle("/static/", http.StripPrefix("/static/", http.FileServer(http.Dir(staticDir))))

	mux.HandleFunc("/", serveGET("index.html"))
	mux.HandleFunc("/index.html", serveGET("index.html"))

	mux.HandleFunc("/login", func(w http.ResponseWriter, r *http.Request) {
		if r.Method == http.MethodPost {
			http.Redirect(w, r, "/", http.StatusSeeOther)
			return
		}
		serveGET("login.html")(w, r)
	})
	mux.HandleFunc("/login.html", serveGET("login.html"))

	mux.HandleFunc("/signin", func(w http.ResponseWriter, r *http.Request) {
		if r.Method == http.MethodPost {
			http.Redirect(w, r, "/", http.StatusSeeOther)
			return
		}
		serveGET("login.html")(w, r)
	})

	mux.HandleFunc("/register", func(w http.ResponseWriter, r *http.Request) {
		if r.Method == http.MethodPost {
			http.Redirect(w, r, "/login", http.StatusSeeOther)
			return
		}
		serveGET("register.html")(w, r)
	})
	mux.HandleFunc("/register.html", serveGET("register.html"))

	log.Printf("Serveur démarré sur http://localhost%s", addr)
	log.Printf("Fichiers statiques : %s", staticDir)
	return http.ListenAndServe(addr, mux)
}
