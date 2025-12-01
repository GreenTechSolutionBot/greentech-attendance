'use client';

import api from '@/lib/api';
import type { AttendanceRecord, LeaveRequest, User } from '@/types';
import { format } from 'date-fns';
import { useEffect, useState } from 'react';

export default function DashboardPage() {
    const [user, setUser] = useState<User | null>(null);
    const [todayStatus, setTodayStatus] = useState<any>(null);
    const [recentAttendance, setRecentAttendance] = useState<
        AttendanceRecord[]
    >([]);
    const [recentLeave, setRecentLeave] = useState<LeaveRequest[]>([]);
    const [loading, setLoading] = useState(false);

    useEffect(() => {
        const userData = localStorage.getItem('user');
        if (userData) {
            setUser(JSON.parse(userData));
        }
        loadData();
    }, []);

    const loadData = async () => {
        try {
            const [statusRes, attendanceRes, leaveRes] = await Promise.all([
                api.get('/attendance/today'),
                api.get('/attendance/my'),
                api.get('/leave-requests/my'),
            ]);

            setTodayStatus(statusRes.data);
            setRecentAttendance(attendanceRes.data.slice(0, 5));
            setRecentLeave(leaveRes.data.slice(0, 5));
        } catch (error) {
            console.error('加载数据失败:', error);
        }
    };

    const handleCheckIn = async () => {
        setLoading(true);
        try {
            await api.post('/attendance/check-in', {});
            alert('签到成功！');
            loadData();
        } catch (error: any) {
            alert(error.response?.data?.error || '签到失败');
        } finally {
            setLoading(false);
        }
    };

    const handleCheckOut = async () => {
        setLoading(true);
        try {
            await api.post('/attendance/check-out', {});
            alert('签退成功！');
            loadData();
        } catch (error: any) {
            alert(error.response?.data?.error || '签退失败');
        } finally {
            setLoading(false);
        }
    };

    return (
        <div>
            <h1
                style={{
                    fontSize: '28px',
                    fontWeight: 'bold',
                    marginBottom: '30px',
                }}
            >
                工作台
            </h1>

            {/* 快速操作卡片 */}
            <div
                style={{
                    display: 'grid',
                    gridTemplateColumns: 'repeat(auto-fit, minmax(250px, 1fr))',
                    gap: '20px',
                    marginBottom: '30px',
                }}
            >
                <div
                    className="card"
                    style={{
                        background:
                            'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
                        color: 'white',
                    }}
                >
                    <h3
                        style={{
                            fontSize: '16px',
                            marginBottom: '10px',
                            opacity: 0.9,
                        }}
                    >
                        今日考勤
                    </h3>
                    <div style={{ fontSize: '14px', marginBottom: '20px' }}>
                        {todayStatus?.has_checked_in ? (
                            <>
                                <p>✓ 已签到</p>
                                {todayStatus.has_checked_out && <p>✓ 已签退</p>}
                            </>
                        ) : (
                            <p>未签到</p>
                        )}
                    </div>
                    <div style={{ display: 'flex', gap: '10px' }}>
                        {!todayStatus?.has_checked_in && (
                            <button
                                onClick={handleCheckIn}
                                disabled={loading}
                                style={{
                                    padding: '8px 16px',
                                    background: 'rgba(255,255,255,0.2)',
                                    border: '1px solid white',
                                    color: 'white',
                                    borderRadius: '6px',
                                    fontSize: '14px',
                                    cursor: 'pointer',
                                }}
                            >
                                签到
                            </button>
                        )}
                        {todayStatus?.has_checked_in &&
                            !todayStatus?.has_checked_out && (
                                <button
                                    onClick={handleCheckOut}
                                    disabled={loading}
                                    style={{
                                        padding: '8px 16px',
                                        background: 'rgba(255,255,255,0.2)',
                                        border: '1px solid white',
                                        color: 'white',
                                        borderRadius: '6px',
                                        fontSize: '14px',
                                        cursor: 'pointer',
                                    }}
                                >
                                    签退
                                </button>
                            )}
                    </div>
                </div>

                <div
                    className="card"
                    style={{
                        background:
                            'linear-gradient(135deg, #f093fb 0%, #f5576c 100%)',
                        color: 'white',
                    }}
                >
                    <h3
                        style={{
                            fontSize: '16px',
                            marginBottom: '10px',
                            opacity: 0.9,
                        }}
                    >
                        个人信息
                    </h3>
                    <p style={{ fontSize: '14px', marginBottom: '5px' }}>
                        姓名：{user?.name}
                    </p>
                    <p style={{ fontSize: '14px', marginBottom: '5px' }}>
                        部门：{user?.department || '-'}
                    </p>
                    <p style={{ fontSize: '14px' }}>
                        职位：{user?.position || '-'}
                    </p>
                </div>
            </div>

            {/* 最近考勤记录 */}
            <div className="card" style={{ marginBottom: '30px' }}>
                <h2
                    style={{
                        fontSize: '18px',
                        fontWeight: '600',
                        marginBottom: '20px',
                    }}
                >
                    最近考勤记录
                </h2>
                {recentAttendance.length > 0 ? (
                    <table className="table">
                        <thead>
                            <tr>
                                <th>日期</th>
                                <th>签到时间</th>
                                <th>签退时间</th>
                                <th>状态</th>
                            </tr>
                        </thead>
                        <tbody>
                            {recentAttendance.map((record) => (
                                <tr key={record.id}>
                                    <td>
                                        {format(
                                            new Date(record.check_in_time),
                                            'yyyy-MM-dd'
                                        )}
                                    </td>
                                    <td>
                                        {format(
                                            new Date(record.check_in_time),
                                            'HH:mm:ss'
                                        )}
                                    </td>
                                    <td>
                                        {record.check_out_time
                                            ? format(
                                                  new Date(
                                                      record.check_out_time
                                                  ),
                                                  'HH:mm:ss'
                                              )
                                            : '-'}
                                    </td>
                                    <td>
                                        <span
                                            className={`badge ${
                                                record.status === 'normal'
                                                    ? 'badge-success'
                                                    : 'badge-warning'
                                            }`}
                                        >
                                            {record.status === 'normal'
                                                ? '正常'
                                                : '迟到'}
                                        </span>
                                    </td>
                                </tr>
                            ))}
                        </tbody>
                    </table>
                ) : (
                    <p
                        style={{
                            color: '#6b7280',
                            textAlign: 'center',
                            padding: '20px',
                        }}
                    >
                        暂无考勤记录
                    </p>
                )}
            </div>

            {/* 最近休假申请 */}
            <div className="card">
                <h2
                    style={{
                        fontSize: '18px',
                        fontWeight: '600',
                        marginBottom: '20px',
                    }}
                >
                    最近休假申请
                </h2>
                {recentLeave.length > 0 ? (
                    <table className="table">
                        <thead>
                            <tr>
                                <th>类型</th>
                                <th>开始日期</th>
                                <th>结束日期</th>
                                <th>天数</th>
                                <th>状态</th>
                            </tr>
                        </thead>
                        <tbody>
                            {recentLeave.map((leave) => (
                                <tr key={leave.id}>
                                    <td>
                                        {leave.leave_type === 'annual'
                                            ? '年假'
                                            : leave.leave_type === 'sick'
                                            ? '病假'
                                            : '事假'}
                                    </td>
                                    <td>{leave.start_date}</td>
                                    <td>{leave.end_date}</td>
                                    <td>{leave.days} 天</td>
                                    <td>
                                        <span
                                            className={`badge ${
                                                leave.status === 'approved'
                                                    ? 'badge-success'
                                                    : leave.status ===
                                                      'rejected'
                                                    ? 'badge-danger'
                                                    : 'badge-warning'
                                            }`}
                                        >
                                            {leave.status === 'approved'
                                                ? '已批准'
                                                : leave.status === 'rejected'
                                                ? '已拒绝'
                                                : '待审批'}
                                        </span>
                                    </td>
                                </tr>
                            ))}
                        </tbody>
                    </table>
                ) : (
                    <p
                        style={{
                            color: '#6b7280',
                            textAlign: 'center',
                            padding: '20px',
                        }}
                    >
                        暂无休假申请
                    </p>
                )}
            </div>
        </div>
    );
}
