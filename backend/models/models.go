package models

import "time"

type User struct {
	ID         int       `json:"id"`
	Username   string    `json:"username"`
	Password   string    `json:"-"`
	Name       string    `json:"name"`
	Email      string    `json:"email"`
	Phone      string    `json:"phone"`
	Role       string    `json:"role"`
	Department string    `json:"department"`
	Position   string    `json:"position"`
	CreatedAt  time.Time `json:"created_at"`
	UpdatedAt  time.Time `json:"updated_at"`
}

type AttendanceRecord struct {
	ID               int        `json:"id"`
	UserID           int        `json:"user_id"`
	UserName         string     `json:"user_name,omitempty"`
	CheckInTime      time.Time  `json:"check_in_time"`
	CheckOutTime     *time.Time `json:"check_out_time"`
	CheckInLocation  string     `json:"check_in_location"`
	CheckOutLocation string     `json:"check_out_location"`
	Status           string     `json:"status"`
	CreatedAt        time.Time  `json:"created_at"`
}

type LeaveRequest struct {
	ID           int       `json:"id"`
	UserID       int       `json:"user_id"`
	UserName     string    `json:"user_name,omitempty"`
	LeaveType    string    `json:"leave_type"`
	StartDate    string    `json:"start_date"`
	EndDate      string    `json:"end_date"`
	Days         float64   `json:"days"`
	Reason       string    `json:"reason"`
	Status       string    `json:"status"`
	ApproverID   *int      `json:"approver_id"`
	ApproverName string    `json:"approver_name,omitempty"`
	Remark       string    `json:"remark"`
	CreatedAt    time.Time `json:"created_at"`
	UpdatedAt    time.Time `json:"updated_at"`
}

type LeaveBalance struct {
	ID            int       `json:"id"`
	UserID        int       `json:"user_id"`
	Year          int       `json:"year"`
	AnnualLeave   float64   `json:"annual_leave"`
	SickLeave     float64   `json:"sick_leave"`
	PersonalLeave float64   `json:"personal_leave"`
	CreatedAt     time.Time `json:"created_at"`
	UpdatedAt     time.Time `json:"updated_at"`
}
