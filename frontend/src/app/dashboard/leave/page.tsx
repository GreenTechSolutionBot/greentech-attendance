'use client';

import api from '@/lib/api';
import type { LeaveBalance, LeaveRequest } from '@/types';
import {
    Add,
    CalendarToday,
    Cancel,
    CheckCircle,
    EventBusy,
    LocalHospital,
    NoteAlt,
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
    Snackbar,
    Tab,
    Table,
    TableBody,
    TableCell,
    TableContainer,
    TableHead,
    TableRow,
    Tabs,
    TextField,
    Typography,
} from '@mui/material';
import { useEffect, useState } from 'react';

export default function LeavePage() {
    const [requests, setRequests] = useState<LeaveRequest[]>([]);
    const [balance, setBalance] = useState<LeaveBalance | null>(null);
    const [showModal, setShowModal] = useState(false);
    const [tabValue, setTabValue] = useState(0);
    const [snackbar, setSnackbar] = useState({
        open: false,
        message: '',
        severity: 'success' as 'success' | 'error' | 'warning',
    });
    const [formData, setFormData] = useState({
        leave_type: 'annual',
        start_date: '',
        end_date: '',
        days: 0,
        reason: '',
    });

    useEffect(() => {
        loadData();
    }, []);

    useEffect(() => {
        // 自动计算天数
        if (formData.start_date && formData.end_date) {
            const start = new Date(formData.start_date);
            const end = new Date(formData.end_date);
            const diffTime = Math.abs(end.getTime() - start.getTime());
            const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24)) + 1;
            setFormData((prev) => ({ ...prev, days: diffDays }));
        }
    }, [formData.start_date, formData.end_date]);

    const loadData = async () => {
        try {
            const [requestsRes, balanceRes] = await Promise.all([
                api.get('/leave-requests/my'),
                api.get('/leave-balances/my'),
            ]);
            setRequests(requestsRes.data || []);
            setBalance(balanceRes.data);
        } catch (error) {
            console.error('加载数据失败:', error);
            showSnackbar('加载数据失败', 'error');
        }
    };

    const showSnackbar = (
        message: string,
        severity: 'success' | 'error' | 'warning' = 'success'
    ) => {
        setSnackbar({ open: true, message, severity });
    };

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();

        // 验证日期
        if (new Date(formData.end_date) < new Date(formData.start_date)) {
            showSnackbar('结束日期不能早于开始日期', 'error');
            return;
        }

        // 验证余额
        if (balance) {
            const availableBalance =
                formData.leave_type === 'annual'
                    ? balance.annual_leave
                    : formData.leave_type === 'sick'
                    ? balance.sick_leave
                    : balance.personal_leave;

            if (formData.days > availableBalance) {
                showSnackbar('假期余额不足', 'error');
                return;
            }
        }

        try {
            await api.post('/leave-requests', formData);
            showSnackbar('休假申请已提交！', 'success');
            setShowModal(false);
            setFormData({
                leave_type: 'annual',
                start_date: '',
                end_date: '',
                days: 0,
                reason: '',
            });
            loadData();
        } catch (error: any) {
            showSnackbar(error.response?.data?.error || '提交失败', 'error');
        }
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

    const getStatusColor = (
        status: string
    ): 'default' | 'warning' | 'success' | 'error' => {
        const colors: { [key: string]: any } = {
            pending: 'warning',
            approved: 'success',
            rejected: 'error',
        };
        return colors[status] || 'default';
    };

    const getLeaveTypeIcon = (type: string) => {
        switch (type) {
            case 'annual':
                return <CalendarToday sx={{ mr: 1, fontSize: 20 }} />;
            case 'sick':
                return <LocalHospital sx={{ mr: 1, fontSize: 20 }} />;
            case 'personal':
                return <NoteAlt sx={{ mr: 1, fontSize: 20 }} />;
            default:
                return <EventBusy sx={{ mr: 1, fontSize: 20 }} />;
        }
    };

    const filteredRequests = requests.filter((req) => {
        if (tabValue === 0) return true; // 全部
        if (tabValue === 1) return req.status === 'pending'; // 待审批
        if (tabValue === 2) return req.status === 'approved'; // 已批准
        if (tabValue === 3) return req.status === 'rejected'; // 已拒绝
        return true;
    });

    return (
        <Box sx={{ p: 3 }}>
            {/* 标题栏 */}
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
                        我的休假
                    </Typography>
                    <Typography variant="body2" color="text.secondary">
                        管理您的休假申请和余额
                    </Typography>
                </Box>
                <Button
                    variant="contained"
                    startIcon={<Add />}
                    onClick={() => setShowModal(true)}
                    size="large"
                >
                    申请休假
                </Button>
            </Box>

            {/* 休假余额卡片 */}
            {balance && (
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
                                        年假余额
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
                                            (balance.annual_leave / 10) * 100
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
                                        剩余 {balance.annual_leave} / 10 天
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
                                        病假余额
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
                                        value={(balance.sick_leave / 10) * 100}
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
                                        剩余 {balance.sick_leave} / 10 天
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
                                        事假余额
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
                                            (balance.personal_leave / 5) * 100
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
                                        剩余 {balance.personal_leave} / 5 天
                                    </Typography>
                                </Box>
                            </CardContent>
                        </Card>
                    </Grid>
                </Grid>
            )}

            {/* 休假申请列表 */}
            <Paper sx={{ p: 3 }}>
                <Box sx={{ borderBottom: 1, borderColor: 'divider', mb: 3 }}>
                    <Tabs
                        value={tabValue}
                        onChange={(e, newValue) => setTabValue(newValue)}
                    >
                        <Tab label="全部申请" />
                        <Tab label="待审批" />
                        <Tab label="已批准" />
                        <Tab label="已拒绝" />
                    </Tabs>
                </Box>

                {filteredRequests.length > 0 ? (
                    <TableContainer>
                        <Table>
                            <TableHead>
                                <TableRow>
                                    <TableCell>类型</TableCell>
                                    <TableCell>开始日期</TableCell>
                                    <TableCell>结束日期</TableCell>
                                    <TableCell align="center">天数</TableCell>
                                    <TableCell>申请原因</TableCell>
                                    <TableCell>状态</TableCell>
                                    <TableCell>审批意见</TableCell>
                                    <TableCell>申请时间</TableCell>
                                </TableRow>
                            </TableHead>
                            <TableBody>
                                {filteredRequests.map((leave) => (
                                    <TableRow key={leave.id} hover>
                                        <TableCell>
                                            <Box
                                                sx={{
                                                    display: 'flex',
                                                    alignItems: 'center',
                                                }}
                                            >
                                                {getLeaveTypeIcon(
                                                    leave.leave_type
                                                )}
                                                <Chip
                                                    label={getLeaveTypeLabel(
                                                        leave.leave_type
                                                    )}
                                                    size="small"
                                                    color="primary"
                                                    variant="outlined"
                                                />
                                            </Box>
                                        </TableCell>
                                        <TableCell>
                                            {leave.start_date}
                                        </TableCell>
                                        <TableCell>{leave.end_date}</TableCell>
                                        <TableCell align="center">
                                            <Typography fontWeight="600">
                                                {leave.days}
                                            </Typography>
                                        </TableCell>
                                        <TableCell>
                                            {leave.reason || '-'}
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
                                                icon={
                                                    leave.status ===
                                                    'approved' ? (
                                                        <CheckCircle />
                                                    ) : leave.status ===
                                                      'rejected' ? (
                                                        <Cancel />
                                                    ) : undefined
                                                }
                                            />
                                        </TableCell>
                                        <TableCell>
                                            {leave.remark || '-'}
                                        </TableCell>
                                        <TableCell>
                                            {new Date(
                                                leave.created_at
                                            ).toLocaleDateString('zh-CN')}
                                        </TableCell>
                                    </TableRow>
                                ))}
                            </TableBody>
                        </Table>
                    </TableContainer>
                ) : (
                    <Box sx={{ textAlign: 'center', py: 8 }}>
                        <EventBusy
                            sx={{ fontSize: 64, color: 'text.disabled', mb: 2 }}
                        />
                        <Typography color="text.secondary">
                            暂无
                            {tabValue === 0
                                ? ''
                                : getStatusLabel(
                                      ['', 'pending', 'approved', 'rejected'][
                                          tabValue
                                      ]
                                  )}
                            的休假申请
                        </Typography>
                    </Box>
                )}
            </Paper>

            {/* 申请休假对话框 */}
            <Dialog
                open={showModal}
                onClose={() => setShowModal(false)}
                maxWidth="sm"
                fullWidth
            >
                <DialogTitle>
                    <Typography variant="h6" fontWeight="bold">
                        申请休假
                    </Typography>
                </DialogTitle>
                <form onSubmit={handleSubmit}>
                    <DialogContent>
                        <Grid container spacing={2}>
                            <Grid item xs={12}>
                                <FormControl fullWidth>
                                    <InputLabel>休假类型</InputLabel>
                                    <Select
                                        value={formData.leave_type}
                                        onChange={(e) =>
                                            setFormData({
                                                ...formData,
                                                leave_type: e.target.value,
                                            })
                                        }
                                        label="休假类型"
                                    >
                                        <MenuItem value="annual">
                                            <Box
                                                sx={{
                                                    display: 'flex',
                                                    alignItems: 'center',
                                                }}
                                            >
                                                <CalendarToday
                                                    sx={{ mr: 1, fontSize: 20 }}
                                                />
                                                年假 (剩余{' '}
                                                {balance?.annual_leave || 0} 天)
                                            </Box>
                                        </MenuItem>
                                        <MenuItem value="sick">
                                            <Box
                                                sx={{
                                                    display: 'flex',
                                                    alignItems: 'center',
                                                }}
                                            >
                                                <LocalHospital
                                                    sx={{ mr: 1, fontSize: 20 }}
                                                />
                                                病假 (剩余{' '}
                                                {balance?.sick_leave || 0} 天)
                                            </Box>
                                        </MenuItem>
                                        <MenuItem value="personal">
                                            <Box
                                                sx={{
                                                    display: 'flex',
                                                    alignItems: 'center',
                                                }}
                                            >
                                                <NoteAlt
                                                    sx={{ mr: 1, fontSize: 20 }}
                                                />
                                                事假 (剩余{' '}
                                                {balance?.personal_leave || 0}{' '}
                                                天)
                                            </Box>
                                        </MenuItem>
                                    </Select>
                                </FormControl>
                            </Grid>

                            <Grid item xs={12} sm={6}>
                                <TextField
                                    fullWidth
                                    type="date"
                                    label="开始日期"
                                    value={formData.start_date}
                                    onChange={(e) =>
                                        setFormData({
                                            ...formData,
                                            start_date: e.target.value,
                                        })
                                    }
                                    InputLabelProps={{ shrink: true }}
                                    inputProps={{
                                        min: new Date()
                                            .toISOString()
                                            .split('T')[0],
                                    }}
                                    required
                                />
                            </Grid>

                            <Grid item xs={12} sm={6}>
                                <TextField
                                    fullWidth
                                    type="date"
                                    label="结束日期"
                                    value={formData.end_date}
                                    onChange={(e) =>
                                        setFormData({
                                            ...formData,
                                            end_date: e.target.value,
                                        })
                                    }
                                    InputLabelProps={{ shrink: true }}
                                    inputProps={{
                                        min:
                                            formData.start_date ||
                                            new Date()
                                                .toISOString()
                                                .split('T')[0],
                                    }}
                                    required
                                />
                            </Grid>

                            <Grid item xs={12}>
                                <TextField
                                    fullWidth
                                    type="number"
                                    label="天数"
                                    value={formData.days}
                                    onChange={(e) =>
                                        setFormData({
                                            ...formData,
                                            days: parseFloat(e.target.value),
                                        })
                                    }
                                    inputProps={{ step: 0.5, min: 0.5 }}
                                    helperText="系统已自动计算，可手动调整"
                                    required
                                />
                            </Grid>

                            <Grid item xs={12}>
                                <TextField
                                    fullWidth
                                    multiline
                                    rows={4}
                                    label="申请原因"
                                    value={formData.reason}
                                    onChange={(e) =>
                                        setFormData({
                                            ...formData,
                                            reason: e.target.value,
                                        })
                                    }
                                    placeholder="请输入休假原因"
                                    required
                                />
                            </Grid>
                        </Grid>
                    </DialogContent>
                    <DialogActions sx={{ px: 3, pb: 2 }}>
                        <Button
                            onClick={() => setShowModal(false)}
                            color="inherit"
                        >
                            取消
                        </Button>
                        <Button type="submit" variant="contained">
                            提交申请
                        </Button>
                    </DialogActions>
                </form>
            </Dialog>

            {/* 提示消息 */}
            <Snackbar
                open={snackbar.open}
                autoHideDuration={4000}
                onClose={() => setSnackbar({ ...snackbar, open: false })}
                anchorOrigin={{ vertical: 'top', horizontal: 'center' }}
            >
                <Alert
                    onClose={() => setSnackbar({ ...snackbar, open: false })}
                    severity={snackbar.severity}
                    sx={{ width: '100%' }}
                >
                    {snackbar.message}
                </Alert>
            </Snackbar>
        </Box>
    );
}
