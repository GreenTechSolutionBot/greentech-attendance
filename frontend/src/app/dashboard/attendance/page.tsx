'use client';

import api from '@/lib/api';
import type { AttendanceRecord } from '@/types';
import { format } from 'date-fns';
import { useEffect, useState } from 'react';

export default function AttendancePage() {
    const [records, setRecords] = useState<AttendanceRecord[]>([]);
    const [month, setMonth] = useState(format(new Date(), 'yyyy-MM'));
    const [loading, setLoading] = useState(false);

    useEffect(() => {
        loadRecords();
    }, [month]);

    const loadRecords = async () => {
        setLoading(true);
        try {
            const response = await api.get(`/attendance/my?month=${month}`);
            setRecords(response.data);
        } catch (error) {
            console.error('加载考勤记录失败:', error);
        } finally {
            setLoading(false);
        }
    };

    const handleCheckIn = async () => {
        try {
            await api.post('/attendance/check-in', {});
            alert('签到成功！');
            loadRecords();
        } catch (error: any) {
            alert(error.response?.data?.error || '签到失败');
        }
    };

    const handleCheckOut = async () => {
        try {
            await api.post('/attendance/check-out', {});
            alert('签退成功！');
            loadRecords();
        } catch (error: any) {
            alert(error.response?.data?.error || '签退失败');
        }
    };

    return (
        <div>
            <div className="flex-between mb-4">
                <h1 style={{ fontSize: '28px', fontWeight: 'bold' }}>
                    我的考勤
                </h1>
                <div className="flex gap-2">
                    <button onClick={handleCheckIn} className="btn btn-success">
                        签到
                    </button>
                    <button
                        onClick={handleCheckOut}
                        className="btn btn-primary"
                    >
                        签退
                    </button>
                </div>
            </div>

            <div className="card">
                <div className="flex-between mb-4">
                    <h2 style={{ fontSize: '18px', fontWeight: '600' }}>
                        考勤记录
                    </h2>
                    <input
                        type="month"
                        className="form-input"
                        style={{ width: 'auto' }}
                        value={month}
                        onChange={(e) => setMonth(e.target.value)}
                    />
                </div>

                {loading ? (
                    <p
                        className="text-center"
                        style={{ padding: '40px', color: '#6b7280' }}
                    >
                        加载中...
                    </p>
                ) : records.length > 0 ? (
                    <table className="table">
                        <thead>
                            <tr>
                                <th>日期</th>
                                <th>签到时间</th>
                                <th>签退时间</th>
                                <th>状态</th>
                                <th>备注</th>
                                <th>位置</th>
                            </tr>
                        </thead>
                        <tbody>
                            {records.map((record) => (
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
                                    <td>{record.notes || '-'}</td>
                                    <td>{record.location || '-'}</td>
                                </tr>
                            ))}
                        </tbody>
                    </table>
                ) : (
                    <p
                        className="text-center"
                        style={{ padding: '40px', color: '#6b7280' }}
                    >
                        该月份暂无考勤记录
                    </p>
                )}
            </div>
        </div>
    );
}
