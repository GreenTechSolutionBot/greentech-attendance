'use client';

import type { User } from '@/types';
import {
    AccountBalance,
    CalendarMonth,
    CheckCircle,
    Dashboard,
    EventNote,
    ExitToApp,
    Group,
    ListAlt,
} from '@mui/icons-material';
import { usePathname, useRouter } from 'next/navigation';
import { useEffect, useState } from 'react';

export default function DashboardLayout({
    children,
}: {
    children: React.ReactNode;
}) {
    const router = useRouter();
    const pathname = usePathname();
    const [user, setUser] = useState<User | null>(null);

    useEffect(() => {
        const token = localStorage.getItem('token');
        const userData = localStorage.getItem('user');

        if (!token || !userData) {
            router.push('/login');
            return;
        }

        setUser(JSON.parse(userData));
    }, [router]);

    const handleLogout = () => {
        localStorage.removeItem('token');
        localStorage.removeItem('user');
        router.push('/login');
    };

    const isActive = (path: string) => pathname === path;

    if (!user) {
        return <div>加载中...</div>;
    }

    return (
        <div
            style={{
                display: 'flex',
                minHeight: '100vh',
                background: '#f9fafb',
            }}
        >
            {/* 侧边栏 */}
            <div
                style={{
                    width: '250px',
                    background: '#1f2937',
                    color: 'white',
                    padding: '20px',
                }}
            >
                <h2
                    style={{
                        fontSize: '20px',
                        fontWeight: 'bold',
                        marginBottom: '30px',
                    }}
                >
                    Greentech考勤系统
                </h2>

                <div
                    style={{
                        marginBottom: '30px',
                        padding: '15px',
                        background: '#374151',
                        borderRadius: '8px',
                    }}
                >
                    <p style={{ fontSize: '14px', fontWeight: '500' }}>
                        {user.name}
                    </p>
                    <p
                        style={{
                            fontSize: '12px',
                            color: '#9ca3af',
                            marginTop: '4px',
                        }}
                    >
                        {user.role === 'admin'
                            ? '管理员'
                            : user.role === 'manager'
                            ? '经理'
                            : '员工'}
                    </p>
                </div>

                <nav>
                    <NavLink
                        href="/dashboard"
                        active={isActive('/dashboard')}
                        icon={<Dashboard />}
                    >
                        工作台
                    </NavLink>
                    <NavLink
                        href="/dashboard/attendance"
                        active={isActive('/dashboard/attendance')}
                        icon={<CheckCircle />}
                    >
                        我的考勤
                    </NavLink>
                    <NavLink
                        href="/dashboard/leave"
                        active={isActive('/dashboard/leave')}
                        icon={<CalendarMonth />}
                    >
                        我的休假
                    </NavLink>
                    <NavLink
                        href="/dashboard/leave-balance"
                        active={isActive('/dashboard/leave-balance')}
                        icon={<AccountBalance />}
                    >
                        我的假期余额
                    </NavLink>

                    {user.role === 'admin' && (
                        <>
                            <div
                                style={{
                                    margin: '20px 0 10px',
                                    padding: '0 10px',
                                    fontSize: '12px',
                                    color: '#9ca3af',
                                    fontWeight: '500',
                                }}
                            >
                                管理功能
                            </div>
                            <NavLink
                                href="/dashboard/users"
                                active={isActive('/dashboard/users')}
                                icon={<Group />}
                            >
                                用户管理
                            </NavLink>
                            <NavLink
                                href="/dashboard/attendance-manage"
                                active={isActive(
                                    '/dashboard/attendance-manage'
                                )}
                                icon={<ListAlt />}
                            >
                                考勤管理
                            </NavLink>
                            <NavLink
                                href="/dashboard/leave-manage"
                                active={isActive('/dashboard/leave-manage')}
                                icon={<EventNote />}
                            >
                                休假审批
                            </NavLink>
                            <NavLink
                                href="/dashboard/leave-balances"
                                active={isActive('/dashboard/leave-balances')}
                                icon={<AccountBalance />}
                            >
                                假期余额
                            </NavLink>
                        </>
                    )}

                    <button
                        onClick={handleLogout}
                        style={{
                            width: '100%',
                            marginTop: '30px',
                            padding: '10px 15px',
                            background: '#ef4444',
                            color: 'white',
                            border: 'none',
                            borderRadius: '6px',
                            fontSize: '14px',
                            cursor: 'pointer',
                            display: 'flex',
                            alignItems: 'center',
                            justifyContent: 'center',
                            gap: '8px',
                        }}
                    >
                        <ExitToApp fontSize="small" />
                        退出登录
                    </button>
                </nav>
            </div>

            {/* 主内容区 */}
            <div style={{ flex: 1, padding: '30px' }}>{children}</div>
        </div>
    );
}

function NavLink({
    href,
    active,
    children,
    icon,
}: {
    href: string;
    active: boolean;
    children: React.ReactNode;
    icon?: React.ReactNode;
}) {
    const router = useRouter();

    return (
        <a
            onClick={() => router.push(href)}
            style={{
                display: 'flex',
                alignItems: 'center',
                gap: '10px',
                padding: '10px 15px',
                marginBottom: '5px',
                borderRadius: '6px',
                fontSize: '14px',
                cursor: 'pointer',
                background: active ? '#3b82f6' : 'transparent',
                transition: 'background 0.2s',
            }}
            onMouseEnter={(e) => {
                if (!active) e.currentTarget.style.background = '#374151';
            }}
            onMouseLeave={(e) => {
                if (!active) e.currentTarget.style.background = 'transparent';
            }}
        >
            {icon && (
                <span
                    style={{
                        display: 'flex',
                        alignItems: 'center',
                        fontSize: '20px',
                    }}
                >
                    {icon}
                </span>
            )}
            {children}
        </a>
    );
}
