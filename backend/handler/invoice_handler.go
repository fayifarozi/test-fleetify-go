package handler

import (
	"fmt"
	"math/rand"
	"strconv"
	"time"

	"backend/models"

	"github.com/gofiber/fiber/v3"
	"gorm.io/gorm"
)

type InvoiceHandler struct {
	DB *gorm.DB
}

func NewInvoiceHandler(db *gorm.DB) *InvoiceHandler {
	return &InvoiceHandler{DB: db}
}

func (h *InvoiceHandler) CreateInvoice(c fiber.Ctx) error {
	var req models.CreateInvoiceRequest

	if err := c.Bind().JSON(&req); err != nil {
		return c.Status(fiber.StatusBadRequest).JSON(fiber.Map{
			"error": "Invalid request body",
		})
	}

	if req.SenderName == "" {
		return c.Status(fiber.StatusBadRequest).JSON(fiber.Map{
			"error": "sender_name is required",
		})
	}
	if req.ReceiverName == "" {
		return c.Status(fiber.StatusBadRequest).JSON(fiber.Map{
			"error": "receiver_name is required",
		})
	}
	if len(req.Items) == 0 {
		return c.Status(fiber.StatusBadRequest).JSON(fiber.Map{
			"error": "At least one item is required",
		})
	}

	userID, ok := c.Locals("user_id").(uint)
	if !ok {
		return c.Status(fiber.StatusUnauthorized).JSON(fiber.Map{
			"error": "Invalid user context",
		})
	}

	var createdInvoice models.Invoice

	err := h.DB.Transaction(func(tx *gorm.DB) error {
		invoiceNumber := generateInvoiceNumber()

		itemIDs := make([]uint, len(req.Items))
		quantityMap := make(map[uint]int)
		for i, detail := range req.Items {
			itemIDs[i] = detail.ItemID
			if detail.Quantity <= 0 {
				return fiber.NewError(fiber.StatusBadRequest,
					fmt.Sprintf("Invalid quantity for item_id %d", detail.ItemID))
			}
			quantityMap[detail.ItemID] = detail.Quantity
		}

		var dbItems []models.Item
		if err := tx.Where("id IN ?", itemIDs).Find(&dbItems).Error; err != nil {
			return fiber.NewError(fiber.StatusInternalServerError, "Failed to fetch item prices")
		}

		if len(dbItems) != len(itemIDs) {
			return fiber.NewError(fiber.StatusBadRequest, "One or more items not found in database")
		}

		itemPriceMap := make(map[uint]float64)
		for _, item := range dbItems {
			itemPriceMap[item.ID] = item.Price
		}

		var totalAmount float64
		invoiceDetails := make([]models.InvoiceDetail, len(req.Items))

		for i, detail := range req.Items {
			price, exists := itemPriceMap[detail.ItemID]
			if !exists {
				return fiber.NewError(fiber.StatusBadRequest,
					fmt.Sprintf("Item with ID %d not found", detail.ItemID))
			}

			subtotal := price * float64(detail.Quantity)
			totalAmount += subtotal

			invoiceDetails[i] = models.InvoiceDetail{
				ItemID:   detail.ItemID,
				Quantity: detail.Quantity,
				Price:    price,
			}
		}

		invoice := models.Invoice{
			InvoiceNumber: invoiceNumber,
			SenderName:    req.SenderName,
			SenderAddress: req.SenderAddress,
			ReceiverName:  req.ReceiverName,
			TotalAmount:   totalAmount,
			CreatedBy:     userID,
		}

		if err := tx.Create(&invoice).Error; err != nil {
			return fiber.NewError(fiber.StatusInternalServerError, "Failed to create invoice")
		}

		for i := range invoiceDetails {
			invoiceDetails[i].InvoiceID = invoice.ID
		}

		if err := tx.Create(&invoiceDetails).Error; err != nil {
			return fiber.NewError(fiber.StatusInternalServerError, "Failed to create invoice details")
		}

		createdInvoice = invoice
		createdInvoice.InvoiceDetails = invoiceDetails

		return nil
	})

	if err != nil {
		if fiberErr, ok := err.(*fiber.Error); ok {
			return c.Status(fiberErr.Code).JSON(fiber.Map{
				"error": fiberErr.Message,
			})
		}

		return c.Status(fiber.StatusInternalServerError).JSON(fiber.Map{
			"error": "Failed to create invoice: " + err.Error(),
		})
	}

	h.DB.Preload("InvoiceDetails.Item").Preload("Creator").First(&createdInvoice, createdInvoice.ID)

	return c.Status(fiber.StatusCreated).JSON(fiber.Map{
		"message": "Invoice created successfully",
		"data":    toInvoiceResponse(createdInvoice),
	})
}

func (h *InvoiceHandler) GetInvoices(c fiber.Ctx) error {
	pageStr := c.Query("page", "1")
	limitStr := c.Query("limit", "10")

	page, err := strconv.Atoi(pageStr)
	if err != nil || page < 1 {
		page = 1
	}

	limit, err := strconv.Atoi(limitStr)
	if err != nil || limit < 1 {
		limit = 10
	}

	offset := (page - 1) * limit

	var invoices []models.Invoice
	var total int64

	if err := h.DB.Model(&models.Invoice{}).Count(&total).Error; err != nil {
		return c.Status(fiber.StatusInternalServerError).JSON(fiber.Map{
			"error": "Failed to count invoices",
		})
	}

	if err := h.DB.Preload("Creator").
		Order("created_at DESC").
		Offset(offset).
		Limit(limit).
		Find(&invoices).Error; err != nil {
		return c.Status(fiber.StatusInternalServerError).JSON(fiber.Map{
			"error": "Failed to fetch invoices",
		})
	}

	response := make([]models.InvoiceResponse, len(invoices))
	for i, inv := range invoices {
		response[i] = toInvoiceResponse(inv)
	}

	return c.JSON(fiber.Map{
		"data": response,
		"meta": fiber.Map{
			"page":        page,
			"limit":       limit,
			"total":       total,
			"total_pages": (int(total) + limit - 1) / limit,
		},
	})
}

func (h *InvoiceHandler) GetInvoice(c fiber.Ctx) error {
	id := c.Params("id")

	var invoice models.Invoice
	if err := h.DB.Preload("InvoiceDetails.Item").
		Preload("Creator").
		First(&invoice, id).Error; err != nil {
		if err == gorm.ErrRecordNotFound {
			return c.Status(fiber.StatusNotFound).JSON(fiber.Map{
				"error": "Invoice not found",
			})
		}
		return c.Status(fiber.StatusInternalServerError).JSON(fiber.Map{
			"error": "Failed to fetch invoice",
		})
	}

	return c.JSON(fiber.Map{
		"data": toInvoiceResponse(invoice),
	})
}

func generateInvoiceNumber() string {
	now := time.Now()
	random := rand.Intn(99999)
	return fmt.Sprintf("INV-%s-%05d", now.Format("20060102"), random)
}

func toInvoiceResponse(inv models.Invoice) models.InvoiceResponse {
	resp := models.InvoiceResponse{
		ID:            inv.ID,
		InvoiceNumber: inv.InvoiceNumber,
		SenderName:    inv.SenderName,
		SenderAddress: inv.SenderAddress,
		ReceiverName:  inv.ReceiverName,
		TotalAmount:   inv.TotalAmount,
		CreatedBy:     inv.CreatedBy,
		CreatedAt:     inv.CreatedAt,
	}

	if inv.Creator.ID != 0 {
		resp.CreatorName = inv.Creator.Username
	}

	if len(inv.InvoiceDetails) > 0 {
		resp.Items = make([]models.InvoiceDetailResponse, len(inv.InvoiceDetails))
		for i, detail := range inv.InvoiceDetails {
			resp.Items[i] = models.InvoiceDetailResponse{
				ID:       detail.ID,
				ItemID:   detail.ItemID,
				ItemCode: detail.Item.Code,
				ItemName: detail.Item.Name,
				Quantity: detail.Quantity,
				Price:    detail.Price,
				Subtotal: detail.Price * float64(detail.Quantity),
			}
		}
	}

	return resp
}
