'use client';

import api from '@/lib/api';
import type { AttendanceRecord } from '@/types';
import { format } from 'date-fns';
import { useEffect, useState } from 'react';

export default function AttendanceManagePage() {
    const [records, setRecords] = useState<AttendanceRecord[]>([]);
    const [month, setMonth] = useState(format(new Date(), 'yyyy-MM'));
    const [loading, setLoading] = useState(false);

    useEffect(() => {
        loadRecords();
    }, [month]);

    const loadRecords = async () => {
        setLoading(true);
        try {
            const response = await api.get(`/attendance?month=${month}`);
            setRecords(response.data);
        } catch (error) {
            console.error('加载考勤记录失败:', error);
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
                考勤管理
            </h1>

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
                    <div style={{ overflowX: 'auto' }}>
                        <table className="table">
                            <thead>
                                <tr>
                                    <th>员工姓名</th>
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
                                        <td>{record.user_name}</td>
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
                    </div>
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
