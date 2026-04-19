package config

import "os"

type AppConfig struct {
	AppPort   string
	JWTSecret string
}

func LoadConfig() *AppConfig {
	return &AppConfig{
		AppPort:   getEnv("APP_PORT", "8089"),
		JWTSecret: getEnv("JWT_SECRET", "super-secret-jwt-key-change-in-production"),
	}
}

func getEnv(key, fallback string) string {
	if val, ok := os.LookupEnv(key); ok {
		return val
	}
	return fallback
}
