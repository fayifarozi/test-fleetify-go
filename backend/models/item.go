package models

import "time"

type Item struct {
	ID        uint      `gorm:"primaryKey" json:"id"`
	Code      string    `gorm:"type:varchar(50);uniqueIndex;not null" json:"code"`
	Name      string    `gorm:"type:varchar(255);not null" json:"name"`
	Price     float64   `gorm:"type:decimal(15,2);not null" json:"price"`
	CreatedAt time.Time `json:"created_at"`
	UpdatedAt time.Time `json:"updated_at"`
}
