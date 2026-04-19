package database

import (
	"log"
	"os"
	"strings"

	"gorm.io/gorm"
)

func RunSeeder(db *gorm.DB) {
	log.Println("Running database seeders...")
	seedInitData(db)
	log.Println("Database seeding completed successfully")
}

func seedInitData(db *gorm.DB) {
	query, err := os.ReadFile("database/migrations/002_seed_init.sql")
	if err != nil {
		log.Fatal(err)
	}
	sqlString := string(query)

	queries := strings.Split(sqlString, ";")
	for _, query := range queries {
		query = strings.TrimSpace(query)
		if query == "" {
			continue
		}
		err = db.Exec(query).Error
		if err != nil {
			log.Printf("Failed to seed item: %v", err)
		}
	}
}
