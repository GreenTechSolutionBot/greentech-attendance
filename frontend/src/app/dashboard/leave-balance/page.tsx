'use client';

import {
    CalendarToday,
    LocalHospital,
    NoteAlt,
    TrendingDown,
    TrendingUp,
} from '@mui/icons-material';
import {
    Alert,
    Box,
    Card,
    CardContent,
    Chip,
    Grid,
    LinearProgress,
    Paper,
    Table,
    TableBody,
    TableCell,
    TableContainer,
    TableHead,
    TableRow,
    Typography,
} from '@mui/material';
import axios from 'axios';
import { useEffect, useState } from 'react';

const API_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:8080/api';

interface LeaveBalance {
    id: number;
    user_id: number;
    year: number;
    annual_leave: number;
    sick_leave: number;
    personal_leave: number;
}

interface LeaveRecord {
    id: number;
    leave_type: string;
    start_date: string;
    end_date: string;
    days: number;
    reason: string;
    status: string;
    created_at: string;
}

export default function MyLeaveBalancePage() {
    const [balance, setBalance] = useState<LeaveBalance | null>(null);
    const [recentLeaves, setRecentLeaves] = useState<LeaveRecord[]>([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState('');

    useEffect(() => {
        fetchData();
    }, []);

    const fetchData = async () => {
        try {
            setLoading(true);
            setError('');
            const token = localStorage.getItem('token');

            // 获取假期余额
            const balanceResponse = await axios.get(
                `${API_URL}/leave-balances/my`,
                {
                    headers: { Authorization: `Bearer ${token}` },
                }
            );
            setBalance(balanceResponse.data);

            // 获取最近的请假记录
            const leavesResponse = await axios.get(
                `${API_URL}/leave-requests/my`,
                {
                    headers: { Authorization: `Bearer ${token}` },
                }
            );
            setRecentLeaves((leavesResponse.data || []).slice(0, 5));
        } catch (err: any) {
            setError(err.response?.data?.error || '获取假期信息失败');
        } finally {
            setLoading(false);
        }
    };

    const getBalanceColor = (value: number, total: number = 10) => {
        const percentage = (value / total) * 100;
        if (percentage >= 80) return 'success';
        if (percentage >= 50) return 'warning';
        return 'error';
    };

    const getLeaveTypeLabel = (type: string) => {
        const labels: { [key: string]: string } = {
            annual: '年假',
            sick: '病假',
            personal: '事假',
            other: '其他',
        };
        return labels[type] || type;
    };

    const getStatusLabel = (status: string) => {
        const labels: { [key: string]: string } = {
            pending: '待审批',
            approved: '已批准',
            rejected: '已拒绝',
        };
        return labels[status] || status;
    };

    const getStatusColor = (status: string) => {
        const colors: { [key: string]: any } = {
            pending: 'warning',
            approved: 'success',
            rejected: 'error',
        };
        return colors[status] || 'default';
    };

    if (loading) {
        return (
            <Box sx={{ p: 3, textAlign: 'center' }}>
                <Typography color="text.secondary">加载中...</Typography>
            </Box>
        );
    }

    return (
        <Box sx={{ p: 3 }}>
            {/* 标题 */}
            <Box sx={{ mb: 4 }}>
                <Typography variant="h4" fontWeight="bold" gutterBottom>
                    我的假期余额
                </Typography>
                <Typography variant="body2" color="text.secondary">
                    查看当前年度的假期余额和使用情况
                </Typography>
            </Box>

            {/* 错误提示 */}
            {error && (
                <Alert
                    severity="error"
                    sx={{ mb: 3 }}
                    onClose={() => setError('')}
                >
                    {error}
                </Alert>
            )}

            {balance && (
                <>
                    {/* 余额卡片 */}
                    <Grid container spacing={3} sx={{ mb: 4 }}>
                        <Grid item xs={12} md={4}>
                            <Card
                                sx={{
                                    background:
                                        'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
                                    color: 'white',
                                }}
                            >
                                <CardContent>
                                    <Box
                                        sx={{
                                            display: 'flex',
                                            alignItems: 'center',
                                            mb: 2,
                                        }}
                                    >
                                        <CalendarToday sx={{ mr: 1 }} />
                                        <Typography variant="h6">
                                            年假
                                        </Typography>
                                    </Box>
                                    <Typography variant="h3" fontWeight="bold">
                                        {balance.annual_leave}
                                        <Typography
                                            component="span"
                                            variant="h6"
                                            sx={{ ml: 1 }}
                                        >
                                            天
                                        </Typography>
                                    </Typography>
                                    <Box sx={{ mt: 2 }}>
                                        <LinearProgress
                                            variant="determinate"
                                            value={
                                                (balance.annual_leave / 10) *
                                                100
                                            }
                                            sx={{
                                                'height': 8,
                                                'borderRadius': 4,
                                                'backgroundColor':
                                                    'rgba(255,255,255,0.3)',
                                                '& .MuiLinearProgress-bar': {
                                                    backgroundColor: 'white',
                                                },
                                            }}
                                        />
                                        <Typography
                                            variant="caption"
                                            sx={{ mt: 1, display: 'block' }}
                                        >
                                            剩余 {balance.annual_leave} / 总共
                                            10 天
                                        </Typography>
                                    </Box>
                                </CardContent>
                            </Card>
                        </Grid>

                        <Grid item xs={12} md={4}>
                            <Card
                                sx={{
                                    background:
                                        'linear-gradient(135deg, #f093fb 0%, #f5576c 100%)',
                                    color: 'white',
                                }}
                            >
                                <CardContent>
                                    <Box
                                        sx={{
                                            display: 'flex',
                                            alignItems: 'center',
                                            mb: 2,
                                        }}
                                    >
                                        <LocalHospital sx={{ mr: 1 }} />
                                        <Typography variant="h6">
                                            病假
                                        </Typography>
                                    </Box>
                                    <Typography variant="h3" fontWeight="bold">
                                        {balance.sick_leave}
                                        <Typography
                                            component="span"
                                            variant="h6"
                                            sx={{ ml: 1 }}
                                        >
                                            天
                                        </Typography>
                                    </Typography>
                                    <Box sx={{ mt: 2 }}>
                                        <LinearProgress
                                            variant="determinate"
                                            value={
                                                (balance.sick_leave / 10) * 100
                                            }
                                            sx={{
                                                'height': 8,
                                                'borderRadius': 4,
                                                'backgroundColor':
                                                    'rgba(255,255,255,0.3)',
                                                '& .MuiLinearProgress-bar': {
                                                    backgroundColor: 'white',
                                                },
                                            }}
                                        />
                                        <Typography
                                            variant="caption"
                                            sx={{ mt: 1, display: 'block' }}
                                        >
                                            剩余 {balance.sick_leave} / 总共 10
                                            天
                                        </Typography>
                                    </Box>
                                </CardContent>
                            </Card>
                        </Grid>

                        <Grid item xs={12} md={4}>
                            <Card
                                sx={{
                                    background:
                                        'linear-gradient(135deg, #4facfe 0%, #00f2fe 100%)',
                                    color: 'white',
                                }}
                            >
                                <CardContent>
                                    <Box
                                        sx={{
                                            display: 'flex',
                                            alignItems: 'center',
                                            mb: 2,
                                        }}
                                    >
                                        <NoteAlt sx={{ mr: 1 }} />
                                        <Typography variant="h6">
                                            事假
                                        </Typography>
                                    </Box>
                                    <Typography variant="h3" fontWeight="bold">
                                        {balance.personal_leave}
                                        <Typography
                                            component="span"
                                            variant="h6"
                                            sx={{ ml: 1 }}
                                        >
                                            天
                                        </Typography>
                                    </Typography>
                                    <Box sx={{ mt: 2 }}>
                                        <LinearProgress
                                            variant="determinate"
                                            value={
                                                (balance.personal_leave / 5) *
                                                100
                                            }
                                            sx={{
                                                'height': 8,
                                                'borderRadius': 4,
                                                'backgroundColor':
                                                    'rgba(255,255,255,0.3)',
                                                '& .MuiLinearProgress-bar': {
                                                    backgroundColor: 'white',
                                                },
                                            }}
                                        />
                                        <Typography
                                            variant="caption"
                                            sx={{ mt: 1, display: 'block' }}
                                        >
                                            剩余 {balance.personal_leave} / 总共
                                            5 天
                                        </Typography>
                                    </Box>
                                </CardContent>
                            </Card>
                        </Grid>
                    </Grid>

                    {/* 使用统计 */}
                    <Grid container spacing={3} sx={{ mb: 4 }}>
                        <Grid item xs={12} md={6}>
                            <Card>
                                <CardContent>
                                    <Box
                                        sx={{
                                            display: 'flex',
                                            alignItems: 'center',
                                            mb: 2,
                                        }}
                                    >
                                        <TrendingDown
                                            sx={{ mr: 1, color: 'error.main' }}
                                        />
                                        <Typography variant="h6">
                                            已使用假期
                                        </Typography>
                                    </Box>
                                    <Typography
                                        variant="h4"
                                        fontWeight="bold"
                                        color="error.main"
                                    >
                                        {(
                                            10 -
                                            balance.annual_leave +
                                            (10 - balance.sick_leave) +
                                            (5 - balance.personal_leave)
                                        ).toFixed(1)}{' '}
                                        天
                                    </Typography>
                                    <Typography
                                        variant="body2"
                                        color="text.secondary"
                                        sx={{ mt: 1 }}
                                    >
                                        年假{' '}
                                        {(10 - balance.annual_leave).toFixed(1)}{' '}
                                        + 病假{' '}
                                        {(10 - balance.sick_leave).toFixed(1)} +
                                        事假{' '}
                                        {(5 - balance.personal_leave).toFixed(
                                            1
                                        )}{' '}
                                        天
                                    </Typography>
                                </CardContent>
                            </Card>
                        </Grid>

                        <Grid item xs={12} md={6}>
                            <Card>
                                <CardContent>
                                    <Box
                                        sx={{
                                            display: 'flex',
                                            alignItems: 'center',
                                            mb: 2,
                                        }}
                                    >
                                        <TrendingUp
                                            sx={{
                                                mr: 1,
                                                color: 'success.main',
                                            }}
                                        />
                                        <Typography variant="h6">
                                            剩余假期
                                        </Typography>
                                    </Box>
                                    <Typography
                                        variant="h4"
                                        fontWeight="bold"
                                        color="success.main"
                                    >
                                        {(
                                            balance.annual_leave +
                                            balance.sick_leave +
                                            balance.personal_leave
                                        ).toFixed(1)}{' '}
                                        天
                                    </Typography>
                                    <Typography
                                        variant="body2"
                                        color="text.secondary"
                                        sx={{ mt: 1 }}
                                    >
                                        年假 {balance.annual_leave} + 病假{' '}
                                        {balance.sick_leave} + 事假{' '}
                                        {balance.personal_leave} 天
                                    </Typography>
                                </CardContent>
                            </Card>
                        </Grid>
                    </Grid>

                    {/* 最近请假记录 */}
                    {recentLeaves.length > 0 && (
                        <Paper sx={{ p: 3 }}>
                            <Typography
                                variant="h6"
                                fontWeight="bold"
                                sx={{ mb: 2 }}
                            >
                                最近请假记录
                            </Typography>
                            <TableContainer>
                                <Table>
                                    <TableHead>
                                        <TableRow>
                                            <TableCell>假期类型</TableCell>
                                            <TableCell>开始日期</TableCell>
                                            <TableCell>结束日期</TableCell>
                                            <TableCell align="center">
                                                天数
                                            </TableCell>
                                            <TableCell>状态</TableCell>
                                            <TableCell>申请时间</TableCell>
                                        </TableRow>
                                    </TableHead>
                                    <TableBody>
                                        {recentLeaves.map((leave) => (
                                            <TableRow key={leave.id} hover>
                                                <TableCell>
                                                    <Chip
                                                        label={getLeaveTypeLabel(
                                                            leave.leave_type
                                                        )}
                                                        size="small"
                                                        color="primary"
                                                        variant="outlined"
                                                    />
                                                </TableCell>
                                                <TableCell>
                                                    {leave.start_date}
                                                </TableCell>
                                                <TableCell>
                                                    {leave.end_date}
                                                </TableCell>
                                                <TableCell align="center">
                                                    <Typography fontWeight="600">
                                                        {leave.days}
                                                    </Typography>
                                                </TableCell>
                                                <TableCell>
                                                    <Chip
                                                        label={getStatusLabel(
                                                            leave.status
                                                        )}
                                                        size="small"
                                                        color={getStatusColor(
                                                            leave.status
                                                        )}
                                                    />
                                                </TableCell>
                                                <TableCell>
                                                    {new Date(
                                                        leave.created_at
                                                    ).toLocaleDateString(
                                                        'zh-CN'
                                                    )}
                                                </TableCell>
                                            </TableRow>
                                        ))}
                                    </TableBody>
                                </Table>
                            </TableContainer>
                        </Paper>
                    )}
                </>
            )}
        </Box>
    );
}
