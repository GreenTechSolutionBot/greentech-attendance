'use client';

import api from '@/lib/api';
import { useRouter } from 'next/navigation';
import { useState } from 'react';

export default function LoginPage() {
    const router = useRouter();
    const [formData, setFormData] = useState({
        username: '',
        password: '',
    });
    const [error, setError] = useState('');
    const [loading, setLoading] = useState(false);

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        setError('');
        setLoading(true);

        try {
            const response = await api.post('/auth/login', formData);
            const { token, user } = response.data;

            localStorage.setItem('token', token);
            localStorage.setItem('user', JSON.stringify(user));

            router.push('/dashboard');
        } catch (err: any) {
            setError(err.response?.data?.error || '登录失败，请重试');
        } finally {
            setLoading(false);
        }
    };

    return (
        <div
            style={{
                minHeight: '100vh',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
            }}
        >
            <div
                style={{
                    background: 'white',
                    padding: '40px',
                    borderRadius: '12px',
                    boxShadow: '0 10px 40px rgba(0,0,0,0.1)',
                    width: '100%',
                    maxWidth: '400px',
                }}
            >
                <h1
                    style={{
                        fontSize: '28px',
                        fontWeight: 'bold',
                        marginBottom: '8px',
                        textAlign: 'center',
                        color: '#1f2937',
                    }}
                >
                    GreenTech
                </h1>
                <p
                    style={{
                        textAlign: 'center',
                        color: '#6b7280',
                        marginBottom: '32px',
                    }}
                >
                    考勤管理系统
                </p>

                {error && (
                    <div
                        style={{
                            padding: '12px',
                            marginBottom: '20px',
                            background: '#fee2e2',
                            color: '#991b1b',
                            borderRadius: '6px',
                            fontSize: '14px',
                        }}
                    >
                        {error}
                    </div>
                )}

                <form onSubmit={handleSubmit}>
                    <div className="form-group">
                        <label className="form-label">用户名</label>
                        <input
                            type="text"
                            className="form-input"
                            value={formData.username}
                            onChange={(e) =>
                                setFormData({
                                    ...formData,
                                    username: e.target.value,
                                })
                            }
                            required
                            placeholder="请输入用户名"
                        />
                    </div>

                    <div className="form-group">
                        <label className="form-label">密码</label>
                        <input
                            type="password"
                            className="form-input"
                            value={formData.password}
                            onChange={(e) =>
                                setFormData({
                                    ...formData,
                                    password: e.target.value,
                                })
                            }
                            required
                            placeholder="请输入密码"
                        />
                    </div>

                    <button
                        type="submit"
                        className="btn btn-primary"
                        disabled={loading}
                        style={{ width: '100%', marginTop: '8px' }}
                    >
                        {loading ? '登录中...' : '登录'}
                    </button>
                </form>

                <div
                    style={{
                        marginTop: '20px',
                        padding: '12px',
                        background: '#f3f4f6',
                        borderRadius: '6px',
                        fontSize: '13px',
                        color: '#6b7280',
                    }}
                >
                    <p>
                        <strong>默认管理员账号：</strong>
                    </p>
                    <p>用户名: admin</p>
                    <p>密码: admin123</p>
                </div>
            </div>
        </div>
    );
}
