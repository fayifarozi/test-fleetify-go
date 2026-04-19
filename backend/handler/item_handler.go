package handler

import (
	"backend/models"

	"github.com/gofiber/fiber/v3"
	"gorm.io/gorm"
)

type ItemHandler struct {
	DB *gorm.DB
}

func NewItemHandler(db *gorm.DB) *ItemHandler {
	return &ItemHandler{DB: db}
}

func (h *ItemHandler) GetItems(c fiber.Ctx) error {
	var items []models.Item
	code := c.Query("code", "")

	query := h.DB
	if code != "" {
		query = query.Where("code LIKE ?", "%"+code+"%")
	}

	if err := query.Order("code ASC").Find(&items).Error; err != nil {
		return c.Status(fiber.StatusInternalServerError).JSON(fiber.Map{
			"error": "Failed to fetch items",
		})
	}

	return c.JSON(fiber.Map{
		"data": items,
	})
}
