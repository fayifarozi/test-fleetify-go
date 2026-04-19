package router

import (
	"backend/handler"
	"backend/middleware"

	"github.com/gofiber/fiber/v3"
	"gorm.io/gorm"
)

func SetupRoutes(app *fiber.App, db *gorm.DB) {
	authHandler := handler.NewAuthHandler(db)
	itemHandler := handler.NewItemHandler(db)
	invoiceHandler := handler.NewInvoiceHandler(db)

	api := app.Group("/api")

	api.Post("/login", authHandler.Login)
	api.Get("/items", itemHandler.GetItems)

	protected := api.Group("", middleware.JWTMiddleware())

	protected.Post("/invoices", invoiceHandler.CreateInvoice)
	protected.Get("/invoices", invoiceHandler.GetInvoices)
	protected.Get("/invoices/:id", invoiceHandler.GetInvoice)
}
