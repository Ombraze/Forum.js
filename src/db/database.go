package db

import (
	"database/sql"
	_ "embed"
	"fmt"
	"os"
	"path/filepath"

	_ "modernc.org/sqlite"
)

var schemaSQL string

const DefaultPath = "data/forum.db"

var DB *sql.DB

func Init(dbPath string) error {
	if err := os.MkdirAll(filepath.Dir(dbPath), 0755); err != nil {
		return fmt.Errorf("créer le dossier data: %w", err)
	}

	var err error
	DB, err = sql.Open("sqlite", dbPath)
	if err != nil {
		return fmt.Errorf("ouvrir sqlite: %w", err)
	}

	if err := DB.Ping(); err != nil {
		return fmt.Errorf("ping sqlite: %w", err)
	}

	if _, err := DB.Exec("PRAGMA foreign_keys = ON"); err != nil {
		return fmt.Errorf("activer foreign keys: %w", err)
	}

	if _, err := DB.Exec(schemaSQL); err != nil {
		return fmt.Errorf("appliquer le schéma: %w", err)
	}

	return nil
}

func Close() error {
	if DB == nil {
		return nil
	}
	return DB.Close()
}
