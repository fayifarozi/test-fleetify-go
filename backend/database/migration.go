package database

import (
	"log"

	"backend/models"

	"gorm.io/gorm"
)

func RunMigrations(db *gorm.DB) {
	log.Println("Running database migrations...")

	err := db.AutoMigrate(
		&models.User{},
		&models.Item{},
		&models.Invoice{},
		&models.InvoiceDetail{},
	)
	if err != nil {
		log.Fatalf("Migration failed: %v", err)
	}

	log.Println("Database migrations completed successfully")
}
