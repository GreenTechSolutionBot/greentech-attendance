package handlers

import (
	"database/sql"
	"net/http"
	"time"

	"greentech-attendance/models"

	"github.com/gin-gonic/gin"
)

type AttendanceHandler struct {
	DB *sql.DB
}

type CheckInRequest struct {
	Location string `json:"location"`
}

type CheckOutRequest struct {
	Location string `json:"location"`
}

func (h *AttendanceHandler) CheckIn(c *gin.Context) {
	userID, _ := c.Get("user_id")
	var req CheckInRequest
	c.ShouldBindJSON(&req)

	today := time.Now().Format("2006-01-02")
	var existingID int
	err := h.DB.QueryRow(`
		SELECT id FROM attendance_records 
		WHERE user_id = $1 AND DATE(check_in_time) = $2
	`, userID, today).Scan(&existingID)

	if err == nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": "今日已签到"})
		return
	}

	var recordID int
	err = h.DB.QueryRow(`
		INSERT INTO attendance_records (user_id, check_in_time, check_in_location)
		VALUES ($1, $2, $3)
		RETURNING id
	`, userID, time.Now(), req.Location).Scan(&recordID)

	if err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": "签到失败"})
		return
	}

	c.JSON(http.StatusOK, gin.H{
		"message":       "签到成功",
		"record_id":     recordID,
		"check_in_time": time.Now().Format("2006-01-02 15:04:05"),
	})
}

func (h *AttendanceHandler) CheckOut(c *gin.Context) {
	userID, _ := c.Get("user_id")
	var req CheckOutRequest
	c.ShouldBindJSON(&req)

	today := time.Now().Format("2006-01-02")
	var recordID int
	var checkOutTime sql.NullTime
	err := h.DB.QueryRow(`
		SELECT id, check_out_time FROM attendance_records 
		WHERE user_id = $1 AND DATE(check_in_time) = $2
	`, userID, today).Scan(&recordID, &checkOutTime)

	if err == sql.ErrNoRows {
		c.JSON(http.StatusBadRequest, gin.H{"error": "今日未签到"})
		return
	}

	if checkOutTime.Valid {
		c.JSON(http.StatusBadRequest, gin.H{"error": "今日已签退"})
		return
	}

	checkOutTimeNow := time.Now()
	_, err = h.DB.Exec(`
		UPDATE attendance_records 
		SET check_out_time = $1, check_out_location = $2
		WHERE id = $3
	`, checkOutTimeNow, req.Location, recordID)

	if err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": "签退失败"})
		return
	}

	c.JSON(http.StatusOK, gin.H{
		"message":        "签退成功",
		"check_out_time": checkOutTimeNow.Format("2006-01-02 15:04:05"),
	})
}

func (h *AttendanceHandler) GetMyAttendance(c *gin.Context) {
	userID, _ := c.Get("user_id")
	startDate := c.DefaultQuery("start_date", time.Now().AddDate(0, -1, 0).Format("2006-01-02"))
	endDate := c.DefaultQuery("end_date", time.Now().Format("2006-01-02"))

	rows, err := h.DB.Query(`
		SELECT id, user_id, check_in_time, check_out_time, 
			   check_in_location, check_out_location, status, created_at
		FROM attendance_records 
		WHERE user_id = $1 AND DATE(check_in_time) BETWEEN $2 AND $3
		ORDER BY check_in_time DESC
	`, userID, startDate, endDate)

	if err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": "获取考勤记录失败"})
		return
	}
	defer rows.Close()

	records := []models.AttendanceRecord{}
	for rows.Next() {
		var record models.AttendanceRecord
		var checkOutTime sql.NullTime
		var checkInLoc, checkOutLoc, status sql.NullString
		err := rows.Scan(
			&record.ID, &record.UserID, &record.CheckInTime, &checkOutTime,
			&checkInLoc, &checkOutLoc, &status, &record.CreatedAt,
		)
		if err != nil {
			continue
		}
		if checkOutTime.Valid {
			record.CheckOutTime = &checkOutTime.Time
		}
		record.CheckInLocation = checkInLoc.String
		record.CheckOutLocation = checkOutLoc.String
		record.Status = status.String
		records = append(records, record)
	}

	c.JSON(http.StatusOK, records)
}

func (h *AttendanceHandler) GetTodayStatus(c *gin.Context) {
	userID, _ := c.Get("user_id")
	today := time.Now().Format("2006-01-02")

	var record models.AttendanceRecord
	var checkOutTime sql.NullTime
	var checkInLoc, checkOutLoc, status sql.NullString
	err := h.DB.QueryRow(`
		SELECT id, user_id, check_in_time, check_out_time, 
			   check_in_location, check_out_location, status, created_at
		FROM attendance_records 
		WHERE user_id = $1 AND DATE(check_in_time) = $2
	`, userID, today).Scan(
		&record.ID, &record.UserID, &record.CheckInTime, &checkOutTime,
		&checkInLoc, &checkOutLoc, &status, &record.CreatedAt,
	)

	if err == sql.ErrNoRows {
		c.JSON(http.StatusOK, gin.H{
			"checked_in": false,
			"message":    "今日未签到",
		})
		return
	}

	if err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": "获取今日状态失败"})
		return
	}

	if checkOutTime.Valid {
		record.CheckOutTime = &checkOutTime.Time
	}
	record.CheckInLocation = checkInLoc.String
	record.CheckOutLocation = checkOutLoc.String
	record.Status = status.String

	c.JSON(http.StatusOK, gin.H{
		"checked_in":  true,
		"checked_out": checkOutTime.Valid,
		"record":      record,
	})
}

func (h *AttendanceHandler) GetAllAttendance(c *gin.Context) {
	startDate := c.DefaultQuery("start_date", time.Now().AddDate(0, -1, 0).Format("2006-01-02"))
	endDate := c.DefaultQuery("end_date", time.Now().Format("2006-01-02"))

	rows, err := h.DB.Query(`
		SELECT a.id, a.user_id, u.name, u.department, 
			   a.check_in_time, a.check_out_time, 
			   a.check_in_location, a.check_out_location, 
			   a.status, a.created_at
		FROM attendance_records a
		JOIN users u ON a.user_id = u.id
		WHERE DATE(a.check_in_time) BETWEEN $1 AND $2
		ORDER BY a.check_in_time DESC
	`, startDate, endDate)

	if err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": "获取考勤记录失败"})
		return
	}
	defer rows.Close()

	type AttendanceWithUser struct {
		models.AttendanceRecord
		UserName       string `json:"user_name"`
		UserDepartment string `json:"user_department"`
	}

	records := []AttendanceWithUser{}
	for rows.Next() {
		var record AttendanceWithUser
		var checkOutTime sql.NullTime
		var checkInLoc, checkOutLoc, status, dept sql.NullString
		err := rows.Scan(
			&record.ID, &record.UserID, &record.UserName, &dept,
			&record.CheckInTime, &checkOutTime,
			&checkInLoc, &checkOutLoc, &status, &record.CreatedAt,
		)
		if err != nil {
			continue
		}
		if checkOutTime.Valid {
			record.CheckOutTime = &checkOutTime.Time
		}
		record.CheckInLocation = checkInLoc.String
		record.CheckOutLocation = checkOutLoc.String
		record.Status = status.String
		record.UserDepartment = dept.String
		records = append(records, record)
	}

	c.JSON(http.StatusOK, records)
}
