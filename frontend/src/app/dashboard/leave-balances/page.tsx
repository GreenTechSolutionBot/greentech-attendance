'use client';

import type { LeaveBalance } from '@/types';
import {
    CalendarToday,
    Edit,
    LocalHospital,
    NoteAlt,
    People,
} from '@mui/icons-material';
import {
    Alert,
    Box,
    Button,
    Card,
    CardContent,
    Chip,
    Dialog,
    DialogActions,
    DialogContent,
    DialogTitle,
    FormControl,
    Grid,
    InputLabel,
    LinearProgress,
    MenuItem,
    Paper,
    Select,
    Table,
    TableBody,
    TableCell,
    TableContainer,
    TableHead,
    TableRow,
    TextField,
    Typography,
} from '@mui/material';
import axios from 'axios';
import { useEffect, useState } from 'react';

const API_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:8080/api';

export default function LeaveBalancesPage() {
    const [balances, setBalances] = useState<LeaveBalance[]>([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState('');
    const [selectedYear, setSelectedYear] = useState(new Date().getFullYear());
    const [editingBalance, setEditingBalance] = useState<LeaveBalance | null>(
        null
    );
    const [showEditModal, setShowEditModal] = useState(false);
    const [editForm, setEditForm] = useState({
        annual_leave: 0,
        sick_leave: 0,
        personal_leave: 0,
    });

    useEffect(() => {
        fetchBalances();
    }, [selectedYear]);

    const fetchBalances = async () => {
        try {
            setLoading(true);
            setError('');
            const token = localStorage.getItem('token');
            const response = await axios.get(
                `${API_URL}/leave-balances?year=${selectedYear}`,
                {
                    headers: { Authorization: `Bearer ${token}` },
                }
            );
            setBalances(response.data || []);
        } catch (err: any) {
            setError(err.response?.data?.error || '获取假期余额失败');
        } finally {
            setLoading(false);
        }
    };

    const handleEditClick = (balance: LeaveBalance) => {
        setEditingBalance(balance);
        setEditForm({
            annual_leave: balance.annual_leave,
            sick_leave: balance.sick_leave,
            personal_leave: balance.personal_leave,
        });
        setShowEditModal(true);
    };

    const handleUpdateBalance = async () => {
        if (!editingBalance) return;

        try {
            setError('');
            const token = localStorage.getItem('token');
            await axios.put(
                `${API_URL}/leave-balances`,
                {
                    user_id: editingBalance.user_id,
                    year: selectedYear,
                    annual_leave: editForm.annual_leave,
                    sick_leave: editForm.sick_leave,
                    personal_leave: editForm.personal_leave,
                },
                {
                    headers: { Authorization: `Bearer ${token}` },
                }
            );
            setShowEditModal(false);
            setEditingBalance(null);
            fetchBalances();
        } catch (err: any) {
            setError(err.response?.data?.error || '更新假期余额失败');
        }
    };

    const years = Array.from(
        { length: 5 },
        (_, i) => new Date().getFullYear() - 2 + i
    );

    const getBalanceColor = (value: number, total: number = 10) => {
        const percentage = (value / total) * 100;
        if (percentage >= 80) return 'success';
        if (percentage >= 50) return 'warning';
        if (percentage >= 20) return 'error';
        return 'error';
    };

    const getHealthStatus = (balance: LeaveBalance) => {
        const avgPercentage =
            ((balance.annual_leave / 10 +
                balance.sick_leave / 10 +
                balance.personal_leave / 5) /
                3) *
            100;

        if (avgPercentage >= 70) return { label: '充足', color: 'success' };
        if (avgPercentage >= 40) return { label: '一般', color: 'warning' };
        if (avgPercentage >= 20) return { label: '偏少', color: 'error' };
        return { label: '不足', color: 'error' };
    };

    return (
        <Box sx={{ p: 3 }}>
            {/* 顶部标题和操作区 */}
            <Box
                sx={{
                    display: 'flex',
                    justifyContent: 'space-between',
                    alignItems: 'center',
                    mb: 4,
                }}
            >
                <Box>
                    <Typography variant="h4" fontWeight="bold" gutterBottom>
                        假期余额管理
                    </Typography>
                    <Typography variant="body2" color="text.secondary">
                        查看所有员工的假期余额情况
                    </Typography>
                </Box>

                <FormControl sx={{ minWidth: 120 }}>
                    <InputLabel>年份</InputLabel>
                    <Select
                        value={selectedYear}
                        label="年份"
                        onChange={(e) =>
                            setSelectedYear(Number(e.target.value))
                        }
                    >
                        {years.map((year) => (
                            <MenuItem key={year} value={year}>
                                {year}
                            </MenuItem>
                        ))}
                    </Select>
                </FormControl>
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

            {/* 统计卡片 */}
            <Grid container spacing={3} sx={{ mb: 4 }}>
                <Grid item xs={12} sm={6} md={3}>
                    <Card>
                        <CardContent>
                            <Box sx={{ display: 'flex', alignItems: 'center' }}>
                                <Box
                                    sx={{
                                        p: 2,
                                        borderRadius: 2,
                                        bgcolor: 'primary.light',
                                        color: 'primary.main',
                                        mr: 2,
                                    }}
                                >
                                    <People />
                                </Box>
                                <Box>
                                    <Typography
                                        variant="body2"
                                        color="text.secondary"
                                    >
                                        员工总数
                                    </Typography>
                                    <Typography variant="h5" fontWeight="bold">
                                        {balances.length}
                                    </Typography>
                                </Box>
                            </Box>
                        </CardContent>
                    </Card>
                </Grid>

                <Grid item xs={12} sm={6} md={3}>
                    <Card>
                        <CardContent>
                            <Box sx={{ display: 'flex', alignItems: 'center' }}>
                                <Box
                                    sx={{
                                        p: 2,
                                        borderRadius: 2,
                                        bgcolor: 'success.light',
                                        color: 'success.main',
                                        mr: 2,
                                    }}
                                >
                                    <CalendarToday />
                                </Box>
                                <Box>
                                    <Typography
                                        variant="body2"
                                        color="text.secondary"
                                    >
                                        年假总余额
                                    </Typography>
                                    <Typography variant="h5" fontWeight="bold">
                                        {balances
                                            .reduce(
                                                (sum, b) =>
                                                    sum + b.annual_leave,
                                                0
                                            )
                                            .toFixed(1)}{' '}
                                        <Typography
                                            component="span"
                                            variant="body2"
                                            color="text.secondary"
                                        >
                                            天
                                        </Typography>
                                    </Typography>
                                </Box>
                            </Box>
                        </CardContent>
                    </Card>
                </Grid>

                <Grid item xs={12} sm={6} md={3}>
                    <Card>
                        <CardContent>
                            <Box sx={{ display: 'flex', alignItems: 'center' }}>
                                <Box
                                    sx={{
                                        p: 2,
                                        borderRadius: 2,
                                        bgcolor: 'warning.light',
                                        color: 'warning.main',
                                        mr: 2,
                                    }}
                                >
                                    <LocalHospital />
                                </Box>
                                <Box>
                                    <Typography
                                        variant="body2"
                                        color="text.secondary"
                                    >
                                        病假总余额
                                    </Typography>
                                    <Typography variant="h5" fontWeight="bold">
                                        {balances
                                            .reduce(
                                                (sum, b) => sum + b.sick_leave,
                                                0
                                            )
                                            .toFixed(1)}{' '}
                                        <Typography
                                            component="span"
                                            variant="body2"
                                            color="text.secondary"
                                        >
                                            天
                                        </Typography>
                                    </Typography>
                                </Box>
                            </Box>
                        </CardContent>
                    </Card>
                </Grid>

                <Grid item xs={12} sm={6} md={3}>
                    <Card>
                        <CardContent>
                            <Box sx={{ display: 'flex', alignItems: 'center' }}>
                                <Box
                                    sx={{
                                        p: 2,
                                        borderRadius: 2,
                                        bgcolor: 'secondary.light',
                                        color: 'secondary.main',
                                        mr: 2,
                                    }}
                                >
                                    <NoteAlt />
                                </Box>
                                <Box>
                                    <Typography
                                        variant="body2"
                                        color="text.secondary"
                                    >
                                        事假总余额
                                    </Typography>
                                    <Typography variant="h5" fontWeight="bold">
                                        {balances
                                            .reduce(
                                                (sum, b) =>
                                                    sum + b.personal_leave,
                                                0
                                            )
                                            .toFixed(1)}{' '}
                                        <Typography
                                            component="span"
                                            variant="body2"
                                            color="text.secondary"
                                        >
                                            天
                                        </Typography>
                                    </Typography>
                                </Box>
                            </Box>
                        </CardContent>
                    </Card>
                </Grid>
            </Grid>

            {/* 数据表格 */}
            <TableContainer component={Paper}>
                <Table>
                    <TableHead>
                        <TableRow>
                            <TableCell>姓名</TableCell>
                            <TableCell>部门</TableCell>
                            <TableCell>职位</TableCell>
                            <TableCell>年假余额</TableCell>
                            <TableCell>病假余额</TableCell>
                            <TableCell>事假余额</TableCell>
                            <TableCell>余额状态</TableCell>
                            <TableCell align="center">操作</TableCell>
                        </TableRow>
                    </TableHead>
                    <TableBody>
                        {loading ? (
                            <TableRow>
                                <TableCell colSpan={8} align="center">
                                    <Box sx={{ p: 3 }}>
                                        <Typography color="text.secondary">
                                            加载中...
                                        </Typography>
                                    </Box>
                                </TableCell>
                            </TableRow>
                        ) : balances.length === 0 ? (
                            <TableRow>
                                <TableCell colSpan={8} align="center">
                                    <Box sx={{ p: 3 }}>
                                        <Typography color="text.secondary">
                                            暂无数据
                                        </Typography>
                                    </Box>
                                </TableCell>
                            </TableRow>
                        ) : (
                            balances.map((balance) => (
                                <TableRow key={balance.id} hover>
                                    <TableCell>
                                        <Typography fontWeight="500">
                                            {balance.user_name || '-'}
                                        </Typography>
                                    </TableCell>
                                    <TableCell>
                                        {balance.user_department || '-'}
                                    </TableCell>
                                    <TableCell>
                                        {balance.user_position || '-'}
                                    </TableCell>
                                    <TableCell>
                                        <Box
                                            sx={{
                                                display: 'flex',
                                                alignItems: 'center',
                                                gap: 1,
                                            }}
                                        >
                                            <Typography
                                                fontWeight="600"
                                                color={`${getBalanceColor(
                                                    balance.annual_leave
                                                )}.main`}
                                                sx={{ minWidth: 60 }}
                                            >
                                                {balance.annual_leave} 天
                                            </Typography>
                                            <Box sx={{ width: 80 }}>
                                                <LinearProgress
                                                    variant="determinate"
                                                    value={
                                                        (balance.annual_leave /
                                                            10) *
                                                        100
                                                    }
                                                    color={getBalanceColor(
                                                        balance.annual_leave
                                                    )}
                                                />
                                            </Box>
                                        </Box>
                                    </TableCell>
                                    <TableCell>
                                        <Box
                                            sx={{
                                                display: 'flex',
                                                alignItems: 'center',
                                                gap: 1,
                                            }}
                                        >
                                            <Typography
                                                fontWeight="600"
                                                color={`${getBalanceColor(
                                                    balance.sick_leave
                                                )}.main`}
                                                sx={{ minWidth: 60 }}
                                            >
                                                {balance.sick_leave} 天
                                            </Typography>
                                            <Box sx={{ width: 80 }}>
                                                <LinearProgress
                                                    variant="determinate"
                                                    value={
                                                        (balance.sick_leave /
                                                            10) *
                                                        100
                                                    }
                                                    color={getBalanceColor(
                                                        balance.sick_leave
                                                    )}
                                                />
                                            </Box>
                                        </Box>
                                    </TableCell>
                                    <TableCell>
                                        <Box
                                            sx={{
                                                display: 'flex',
                                                alignItems: 'center',
                                                gap: 1,
                                            }}
                                        >
                                            <Typography
                                                fontWeight="600"
                                                color={`${getBalanceColor(
                                                    balance.personal_leave,
                                                    5
                                                )}.main`}
                                                sx={{ minWidth: 60 }}
                                            >
                                                {balance.personal_leave} 天
                                            </Typography>
                                            <Box sx={{ width: 80 }}>
                                                <LinearProgress
                                                    variant="determinate"
                                                    value={
                                                        (balance.personal_leave /
                                                            5) *
                                                        100
                                                    }
                                                    color={getBalanceColor(
                                                        balance.personal_leave,
                                                        5
                                                    )}
                                                />
                                            </Box>
                                        </Box>
                                    </TableCell>
                                    <TableCell>
                                        <Chip
                                            label={
                                                getHealthStatus(balance).label
                                            }
                                            color={
                                                getHealthStatus(balance)
                                                    .color as any
                                            }
                                            size="small"
                                        />
                                    </TableCell>
                                    <TableCell align="center">
                                        <Button
                                            variant="contained"
                                            size="small"
                                            startIcon={<Edit />}
                                            onClick={() =>
                                                handleEditClick(balance)
                                            }
                                        >
                                            编辑
                                        </Button>
                                    </TableCell>
                                </TableRow>
                            ))
                        )}
                    </TableBody>
                </Table>
            </TableContainer>

            {/* 编辑对话框 */}
            <Dialog
                open={showEditModal}
                onClose={() => setShowEditModal(false)}
                maxWidth="sm"
                fullWidth
            >
                <DialogTitle>
                    <Typography variant="h6" fontWeight="bold">
                        编辑假期余额
                    </Typography>
                    {editingBalance && (
                        <Typography variant="body2" color="text.secondary">
                            {editingBalance.user_name} -{' '}
                            {editingBalance.user_department || '未分配部门'}
                        </Typography>
                    )}
                </DialogTitle>
                <DialogContent>
                    <Box
                        sx={{
                            pt: 2,
                            display: 'flex',
                            flexDirection: 'column',
                            gap: 3,
                        }}
                    >
                        <TextField
                            label="年假余额（天）"
                            type="number"
                            fullWidth
                            value={editForm.annual_leave}
                            onChange={(e) =>
                                setEditForm({
                                    ...editForm,
                                    annual_leave: parseFloat(e.target.value),
                                })
                            }
                            inputProps={{ step: 0.5, min: 0 }}
                        />
                        <TextField
                            label="病假余额（天）"
                            type="number"
                            fullWidth
                            value={editForm.sick_leave}
                            onChange={(e) =>
                                setEditForm({
                                    ...editForm,
                                    sick_leave: parseFloat(e.target.value),
                                })
                            }
                            inputProps={{ step: 0.5, min: 0 }}
                        />
                        <TextField
                            label="事假余额（天）"
                            type="number"
                            fullWidth
                            value={editForm.personal_leave}
                            onChange={(e) =>
                                setEditForm({
                                    ...editForm,
                                    personal_leave: parseFloat(e.target.value),
                                })
                            }
                            inputProps={{ step: 0.5, min: 0 }}
                        />
                    </Box>
                </DialogContent>
                <DialogActions>
                    <Button onClick={() => setShowEditModal(false)}>
                        取消
                    </Button>
                    <Button
                        variant="contained"
                        onClick={handleUpdateBalance}
                        disabled={loading}
                    >
                        保存
                    </Button>
                </DialogActions>
            </Dialog>
        </Box>
    );
}
