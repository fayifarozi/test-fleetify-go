package router

import (
	"backend/handler"

	"github.com/gofiber/fiber/v3"
	"gorm.io/gorm"
)

func SetupRoutes(app *fiber.App, db *gorm.DB) {
	authHandler := handler.NewAuthHandler(db)

	api := app.Group("/api")

	api.Post("/login", authHandler.Login)

}
