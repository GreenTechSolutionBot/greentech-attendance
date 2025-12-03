export interface User {
    id: number;
    username: string;
    name: string;
    email?: string;
    phone?: string;
    role: string;
    department?: string;
    position?: string;
    created_at?: string;
}

export interface AttendanceRecord {
    id: number;
    user_id: number;
    user_name?: string;
    check_in_time: string;
    check_out_time?: string;
    check_in_location?: string;
    check_out_location?: string;
    status: string;
    notes?: string;
    location?: string;
    created_at: string;
}

export interface LeaveRequest {
    id: number;
    user_id: number;
    user_name?: string;
    leave_type: string;
    start_date: string;
    end_date: string;
    days: number;
    reason?: string;
    status: string;
    approver_id?: number;
    approver_name?: string;
    approved_at?: string;
    approval_notes?: string;
    remark?: string;
    created_at: string;
    updated_at: string;
}

export interface LeaveBalance {
    id: number;
    user_id: number;
    user_name?: string;
    user_department?: string;
    user_position?: string;
    year: number;
    annual_leave: number;
    sick_leave: number;
    personal_leave: number;
}
