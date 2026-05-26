package main

import (
	"log"

	"github.com/Ombraze/Forum.js/src/db"
	"github.com/Ombraze/Forum.js/src"
)

func main() {
	if err := db.Init(db.DefaultPath); err != nil {
		log.Fatal(err)
	}
	defer db.Close()

	if err := server.Start(server.DefaultAddr); err != nil {
		log.Fatal(err)
	}
}
