package handlers

import (
	"database/sql"
	"net/http"
	"time"

	"greentech-attendance/models"

	"github.com/gin-gonic/gin"
)

type LeaveHandler struct {
	DB *sql.DB
}

type CreateLeaveRequestRequest struct {
	LeaveType string  `json:"leave_type" binding:"required,oneof=annual sick personal other"`
	StartDate string  `json:"start_date" binding:"required"`
	EndDate   string  `json:"end_date" binding:"required"`
	Days      float64 `json:"days" binding:"required,gt=0"`
	Reason    string  `json:"reason" binding:"required"`
}

type ApproveLeaveRequestRequest struct {
	Status     string `json:"status" binding:"required,oneof=approved rejected"`
	ApproverID int    `json:"approver_id" binding:"required"`
	Remark     string `json:"remark"`
}

type UpdateLeaveBalanceRequest struct {
	UserID        int     `json:"user_id" binding:"required"`
	Year          int     `json:"year" binding:"required"`
	AnnualLeave   float64 `json:"annual_leave" binding:"required,gte=0"`
	SickLeave     float64 `json:"sick_leave" binding:"required,gte=0"`
	PersonalLeave float64 `json:"personal_leave" binding:"required,gte=0"`
}

func (h *LeaveHandler) CreateLeaveRequest(c *gin.Context) {
	userID, _ := c.Get("user_id")
	var req CreateLeaveRequestRequest
	if err := c.ShouldBindJSON(&req); err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": "请求参数错误"})
		return
	}

	startDate, _ := time.Parse("2006-01-02", req.StartDate)
	endDate, _ := time.Parse("2006-01-02", req.EndDate)
	if endDate.Before(startDate) {
		c.JSON(http.StatusBadRequest, gin.H{"error": "结束日期不能早于开始日期"})
		return
	}

	currentYear := time.Now().Year()
	var balance models.LeaveBalance
	err := h.DB.QueryRow(`
		SELECT annual_leave, sick_leave, personal_leave 
		FROM leave_balances 
		WHERE user_id = $1 AND year = $2
	`, userID, currentYear).Scan(&balance.AnnualLeave, &balance.SickLeave, &balance.PersonalLeave)

	if err == sql.ErrNoRows {
		_, err = h.DB.Exec(`
			INSERT INTO leave_balances (user_id, year, annual_leave, sick_leave, personal_leave)
			VALUES ($1, $2, 10, 10, 5)
		`, userID, currentYear)
		if err != nil {
			c.JSON(http.StatusInternalServerError, gin.H{"error": "初始化假期余额失败"})
			return
		}
		balance.AnnualLeave = 10
		balance.SickLeave = 10
		balance.PersonalLeave = 5
	}

	switch req.LeaveType {
	case "annual":
		if balance.AnnualLeave < req.Days {
			c.JSON(http.StatusBadRequest, gin.H{"error": "年假余额不足"})
			return
		}
	case "sick":
		if balance.SickLeave < req.Days {
			c.JSON(http.StatusBadRequest, gin.H{"error": "病假余额不足"})
			return
		}
	case "personal":
		if balance.PersonalLeave < req.Days {
			c.JSON(http.StatusBadRequest, gin.H{"error": "事假余额不足"})
			return
		}
	}

	var requestID int
	err = h.DB.QueryRow(`
		INSERT INTO leave_requests (user_id, leave_type, start_date, end_date, days, reason, status)
		VALUES ($1, $2, $3, $4, $5, $6, 'pending')
		RETURNING id
	`, userID, req.LeaveType, startDate, endDate, req.Days, req.Reason).Scan(&requestID)

	if err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": "创建请假申请失败"})
		return
	}

	c.JSON(http.StatusCreated, gin.H{
		"message":    "请假申请已提交",
		"request_id": requestID,
	})
}

func (h *LeaveHandler) GetMyLeaveRequests(c *gin.Context) {
	userID, _ := c.Get("user_id")
	status := c.Query("status")

	query := `
		SELECT id, user_id, leave_type, start_date, end_date, days, 
			   reason, status, approver_id, remark, created_at, updated_at
		FROM leave_requests 
		WHERE user_id = $1
	`
	args := []interface{}{userID}

	if status != "" {
		query += " AND status = $2"
		args = append(args, status)
	}
	query += " ORDER BY created_at DESC"

	rows, err := h.DB.Query(query, args...)
	if err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": "获取请假记录失败"})
		return
	}
	defer rows.Close()

	requests := []models.LeaveRequest{}
	for rows.Next() {
		var req models.LeaveRequest
		var approverID sql.NullInt64
		var remark sql.NullString
		err := rows.Scan(
			&req.ID, &req.UserID, &req.LeaveType, &req.StartDate, &req.EndDate,
			&req.Days, &req.Reason, &req.Status, &approverID, &remark,
			&req.CreatedAt, &req.UpdatedAt,
		)
		if err != nil {
			continue
		}
		if approverID.Valid {
			aid := int(approverID.Int64)
			req.ApproverID = &aid
		}
		req.Remark = remark.String
		requests = append(requests, req)
	}

	c.JSON(http.StatusOK, requests)
}

func (h *LeaveHandler) GetAllLeaveRequests(c *gin.Context) {
	status := c.Query("status")

	query := `
		SELECT l.id, l.user_id, u.name, u.department, 
			   l.leave_type, l.start_date, l.end_date, l.days, 
			   l.reason, l.status, l.approver_id, l.remark, 
			   l.created_at, l.updated_at
		FROM leave_requests l
		JOIN users u ON l.user_id = u.id
	`
	args := []interface{}{}

	if status != "" {
		query += " WHERE l.status = $1"
		args = append(args, status)
	}
	query += " ORDER BY l.created_at DESC"

	rows, err := h.DB.Query(query, args...)
	if err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": "获取请假记录失败"})
		return
	}
	defer rows.Close()

	type LeaveRequestWithUser struct {
		models.LeaveRequest
		UserName       string `json:"user_name"`
		UserDepartment string `json:"user_department"`
	}

	requests := []LeaveRequestWithUser{}
	for rows.Next() {
		var req LeaveRequestWithUser
		var approverID sql.NullInt64
		var remark, dept sql.NullString
		err := rows.Scan(
			&req.ID, &req.UserID, &req.UserName, &dept,
			&req.LeaveType, &req.StartDate, &req.EndDate, &req.Days,
			&req.Reason, &req.Status, &approverID, &remark,
			&req.CreatedAt, &req.UpdatedAt,
		)
		if err != nil {
			continue
		}
		if approverID.Valid {
			aid := int(approverID.Int64)
			req.ApproverID = &aid
		}
		req.Remark = remark.String
		req.UserDepartment = dept.String
		requests = append(requests, req)
	}

	c.JSON(http.StatusOK, requests)
}

func (h *LeaveHandler) ApproveLeaveRequest(c *gin.Context) {
	id := c.Param("id")
	var req ApproveLeaveRequestRequest
	if err := c.ShouldBindJSON(&req); err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": "请求参数错误"})
		return
	}

	var leave models.LeaveRequest
	err := h.DB.QueryRow(`
		SELECT user_id, leave_type, days, status 
		FROM leave_requests 
		WHERE id = $1
	`, id).Scan(&leave.UserID, &leave.LeaveType, &leave.Days, &leave.Status)

	if err == sql.ErrNoRows {
		c.JSON(http.StatusNotFound, gin.H{"error": "请假申请不存在"})
		return
	}

	if leave.Status != "pending" {
		c.JSON(http.StatusBadRequest, gin.H{"error": "该申请已被处理"})
		return
	}

	tx, err := h.DB.Begin()
	if err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": "开启事务失败"})
		return
	}
	defer tx.Rollback()

	_, err = tx.Exec(`
		UPDATE leave_requests 
		SET status = $1, approver_id = $2, remark = $3, updated_at = CURRENT_TIMESTAMP
		WHERE id = $4
	`, req.Status, req.ApproverID, req.Remark, id)

	if err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": "更新申请状态失败"})
		return
	}

	if req.Status == "approved" {
		currentYear := time.Now().Year()
		var column string
		switch leave.LeaveType {
		case "annual":
			column = "annual_leave"
		case "sick":
			column = "sick_leave"
		case "personal":
			column = "personal_leave"
		default:
			column = "annual_leave"
		}

		query := `UPDATE leave_balances SET ` + column + ` = ` + column + ` - $1 WHERE user_id = $2 AND year = $3`
		_, err = tx.Exec(query, leave.Days, leave.UserID, currentYear)
		if err != nil {
			c.JSON(http.StatusInternalServerError, gin.H{"error": "更新假期余额失败"})
			return
		}
	}

	if err := tx.Commit(); err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": "提交事务失败"})
		return
	}

	c.JSON(http.StatusOK, gin.H{"message": "处理成功"})
}

func (h *LeaveHandler) GetLeaveBalance(c *gin.Context) {
	userID, _ := c.Get("user_id")
	currentYear := time.Now().Year()

	var balance models.LeaveBalance
	err := h.DB.QueryRow(`
		SELECT id, user_id, year, annual_leave, sick_leave, personal_leave
		FROM leave_balances 
		WHERE user_id = $1 AND year = $2
	`, userID, currentYear).Scan(
		&balance.ID, &balance.UserID, &balance.Year,
		&balance.AnnualLeave, &balance.SickLeave, &balance.PersonalLeave,
	)

	if err == sql.ErrNoRows {
		_, err = h.DB.Exec(`
			INSERT INTO leave_balances (user_id, year, annual_leave, sick_leave, personal_leave)
			VALUES ($1, $2, 10, 10, 5)
		`, userID, currentYear)
		if err != nil {
			c.JSON(http.StatusInternalServerError, gin.H{"error": "初始化假期余额失败"})
			return
		}
		balance.UserID = userID.(int)
		balance.Year = currentYear
		balance.AnnualLeave = 10
		balance.SickLeave = 10
		balance.PersonalLeave = 5
	} else if err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": "获取假期余额失败"})
		return
	}

	c.JSON(http.StatusOK, balance)
}

func (h *LeaveHandler) GetAllLeaveBalances(c *gin.Context) {
	currentYear := time.Now().Year()
	year := c.DefaultQuery("year", "")

	query := `
		SELECT lb.id, lb.user_id, u.name, u.department, u.position,
			   lb.year, lb.annual_leave, lb.sick_leave, lb.personal_leave
		FROM leave_balances lb
		JOIN users u ON lb.user_id = u.id
	`
	args := []interface{}{}

	if year != "" {
		query += " WHERE lb.year = $1"
		args = append(args, year)
	} else {
		query += " WHERE lb.year = $1"
		args = append(args, currentYear)
	}
	query += " ORDER BY u.department, u.name"

	rows, err := h.DB.Query(query, args...)
	if err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": "获取假期余额失败"})
		return
	}
	defer rows.Close()

	type LeaveBalanceWithUser struct {
		models.LeaveBalance
		UserName       string `json:"user_name"`
		UserDepartment string `json:"user_department"`
		UserPosition   string `json:"user_position"`
	}

	balances := []LeaveBalanceWithUser{}
	for rows.Next() {
		var balance LeaveBalanceWithUser
		var dept, position sql.NullString
		err := rows.Scan(
			&balance.ID, &balance.UserID, &balance.UserName, &dept, &position,
			&balance.Year, &balance.AnnualLeave, &balance.SickLeave, &balance.PersonalLeave,
		)
		if err != nil {
			continue
		}
		balance.UserDepartment = dept.String
		balance.UserPosition = position.String
		balances = append(balances, balance)
	}

	c.JSON(http.StatusOK, balances)
}

func (h *LeaveHandler) UpdateLeaveBalance(c *gin.Context) {
	var req UpdateLeaveBalanceRequest
	if err := c.ShouldBindJSON(&req); err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": "请求参数错误"})
		return
	}

	// 检查用户是否存在
	var userName string
	err := h.DB.QueryRow("SELECT name FROM users WHERE id = $1", req.UserID).Scan(&userName)
	if err == sql.ErrNoRows {
		c.JSON(http.StatusNotFound, gin.H{"error": "用户不存在"})
		return
	}
	if err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": "查询用户失败"})
		return
	}

	// 检查假期余额记录是否存在
	var existingID int
	err = h.DB.QueryRow(`
		SELECT id FROM leave_balances 
		WHERE user_id = $1 AND year = $2
	`, req.UserID, req.Year).Scan(&existingID)

	if err == sql.ErrNoRows {
		// 如果不存在，创建新记录
		_, err = h.DB.Exec(`
			INSERT INTO leave_balances (user_id, year, annual_leave, sick_leave, personal_leave)
			VALUES ($1, $2, $3, $4, $5)
		`, req.UserID, req.Year, req.AnnualLeave, req.SickLeave, req.PersonalLeave)
		if err != nil {
			c.JSON(http.StatusInternalServerError, gin.H{"error": "创建假期余额失败"})
			return
		}
		c.JSON(http.StatusCreated, gin.H{
			"message": "假期余额设置成功",
			"user_id": req.UserID,
			"year":    req.Year,
		})
	} else if err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": "查询假期余额失败"})
		return
	} else {
		// 如果存在，更新记录
		_, err = h.DB.Exec(`
			UPDATE leave_balances 
			SET annual_leave = $1, sick_leave = $2, personal_leave = $3
			WHERE user_id = $4 AND year = $5
		`, req.AnnualLeave, req.SickLeave, req.PersonalLeave, req.UserID, req.Year)
		if err != nil {
			c.JSON(http.StatusInternalServerError, gin.H{"error": "更新假期余额失败"})
			return
		}
		c.JSON(http.StatusOK, gin.H{
			"message": "假期余额更新成功",
			"user_id": req.UserID,
			"year":    req.Year,
		})
	}
}
