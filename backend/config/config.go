package config

import (
	"os"
	"strconv"
)

type Config struct {
	Port            string
	DBHost          string
	DBPort          string
	DBName          string
	DBUser          string
	DBPassword      string
	DBSSLMode       string
	JWTSecret       string
	JWTExpiresHours int
}

func LoadConfig() *Config {
	expiresHours, _ := strconv.Atoi(getEnv("JWT_EXPIRES_HOURS", "24"))

	return &Config{
		Port:            getEnv("PORT", "8080"),
		DBHost:          getEnv("DB_HOST", "localhost"),
		DBPort:          getEnv("DB_PORT", "5432"),
		DBName:          getEnv("DB_NAME", "greentech_attendance"),
		DBUser:          getEnv("DB_USER", "postgres"),
		DBPassword:      getEnv("DB_PASSWORD", ""),
		DBSSLMode:       getEnv("DB_SSLMODE", "disable"),
		JWTSecret:       getEnv("JWT_SECRET", "your-secret-key"),
		JWTExpiresHours: expiresHours,
	}
}

func getEnv(key, defaultValue string) string {
	if value := os.Getenv(key); value != "" {
		return value
	}
	return defaultValue
}
