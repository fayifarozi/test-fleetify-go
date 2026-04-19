package main

import (
	"fmt"
	"log"

	"backend/config"
	"backend/database"
	"backend/router"

	"github.com/gofiber/fiber/v3"
)

func main() {
	cfg := config.LoadConfig()

	db := config.InitDatabase()

	database.RunMigrations(db)
	database.RunSeeder(db)
	app := fiber.New(fiber.Config{
		AppName: "API v1.0",
	})

	app.Get("/check", func(c fiber.Ctx) error {
		return c.JSON(fiber.Map{
			"status":  "ok",
			"message": "API is running",
		})
	})

	router.SetupRoutes(app, db)

	addr := fmt.Sprintf(":%s", cfg.AppPort)
	log.Printf("API starting on %s", addr)
	log.Fatal(app.Listen(addr))
}
