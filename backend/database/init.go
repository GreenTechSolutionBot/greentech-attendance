package database

import (
	"database/sql"
	"fmt"
	"log"

	"golang.org/x/crypto/bcrypt"
)

func InitDatabase(db *sql.DB) error {
	_, err := db.Exec(`
		CREATE TABLE IF NOT EXISTS users (
			id SERIAL PRIMARY KEY,
			username VARCHAR(50) UNIQUE NOT NULL,
			password VARCHAR(255) NOT NULL,
			name VARCHAR(100) NOT NULL,
			email VARCHAR(100),
			phone VARCHAR(20),
			role VARCHAR(20) DEFAULT 'employee',
			department VARCHAR(100),
			position VARCHAR(100),
			created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
			updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
		)
	`)
	if err != nil {
		return fmt.Errorf("create users table failed: %v", err)
	}
	log.Println("✓ Users table created")

	_, err = db.Exec(`
		CREATE TABLE IF NOT EXISTS attendance_records (
			id SERIAL PRIMARY KEY,
			user_id INTEGER REFERENCES users(id) ON DELETE CASCADE,
			check_in_time TIMESTAMP NOT NULL,
			check_out_time TIMESTAMP,
			status VARCHAR(20) DEFAULT 'normal',
			notes TEXT,
			location VARCHAR(255),
			created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
		)
	`)
	if err != nil {
		return fmt.Errorf("create attendance_records table failed: %v", err)
	}
	log.Println("✓ Attendance records table created")

	_, err = db.Exec(`
		CREATE TABLE IF NOT EXISTS leave_requests (
			id SERIAL PRIMARY KEY,
			user_id INTEGER REFERENCES users(id) ON DELETE CASCADE,
			leave_type VARCHAR(50) NOT NULL,
			start_date DATE NOT NULL,
			end_date DATE NOT NULL,
			days DECIMAL(5,1) NOT NULL,
			reason TEXT,
			status VARCHAR(20) DEFAULT 'pending',
			approver_id INTEGER REFERENCES users(id),
			approved_at TIMESTAMP,
			approval_notes TEXT,
			remark TEXT,
			created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
			updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
		)
	`)
	if err != nil {
		return fmt.Errorf("create leave_requests table failed: %v", err)
	}
	log.Println("✓ Leave requests table created")

	// 添加remark字段到已存在的表（如果不存在）
	_, err = db.Exec(`
		DO $$ 
		BEGIN
			IF NOT EXISTS (
				SELECT 1 FROM information_schema.columns 
				WHERE table_name='leave_requests' AND column_name='remark'
			) THEN
				ALTER TABLE leave_requests ADD COLUMN remark TEXT;
			END IF;
		END $$;
	`)
	if err != nil {
		log.Printf("Warning: could not add remark column: %v", err)
	}

	_, err = db.Exec(`
		CREATE TABLE IF NOT EXISTS leave_balances (
			id SERIAL PRIMARY KEY,
			user_id INTEGER REFERENCES users(id) ON DELETE CASCADE,
			year INTEGER NOT NULL,
			annual_leave DECIMAL(5,1) DEFAULT 0,
			sick_leave DECIMAL(5,1) DEFAULT 0,
			personal_leave DECIMAL(5,1) DEFAULT 0,
			created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
			updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
			UNIQUE(user_id, year)
		)
	`)
	if err != nil {
		return fmt.Errorf("create leave_balances table failed: %v", err)
	}
	log.Println("✓ Leave balances table created")

	_, err = db.Exec(`
		CREATE INDEX IF NOT EXISTS idx_attendance_user_id ON attendance_records(user_id);
		CREATE INDEX IF NOT EXISTS idx_attendance_date ON attendance_records(check_in_time);
		CREATE INDEX IF NOT EXISTS idx_leave_user_id ON leave_requests(user_id);
		CREATE INDEX IF NOT EXISTS idx_leave_status ON leave_requests(status);
	`)
	if err != nil {
		return fmt.Errorf("create indexes failed: %v", err)
	}
	log.Println("✓ Indexes created")

	var count int
	err = db.QueryRow("SELECT COUNT(*) FROM users WHERE username = 'admin'").Scan(&count)
	if err != nil {
		return fmt.Errorf("check admin account failed: %v", err)
	}

	if count == 0 {
		hashedPassword, err := bcrypt.GenerateFromPassword([]byte("admin123"), bcrypt.DefaultCost)
		if err != nil {
			return fmt.Errorf("password encryption failed: %v", err)
		}

		_, err = db.Exec(`
			INSERT INTO users (username, password, name, role, department, position)
			VALUES ($1, $2, $3, $4, $5, $6)
		`, "admin", string(hashedPassword), "系统管理员", "admin", "管理部", "系统管理员")
		if err != nil {
			return fmt.Errorf("create admin account failed: %v", err)
		}
		log.Println("✓ Default admin account created (username: admin, password: admin123)")
	}

	return nil
}
