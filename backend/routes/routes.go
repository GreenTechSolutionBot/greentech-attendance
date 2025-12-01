package routes

import (
	"database/sql"
	"greentech-attendance/config"
	"greentech-attendance/database"
	"greentech-attendance/handlers"
	"greentech-attendance/middleware"

	"github.com/gin-gonic/gin"
)

func SetupRoutes(router *gin.Engine, db *sql.DB, cfg *config.Config) {
	if err := database.InitDatabase(db); err != nil {
		panic(err)
	}
	authHandler := &handlers.AuthHandler{DB: db, Cfg: cfg}
	userHandler := &handlers.UserHandler{DB: db}
	attendanceHandler := &handlers.AttendanceHandler{DB: db}
	leaveHandler := &handlers.LeaveHandler{DB: db}
	api := router.Group("/api")
	api.POST("/auth/login", authHandler.Login)
	auth := api.Group("")
	auth.Use(middleware.AuthMiddleware(cfg))
	auth.POST("/auth/change-password", authHandler.ChangePassword)
	auth.GET("/users/:id", userHandler.GetUser)
	auth.PUT("/users/:id", userHandler.UpdateUser)
	auth.POST("/attendance/check-in", attendanceHandler.CheckIn)
	auth.POST("/attendance/check-out", attendanceHandler.CheckOut)
	auth.GET("/attendance/my", attendanceHandler.GetMyAttendance)
	auth.GET("/attendance/today", attendanceHandler.GetTodayStatus)
	auth.POST("/leave-requests", leaveHandler.CreateLeaveRequest)
	auth.GET("/leave-requests/my", leaveHandler.GetMyLeaveRequests)
	auth.GET("/leave-balances/my", leaveHandler.GetLeaveBalance)
	admin := auth.Group("")
	admin.Use(middleware.AdminMiddleware())
	admin.GET("/users", userHandler.GetUsers)
	admin.POST("/users", userHandler.CreateUser)
	admin.DELETE("/users/:id", userHandler.DeleteUser)
	admin.GET("/attendance", attendanceHandler.GetAllAttendance)
	admin.GET("/leave-requests", leaveHandler.GetAllLeaveRequests)
	admin.PUT("/leave-requests/:id/approve", leaveHandler.ApproveLeaveRequest)
	admin.GET("/leave-balances", leaveHandler.GetAllLeaveBalances)
	admin.PUT("/leave-balances", leaveHandler.UpdateLeaveBalance)
}
