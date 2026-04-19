package database

import (
	"log"
	"os"

	"gorm.io/gorm"
)

func RunSeeder(db *gorm.DB) {
	log.Println("Running database seeders...")
	seedInitData(db)
	log.Println("Database seeding completed successfully")
}

func seedInitData(db *gorm.DB) {
	query, err := os.ReadFile("migrations/002_seed_init.sql")
	if err != nil {
		log.Fatal(err)
	}

	sqlString := string(query)

	err = db.Exec(sqlString).Error
	if err != nil {
		log.Printf("Failed to seed item: %v", err)
	}
}
