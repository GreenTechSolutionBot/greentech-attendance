package handlers

import (
	"database/sql"
	"net/http"
	"strconv"
	"time"

	"greentech-attendance/models"

	"github.com/gin-gonic/gin"
	"golang.org/x/crypto/bcrypt"
)

type UserHandler struct {
	DB *sql.DB
}

type CreateUserRequest struct {
	Username   string `json:"username" binding:"required"`
	Password   string `json:"password" binding:"required,min=6"`
	Name       string `json:"name" binding:"required"`
	Email      string `json:"email"`
	Phone      string `json:"phone"`
	Role       string `json:"role" binding:"required,oneof=admin manager employee"`
	Department string `json:"department"`
	Position   string `json:"position"`
}

type UpdateUserRequest struct {
	Name       string `json:"name"`
	Email      string `json:"email"`
	Phone      string `json:"phone"`
	Department string `json:"department"`
	Position   string `json:"position"`
}

func (h *UserHandler) GetUsers(c *gin.Context) {
	rows, err := h.DB.Query(`
		SELECT id, username, name, email, phone, role, department, position, created_at
		FROM users ORDER BY created_at DESC
	`)
	if err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": "获取用户列表失败"})
		return
	}
	defer rows.Close()

	users := []models.User{}
	for rows.Next() {
		var user models.User
		var email, phone, department, position sql.NullString
		err := rows.Scan(
			&user.ID, &user.Username, &user.Name, &email, &phone,
			&user.Role, &department, &position, &user.CreatedAt,
		)
		if err != nil {
			continue
		}
		user.Email = email.String
		user.Phone = phone.String
		user.Department = department.String
		user.Position = position.String
		users = append(users, user)
	}

	c.JSON(http.StatusOK, users)
}

func (h *UserHandler) GetUser(c *gin.Context) {
	id := c.Param("id")
	userID, _ := c.Get("user_id")
	role, _ := c.Get("role")

	if role != "admin" && strconv.Itoa(userID.(int)) != id {
		c.JSON(http.StatusForbidden, gin.H{"error": "无权访问"})
		return
	}

	var user models.User
	var email, phone, department, position sql.NullString
	err := h.DB.QueryRow(`
		SELECT id, username, name, email, phone, role, department, position, created_at
		FROM users WHERE id = $1
	`, id).Scan(
		&user.ID, &user.Username, &user.Name, &email, &phone,
		&user.Role, &department, &position, &user.CreatedAt,
	)

	if err == sql.ErrNoRows {
		c.JSON(http.StatusNotFound, gin.H{"error": "用户不存在"})
		return
	}
	if err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": "获取用户信息失败"})
		return
	}

	user.Email = email.String
	user.Phone = phone.String
	user.Department = department.String
	user.Position = position.String

	c.JSON(http.StatusOK, user)
}

func (h *UserHandler) CreateUser(c *gin.Context) {
	var req CreateUserRequest
	if err := c.ShouldBindJSON(&req); err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": "请求参数错误"})
		return
	}

	hashedPassword, err := bcrypt.GenerateFromPassword([]byte(req.Password), bcrypt.DefaultCost)
	if err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": "密码加密失败"})
		return
	}

	var userID int
	err = h.DB.QueryRow(`
		INSERT INTO users (username, password, name, email, phone, role, department, position)
		VALUES ($1, $2, $3, $4, $5, $6, $7, $8)
		RETURNING id
	`, req.Username, string(hashedPassword), req.Name, req.Email, req.Phone,
		req.Role, req.Department, req.Position).Scan(&userID)

	if err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": "用户名已存在或创建失败"})
		return
	}

	currentYear := time.Now().Year()
	_, err = h.DB.Exec(`
		INSERT INTO leave_balances (user_id, year, annual_leave, sick_leave, personal_leave)
		VALUES ($1, $2, 10, 10, 5)
	`, userID, currentYear)

	c.JSON(http.StatusCreated, gin.H{
		"id":         userID,
		"username":   req.Username,
		"name":       req.Name,
		"role":       req.Role,
		"department": req.Department,
		"position":   req.Position,
	})
}

func (h *UserHandler) UpdateUser(c *gin.Context) {
	id := c.Param("id")
	userID, _ := c.Get("user_id")
	role, _ := c.Get("role")

	if role != "admin" && strconv.Itoa(userID.(int)) != id {
		c.JSON(http.StatusForbidden, gin.H{"error": "无权访问"})
		return
	}

	var req UpdateUserRequest
	if err := c.ShouldBindJSON(&req); err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": "请求参数错误"})
		return
	}

	_, err := h.DB.Exec(`
		UPDATE users 
		SET name = COALESCE(NULLIF($1, ''), name),
			email = COALESCE(NULLIF($2, ''), email),
			phone = COALESCE(NULLIF($3, ''), phone),
			department = COALESCE(NULLIF($4, ''), department),
			position = COALESCE(NULLIF($5, ''), position),
			updated_at = CURRENT_TIMESTAMP
		WHERE id = $6
	`, req.Name, req.Email, req.Phone, req.Department, req.Position, id)

	if err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": "更新用户失败"})
		return
	}

	c.JSON(http.StatusOK, gin.H{"message": "更新成功"})
}

func (h *UserHandler) DeleteUser(c *gin.Context) {
	id := c.Param("id")

	result, err := h.DB.Exec("DELETE FROM users WHERE id = $1", id)
	if err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": "删除用户失败"})
		return
	}

	rowsAffected, _ := result.RowsAffected()
	if rowsAffected == 0 {
		c.JSON(http.StatusNotFound, gin.H{"error": "用户不存在"})
		return
	}

	c.JSON(http.StatusOK, gin.H{"message": "删除成功"})
}
