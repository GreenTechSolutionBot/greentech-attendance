'use client';

import api from '@/lib/api';
import type { AttendanceRecord } from '@/types';
import {
    CheckCircle,
    LocationOn,
    LoginOutlined,
    LogoutOutlined,
    Schedule,
} from '@mui/icons-material';
import {
    Alert,
    Box,
    Button,
    Card,
    CardContent,
    Chip,
    CircularProgress,
    Grid,
    Paper,
    Snackbar,
    Table,
    TableBody,
    TableCell,
    TableContainer,
    TableHead,
    TableRow,
    TextField,
    Typography,
} from '@mui/material';
import { format } from 'date-fns';
import { useEffect, useState } from 'react';

interface TodayStatus {
    checked_in: boolean;
    checked_out: boolean;
    record?: AttendanceRecord;
}

export default function AttendancePage() {
    const [records, setRecords] = useState<AttendanceRecord[]>([]);
    const [month, setMonth] = useState(format(new Date(), 'yyyy-MM'));
    const [loading, setLoading] = useState(false);
    const [todayStatus, setTodayStatus] = useState<TodayStatus | null>(null);
    const [location, setLocation] = useState<string>('');
    const [gettingLocation, setGettingLocation] = useState(false);
    const [snackbar, setSnackbar] = useState({
        open: false,
        message: '',
        severity: 'success' as 'success' | 'error' | 'info',
    });

    useEffect(() => {
        loadRecords();
        loadTodayStatus();
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

    const loadTodayStatus = async () => {
        try {
            const response = await api.get('/attendance/today');
            setTodayStatus(response.data);
        } catch (error) {
            console.error('获取今日状态失败:', error);
        }
    };

    const getLocation = (): Promise<string> => {
        return new Promise((resolve, reject) => {
            if (!navigator.geolocation) {
                reject('浏览器不支持地理定位');
                return;
            }

            setGettingLocation(true);
            console.log('开始获取位置信息...');

            navigator.geolocation.getCurrentPosition(
                (position) => {
                    setGettingLocation(false);
                    const { latitude, longitude } = position.coords;
                    const locationStr = `${latitude.toFixed(
                        6
                    )}, ${longitude.toFixed(6)}`;
                    console.log('位置获取成功:', locationStr);
                    setLocation(locationStr);
                    resolve(locationStr);
                },
                (error) => {
                    setGettingLocation(false);
                    let errorMessage = '获取位置失败';
                    console.error('位置获取错误:', error);
                    switch (error.code) {
                        case error.PERMISSION_DENIED:
                            errorMessage =
                                '用户拒绝了地理定位请求，请在浏览器设置中允许位置权限';
                            break;
                        case error.POSITION_UNAVAILABLE:
                            errorMessage =
                                '位置信息不可用，请检查设备GPS是否开启';
                            break;
                        case error.TIMEOUT:
                            errorMessage = '获取位置超时，请重试';
                            break;
                    }
                    reject(errorMessage);
                },
                {
                    enableHighAccuracy: true,
                    timeout: 10000,
                    maximumAge: 0,
                }
            );
        });
    };

    const handleCheckIn = async () => {
        try {
            console.log('开始签到流程...');
            const loc = await getLocation();
            console.log('准备发送签到请求，位置:', loc);
            const response = await api.post('/attendance/check-in', {
                location: loc,
            });
            console.log('签到响应:', response.data);
            setSnackbar({
                open: true,
                message: '签到成功！',
                severity: 'success',
            });
            loadRecords();
            loadTodayStatus();
        } catch (error: any) {
            console.error('签到失败:', error);
            setSnackbar({
                open: true,
                message:
                    error.response?.data?.error ||
                    error.toString() ||
                    '签到失败',
                severity: 'error',
            });
        }
    };

    const handleCheckOut = async () => {
        try {
            console.log('开始签退流程...');
            const loc = await getLocation();
            console.log('准备发送签退请求，位置:', loc);
            const response = await api.post('/attendance/check-out', {
                location: loc,
            });
            console.log('签退响应:', response.data);
            setSnackbar({
                open: true,
                message: '签退成功！',
                severity: 'success',
            });
            loadRecords();
            loadTodayStatus();
        } catch (error: any) {
            console.error('签退失败:', error);
            setSnackbar({
                open: true,
                message:
                    error.response?.data?.error ||
                    error.toString() ||
                    '签退失败',
                severity: 'error',
            });
        }
    };

    return (
        <Box sx={{ p: 3 }}>
            <Typography variant="h4" sx={{ mb: 4, fontWeight: 'bold' }}>
                我的考勤
            </Typography>

            {/* 今日状态卡片 */}
            <Grid container spacing={3} sx={{ mb: 4 }}>
                <Grid item xs={12} md={6}>
                    <Card
                        sx={{
                            background:
                                'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
                            color: 'white',
                            height: '100%',
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
                                <Schedule sx={{ fontSize: 40, mr: 2 }} />
                                <Box>
                                    <Typography variant="h6">
                                        今日状态
                                    </Typography>
                                    <Typography
                                        variant="body2"
                                        sx={{ opacity: 0.9 }}
                                    >
                                        {format(new Date(), 'yyyy年MM月dd日')}
                                    </Typography>
                                </Box>
                            </Box>

                            {todayStatus?.checked_in ? (
                                <Box>
                                    <Box
                                        sx={{
                                            display: 'flex',
                                            alignItems: 'center',
                                            mb: 1,
                                        }}
                                    >
                                        <CheckCircle sx={{ mr: 1 }} />
                                        <Typography>
                                            签到时间:{' '}
                                            {todayStatus.record?.check_in_time
                                                ? format(
                                                      new Date(
                                                          todayStatus.record.check_in_time
                                                      ),
                                                      'HH:mm:ss'
                                                  )
                                                : '-'}
                                        </Typography>
                                    </Box>
                                    {todayStatus.checked_out && (
                                        <Box
                                            sx={{
                                                display: 'flex',
                                                alignItems: 'center',
                                            }}
                                        >
                                            <CheckCircle sx={{ mr: 1 }} />
                                            <Typography>
                                                签退时间:{' '}
                                                {todayStatus.record
                                                    ?.check_out_time
                                                    ? format(
                                                          new Date(
                                                              todayStatus.record.check_out_time
                                                          ),
                                                          'HH:mm:ss'
                                                      )
                                                    : '-'}
                                            </Typography>
                                        </Box>
                                    )}
                                </Box>
                            ) : (
                                <Typography>今日尚未签到</Typography>
                            )}

                            {location && (
                                <Box
                                    sx={{
                                        mt: 2,
                                        display: 'flex',
                                        alignItems: 'center',
                                    }}
                                >
                                    <LocationOn sx={{ mr: 1, fontSize: 18 }} />
                                    <Typography variant="caption">
                                        当前位置: {location}
                                    </Typography>
                                </Box>
                            )}
                        </CardContent>
                    </Card>
                </Grid>

                <Grid item xs={12} md={6}>
                    <Card sx={{ height: '100%' }}>
                        <CardContent>
                            <Typography variant="h6" sx={{ mb: 3 }}>
                                考勤操作
                            </Typography>

                            <Box
                                sx={{
                                    display: 'flex',
                                    flexDirection: 'column',
                                    gap: 2,
                                }}
                            >
                                <Button
                                    variant="contained"
                                    size="large"
                                    fullWidth
                                    onClick={handleCheckIn}
                                    disabled={
                                        todayStatus?.checked_in ||
                                        gettingLocation
                                    }
                                    startIcon={
                                        gettingLocation ? (
                                            <CircularProgress size={20} />
                                        ) : (
                                            <LoginOutlined />
                                        )
                                    }
                                    sx={{
                                        'py': 2,
                                        'background':
                                            'linear-gradient(45deg, #4CAF50 30%, #66BB6A 90%)',
                                        'boxShadow':
                                            '0 3px 5px 2px rgba(76, 175, 80, .3)',
                                        'fontSize': '18px',
                                        'fontWeight': 'bold',
                                        '&:hover': {
                                            background:
                                                'linear-gradient(45deg, #45a049 30%, #5cb85f 90%)',
                                            boxShadow:
                                                '0 5px 8px 3px rgba(76, 175, 80, .3)',
                                            transform: 'translateY(-2px)',
                                        },
                                        '&:disabled': {
                                            background: '#cccccc',
                                        },
                                        'transition': 'all 0.3s',
                                    }}
                                >
                                    {gettingLocation
                                        ? '正在获取位置...'
                                        : todayStatus?.checked_in
                                        ? '今日已签到'
                                        : '签到'}
                                </Button>

                                <Button
                                    variant="contained"
                                    size="large"
                                    fullWidth
                                    onClick={handleCheckOut}
                                    disabled={
                                        !todayStatus?.checked_in ||
                                        todayStatus?.checked_out ||
                                        gettingLocation
                                    }
                                    startIcon={
                                        gettingLocation ? (
                                            <CircularProgress size={20} />
                                        ) : (
                                            <LogoutOutlined />
                                        )
                                    }
                                    sx={{
                                        'py': 2,
                                        'background':
                                            'linear-gradient(45deg, #2196F3 30%, #42A5F5 90%)',
                                        'boxShadow':
                                            '0 3px 5px 2px rgba(33, 150, 243, .3)',
                                        'fontSize': '18px',
                                        'fontWeight': 'bold',
                                        '&:hover': {
                                            background:
                                                'linear-gradient(45deg, #1976D2 30%, #2196F3 90%)',
                                            boxShadow:
                                                '0 5px 8px 3px rgba(33, 150, 243, .3)',
                                            transform: 'translateY(-2px)',
                                        },
                                        '&:disabled': {
                                            background: '#cccccc',
                                        },
                                        'transition': 'all 0.3s',
                                    }}
                                >
                                    {gettingLocation
                                        ? '正在获取位置...'
                                        : !todayStatus?.checked_in
                                        ? '请先签到'
                                        : todayStatus?.checked_out
                                        ? '今日已签退'
                                        : '签退'}
                                </Button>

                                {!location && !gettingLocation && (
                                    <Alert severity="info" sx={{ mt: 1 }}>
                                        签到/签退时会自动获取您的地理位置
                                    </Alert>
                                )}

                                {/* 测试定位按钮 */}
                                <Button
                                    variant="outlined"
                                    size="small"
                                    fullWidth
                                    onClick={async () => {
                                        try {
                                            const loc = await getLocation();
                                            setSnackbar({
                                                open: true,
                                                message: `位置获取成功: ${loc}`,
                                                severity: 'success',
                                            });
                                        } catch (error: any) {
                                            setSnackbar({
                                                open: true,
                                                message: error.toString(),
                                                severity: 'error',
                                            });
                                        }
                                    }}
                                    disabled={gettingLocation}
                                    sx={{ mt: 1 }}
                                >
                                    {gettingLocation
                                        ? '获取中...'
                                        : '测试获取位置'}
                                </Button>

                                <Typography
                                    variant="caption"
                                    sx={{
                                        display: 'block',
                                        mt: 1,
                                        color: 'text.secondary',
                                    }}
                                >
                                    💡
                                    提示：首次使用需允许浏览器获取位置权限。请查看浏览器控制台了解详细信息。
                                </Typography>
                            </Box>
                        </CardContent>
                    </Card>
                </Grid>
            </Grid>

            {/* 考勤记录 */}
            <Paper sx={{ p: 3 }}>
                <Box
                    sx={{
                        display: 'flex',
                        justifyContent: 'space-between',
                        alignItems: 'center',
                        mb: 3,
                    }}
                >
                    <Typography variant="h6" sx={{ fontWeight: 600 }}>
                        考勤记录
                    </Typography>
                    <TextField
                        type="month"
                        size="small"
                        value={month}
                        onChange={(e) => setMonth(e.target.value)}
                        InputLabelProps={{ shrink: true }}
                    />
                </Box>

                {loading ? (
                    <Box
                        sx={{
                            display: 'flex',
                            justifyContent: 'center',
                            py: 5,
                        }}
                    >
                        <CircularProgress />
                    </Box>
                ) : records.length > 0 ? (
                    <TableContainer>
                        <Table>
                            <TableHead>
                                <TableRow>
                                    <TableCell>日期</TableCell>
                                    <TableCell>签到时间</TableCell>
                                    <TableCell>签退时间</TableCell>
                                    <TableCell>签到位置</TableCell>
                                    <TableCell>签退位置</TableCell>
                                    <TableCell>状态</TableCell>
                                </TableRow>
                            </TableHead>
                            <TableBody>
                                {records.map((record) => (
                                    <TableRow key={record.id}>
                                        <TableCell>
                                            {format(
                                                new Date(record.check_in_time),
                                                'yyyy-MM-dd'
                                            )}
                                        </TableCell>
                                        <TableCell>
                                            {format(
                                                new Date(record.check_in_time),
                                                'HH:mm:ss'
                                            )}
                                        </TableCell>
                                        <TableCell>
                                            {record.check_out_time
                                                ? format(
                                                      new Date(
                                                          record.check_out_time
                                                      ),
                                                      'HH:mm:ss'
                                                  )
                                                : '-'}
                                        </TableCell>
                                        <TableCell>
                                            {record.check_in_location ? (
                                                <Box
                                                    sx={{
                                                        display: 'flex',
                                                        alignItems: 'center',
                                                    }}
                                                >
                                                    <LocationOn
                                                        sx={{
                                                            fontSize: 16,
                                                            mr: 0.5,
                                                            color: 'primary.main',
                                                        }}
                                                    />
                                                    <Typography variant="body2">
                                                        {
                                                            record.check_in_location
                                                        }
                                                    </Typography>
                                                </Box>
                                            ) : (
                                                '-'
                                            )}
                                        </TableCell>
                                        <TableCell>
                                            {record.check_out_location ? (
                                                <Box
                                                    sx={{
                                                        display: 'flex',
                                                        alignItems: 'center',
                                                    }}
                                                >
                                                    <LocationOn
                                                        sx={{
                                                            fontSize: 16,
                                                            mr: 0.5,
                                                            color: 'primary.main',
                                                        }}
                                                    />
                                                    <Typography variant="body2">
                                                        {
                                                            record.check_out_location
                                                        }
                                                    </Typography>
                                                </Box>
                                            ) : (
                                                '-'
                                            )}
                                        </TableCell>
                                        <TableCell>
                                            <Chip
                                                label={
                                                    record.status === 'normal'
                                                        ? '正常'
                                                        : '迟到'
                                                }
                                                color={
                                                    record.status === 'normal'
                                                        ? 'success'
                                                        : 'warning'
                                                }
                                                size="small"
                                            />
                                        </TableCell>
                                    </TableRow>
                                ))}
                            </TableBody>
                        </Table>
                    </TableContainer>
                ) : (
                    <Box
                        sx={{
                            textAlign: 'center',
                            py: 5,
                            color: 'text.secondary',
                        }}
                    >
                        该月份暂无考勤记录
                    </Box>
                )}
            </Paper>

            <Snackbar
                open={snackbar.open}
                autoHideDuration={3000}
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
