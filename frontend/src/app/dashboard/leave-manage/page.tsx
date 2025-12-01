'use client';

import api from '@/lib/api';
import type { LeaveRequest } from '@/types';
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
    Grid,
    Paper,
    Snackbar,
    Stack,
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
import {
    CalendarToday,
    Cancel,
    CheckCircle,
    EventBusy,
    LocalHospital,
    NoteAlt,
    Person,
    ThumbDown,
    ThumbUp,
} from '@mui/icons-material';
import { useEffect, useState } from 'react';

export default function LeaveManagePage() {
    const [requests, setRequests] = useState<LeaveRequest[]>([]);
    const [tabValue, setTabValue] = useState(1);
    const [selectedRequest, setSelectedRequest] = useState<LeaveRequest | null>(null);
    const [showModal, setShowModal] = useState(false);
    const [remark, setRemark] = useState('');
    const [snackbar, setSnackbar] = useState({
        open: false,
        message: '',
        severity: 'success' as 'success' | 'error' | 'warning',
    });

    useEffect(() => {
        loadRequests();
    }, [tabValue]);

    const loadRequests = async () => {
        try {
            let status = '';
            if (tabValue === 1) status = 'pending';
            if (tabValue === 2) status = 'approved';
            if (tabValue === 3) status = 'rejected';

            const response = await api.get(`/leave-requests${status ? `?status=${status}` : ''}`);
            setRequests(response.data || []);
        } catch (error) {
            console.error('加载休假申请失败:', error);
            showSnackbar('加载数据失败', 'error');
        }
    };

    const showSnackbar = (message: string, severity: 'success' | 'error' | 'warning' = 'success') => {
        setSnackbar({ open: true, message, severity });
    };

    const handleApprove = async (status: 'approved' | 'rejected') => {
        if (!selectedRequest) return;

        try {
            const userStr = localStorage.getItem('user');
            const user = userStr ? JSON.parse(userStr) : null;

            await api.put(`/leave-requests/${selectedRequest.id}/approve`, {
                status,
                approver_id: user?.id,
                remark,
            });
            showSnackbar(status === 'approved' ? '申请已批准' : '申请已拒绝', 'success');
            setShowModal(false);
            setSelectedRequest(null);
            setRemark('');
            loadRequests();
        } catch (error: any) {
            showSnackbar(error.response?.data?.error || '操作失败', 'error');
        }
    };

    const openApprovalModal = (request: LeaveRequest) => {
        setSelectedRequest(request);
        setShowModal(true);
    };

    const getLeaveTypeLabel = (type: string) => {
        const labels: { [key: string]: string } = { annual: '年假', sick: '病假', personal: '事假', other: '其他' };
        return labels[type] || type;
    };

    const getStatusLabel = (status: string) => {
        const labels: { [key: string]: string } = { pending: '待审批', approved: '已批准', rejected: '已拒绝' };
        return labels[status] || status;
    };

    const getStatusColor = (status: string): 'default' | 'warning' | 'success' | 'error' => {
        const colors: { [key: string]: any } = { pending: 'warning', approved: 'success', rejected: 'error' };
        return colors[status] || 'default';
    };

    const getLeaveTypeIcon = (type: string) => {
        switch (type) {
            case 'annual': return <CalendarToday sx={{ mr: 0.5, fontSize: 18 }} />;
            case 'sick': return <LocalHospital sx={{ mr: 0.5, fontSize: 18 }} />;
            case 'personal': return <NoteAlt sx={{ mr: 0.5, fontSize: 18 }} />;
            default: return <EventBusy sx={{ mr: 0.5, fontSize: 18 }} />;
        }
    };

    const stats = {
        total: requests.length,
        pending: requests.filter((r) => r.status === 'pending').length,
        approved: requests.filter((r) => r.status === 'approved').length,
        rejected: requests.filter((r) => r.status === 'rejected').length,
    };

    return (
        <Box sx={{ p: 3 }}>
            <Box sx={{ mb: 4 }}>
                <Typography variant="h4" fontWeight="bold" gutterBottom>休假审批管理</Typography>
                <Typography variant="body2" color="text.secondary">审批员工的休假申请</Typography>
            </Box>

            <Grid container spacing={3} sx={{ mb: 4 }}>
                <Grid item xs={12} sm={6} md={3}>
                    <Card>
                        <CardContent>
                            <Stack direction="row" justifyContent="space-between" alignItems="center">
                                <Box>
                                    <Typography variant="body2" color="text.secondary" gutterBottom>全部申请</Typography>
                                    <Typography variant="h4" fontWeight="bold">{stats.total}</Typography>
                                </Box>
                                <EventBusy sx={{ fontSize: 48, color: 'primary.main', opacity: 0.3 }} />
                            </Stack>
                        </CardContent>
                    </Card>
                </Grid>
                <Grid item xs={12} sm={6} md={3}>
                    <Card>
                        <CardContent>
                            <Stack direction="row" justifyContent="space-between" alignItems="center">
                                <Box>
                                    <Typography variant="body2" color="text.secondary" gutterBottom>待审批</Typography>
                                    <Typography variant="h4" fontWeight="bold" color="warning.main">{stats.pending}</Typography>
                                </Box>
                                <CheckCircle sx={{ fontSize: 48, color: 'warning.main', opacity: 0.3 }} />
                            </Stack>
                        </CardContent>
                    </Card>
                </Grid>
                <Grid item xs={12} sm={6} md={3}>
                    <Card>
                        <CardContent>
                            <Stack direction="row" justifyContent="space-between" alignItems="center">
                                <Box>
                                    <Typography variant="body2" color="text.secondary" gutterBottom>已批准</Typography>
                                    <Typography variant="h4" fontWeight="bold" color="success.main">{stats.approved}</Typography>
                                </Box>
                                <ThumbUp sx={{ fontSize: 48, color: 'success.main', opacity: 0.3 }} />
                            </Stack>
                        </CardContent>
                    </Card>
                </Grid>
                <Grid item xs={12} sm={6} md={3}>
                    <Card>
                        <CardContent>
                            <Stack direction="row" justifyContent="space-between" alignItems="center">
                                <Box>
                                    <Typography variant="body2" color="text.secondary" gutterBottom>已拒绝</Typography>
                                    <Typography variant="h4" fontWeight="bold" color="error.main">{stats.rejected}</Typography>
                                </Box>
                                <ThumbDown sx={{ fontSize: 48, color: 'error.main', opacity: 0.3 }} />
                            </Stack>
                        </CardContent>
                    </Card>
                </Grid>
            </Grid>

            <Paper sx={{ p: 3 }}>
                <Box sx={{ borderBottom: 1, borderColor: 'divider', mb: 3 }}>
                    <Tabs value={tabValue} onChange={(e, newValue) => setTabValue(newValue)}>
                        <Tab label="全部申请" />
                        <Tab label={`待审批 (${stats.pending})`} />
                        <Tab label="已批准" />
                        <Tab label="已拒绝" />
                    </Tabs>
                </Box>

                {requests.length > 0 ? (
                    <TableContainer>
                        <Table>
                            <TableHead>
                                <TableRow>
                                    <TableCell>申请人</TableCell>
                                    <TableCell>类型</TableCell>
                                    <TableCell>开始日期</TableCell>
                                    <TableCell>结束日期</TableCell>
                                    <TableCell align="center">天数</TableCell>
                                    <TableCell>申请原因</TableCell>
                                    <TableCell>状态</TableCell>
                                    <TableCell>申请时间</TableCell>
                                    <TableCell align="center">操作</TableCell>
                                </TableRow>
                            </TableHead>
                            <TableBody>
                                {requests.map((leave) => (
                                    <TableRow key={leave.id} hover>
                                        <TableCell>
                                            <Box sx={{ display: 'flex', alignItems: 'center' }}>
                                                <Person sx={{ mr: 1, color: 'text.secondary' }} />
                                                {leave.user_name || `用户${leave.user_id}`}
                                            </Box>
                                        </TableCell>
                                        <TableCell>
                                            <Box sx={{ display: 'flex', alignItems: 'center' }}>
                                                {getLeaveTypeIcon(leave.leave_type)}
                                                <Chip label={getLeaveTypeLabel(leave.leave_type)} size="small" color="primary" variant="outlined" />
                                            </Box>
                                        </TableCell>
                                        <TableCell>{leave.start_date}</TableCell>
                                        <TableCell>{leave.end_date}</TableCell>
                                        <TableCell align="center">
                                            <Typography fontWeight="600">{leave.days}</Typography>
                                        </TableCell>
                                        <TableCell sx={{ maxWidth: 200, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                                            {leave.reason || '-'}
                                        </TableCell>
                                        <TableCell>
                                            <Chip
                                                label={getStatusLabel(leave.status)}
                                                size="small"
                                                color={getStatusColor(leave.status)}
                                                icon={leave.status === 'approved' ? <CheckCircle /> : leave.status === 'rejected' ? <Cancel /> : undefined}
                                            />
                                        </TableCell>
                                        <TableCell>{new Date(leave.created_at).toLocaleDateString('zh-CN')}</TableCell>
                                        <TableCell align="center">
                                            {leave.status === 'pending' && (
                                                <Button variant="contained" size="small" onClick={() => openApprovalModal(leave)}>审批</Button>
                                            )}
                                            {leave.status !== 'pending' && (
                                                <Button variant="outlined" size="small" onClick={() => { setSelectedRequest(leave); setRemark(leave.remark || ''); setShowModal(true); }}>查看</Button>
                                            )}
                                        </TableCell>
                                    </TableRow>
                                ))}
                            </TableBody>
                        </Table>
                    </TableContainer>
                ) : (
                    <Box sx={{ textAlign: 'center', py: 8 }}>
                        <EventBusy sx={{ fontSize: 64, color: 'text.disabled', mb: 2 }} />
                        <Typography color="text.secondary">暂无{tabValue === 0 ? '' : getStatusLabel(['', 'pending', 'approved', 'rejected'][tabValue])}的休假申请</Typography>
                    </Box>
                )}
            </Paper>

            <Dialog open={showModal} onClose={() => { setShowModal(false); setSelectedRequest(null); setRemark(''); }} maxWidth="sm" fullWidth>
                <DialogTitle>
                    <Typography variant="h6" fontWeight="bold">
                        {selectedRequest?.status === 'pending' ? '审批休假申请' : '休假申请详情'}
                    </Typography>
                </DialogTitle>
                <DialogContent>
                    {selectedRequest && (
                        <Box>
                            <Paper variant="outlined" sx={{ p: 2, mb: 3, bgcolor: 'grey.50' }}>
                                <Grid container spacing={2}>
                                    <Grid item xs={6}>
                                        <Typography variant="caption" color="text.secondary">申请人</Typography>
                                        <Typography fontWeight="600">{selectedRequest.user_name || `用户${selectedRequest.user_id}`}</Typography>
                                    </Grid>
                                    <Grid item xs={6}>
                                        <Typography variant="caption" color="text.secondary">假期类型</Typography>
                                        <Box sx={{ display: 'flex', alignItems: 'center', mt: 0.5 }}>
                                            {getLeaveTypeIcon(selectedRequest.leave_type)}
                                            <Typography fontWeight="600">{getLeaveTypeLabel(selectedRequest.leave_type)}</Typography>
                                        </Box>
                                    </Grid>
                                    <Grid item xs={6}>
                                        <Typography variant="caption" color="text.secondary">开始日期</Typography>
                                        <Typography fontWeight="600">{selectedRequest.start_date}</Typography>
                                    </Grid>
                                    <Grid item xs={6}>
                                        <Typography variant="caption" color="text.secondary">结束日期</Typography>
                                        <Typography fontWeight="600">{selectedRequest.end_date}</Typography>
                                    </Grid>
                                    <Grid item xs={6}>
                                        <Typography variant="caption" color="text.secondary">请假天数</Typography>
                                        <Typography fontWeight="600" color="primary.main">{selectedRequest.days} 天</Typography>
                                    </Grid>
                                    <Grid item xs={6}>
                                        <Typography variant="caption" color="text.secondary">申请时间</Typography>
                                        <Typography fontWeight="600">{new Date(selectedRequest.created_at).toLocaleDateString('zh-CN')}</Typography>
                                    </Grid>
                                    <Grid item xs={12}>
                                        <Typography variant="caption" color="text.secondary">申请原因</Typography>
                                        <Typography>{selectedRequest.reason || '-'}</Typography>
                                    </Grid>
                                </Grid>
                            </Paper>
                            <TextField fullWidth multiline rows={4} label={selectedRequest.status === 'pending' ? '审批意见' : '审批意见（已填写）'} value={remark} onChange={(e) => setRemark(e.target.value)} placeholder="请输入审批意见（可选）" disabled={selectedRequest.status !== 'pending'} />
                        </Box>
                    )}
                </DialogContent>
                <DialogActions sx={{ px: 3, pb: 2 }}>
                    <Button onClick={() => { setShowModal(false); setSelectedRequest(null); setRemark(''); }} color="inherit">
                        {selectedRequest?.status === 'pending' ? '取消' : '关闭'}
                    </Button>
                    {selectedRequest?.status === 'pending' && (
                        <>
                            <Button onClick={() => handleApprove('rejected')} variant="outlined" color="error" startIcon={<ThumbDown />}>拒绝</Button>
                            <Button onClick={() => handleApprove('approved')} variant="contained" color="success" startIcon={<ThumbUp />}>批准</Button>
                        </>
                    )}
                </DialogActions>
            </Dialog>

            <Snackbar open={snackbar.open} autoHideDuration={4000} onClose={() => setSnackbar({ ...snackbar, open: false })} anchorOrigin={{ vertical: 'top', horizontal: 'center' }}>
                <Alert onClose={() => setSnackbar({ ...snackbar, open: false })} severity={snackbar.severity} sx={{ width: '100%' }}>
                    {snackbar.message}
                </Alert>
            </Snackbar>
        </Box>
    );
}
