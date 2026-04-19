package models

import "time"

type Invoice struct {
	ID             uint            `gorm:"primaryKey" json:"id"`
	InvoiceNumber  string          `gorm:"type:varchar(100);uniqueIndex;not null" json:"invoice_number"`
	SenderName     string          `gorm:"type:varchar(255);not null" json:"sender_name"`
	SenderAddress  string          `gorm:"type:text" json:"sender_address"`
	ReceiverName   string          `gorm:"type:varchar(255);not null" json:"receiver_name"`
	TotalAmount    float64         `gorm:"type:decimal(15,2);not null;default:0" json:"total_amount"`
	CreatedBy      uint            `gorm:"not null" json:"created_by"`
	Creator        User            `gorm:"foreignKey:CreatedBy" json:"creator,omitempty"`
	InvoiceDetails []InvoiceDetail `gorm:"foreignKey:InvoiceID" json:"invoice_details,omitempty"`
	CreatedAt      time.Time       `json:"created_at"`
	UpdatedAt      time.Time       `json:"updated_at"`
}

type InvoiceDetail struct {
	ID        uint      `gorm:"primaryKey" json:"id"`
	InvoiceID uint      `gorm:"not null;index" json:"invoice_id"`
	ItemID    uint      `gorm:"not null" json:"item_id"`
	Quantity  int       `gorm:"not null" json:"quantity"`
	Price     float64   `gorm:"type:decimal(15,2);not null" json:"price"`
	Item      Item      `gorm:"foreignKey:ItemID" json:"item,omitempty"`
	CreatedAt time.Time `json:"created_at"`
	UpdatedAt time.Time `json:"updated_at"`
}

// DTO
type CreateInvoiceRequest struct {
	SenderName    string                       `json:"sender_name" validate:"required"`
	SenderAddress string                       `json:"sender_address"`
	ReceiverName  string                       `json:"receiver_name" validate:"required"`
	Items         []CreateInvoiceDetailRequest `json:"items" validate:"required,min=1"`
}

type CreateInvoiceDetailRequest struct {
	ItemID   uint `json:"item_id" validate:"required"`
	Quantity int  `json:"quantity" validate:"required,min=1"`
}

type InvoiceResponse struct {
	ID            uint                    `json:"id"`
	InvoiceNumber string                  `json:"invoice_number"`
	SenderName    string                  `json:"sender_name"`
	SenderAddress string                  `json:"sender_address"`
	ReceiverName  string                  `json:"receiver_name"`
	TotalAmount   float64                 `json:"total_amount"`
	CreatedBy     uint                    `json:"created_by"`
	CreatorName   string                  `json:"creator_name,omitempty"`
	Items         []InvoiceDetailResponse `json:"items,omitempty"`
	CreatedAt     time.Time               `json:"created_at"`
}

type InvoiceDetailResponse struct {
	ID       uint    `json:"id"`
	ItemID   uint    `json:"item_id"`
	ItemCode string  `json:"item_code"`
	ItemName string  `json:"item_name"`
	Quantity int     `json:"quantity"`
	Price    float64 `json:"price"`
	Subtotal float64 `json:"subtotal"`
}
