'use client';

import api from '@/lib/api';
import type { User } from '@/types';
import { useEffect, useState } from 'react';

export default function UsersPage() {
    const [users, setUsers] = useState<User[]>([]);
    const [showModal, setShowModal] = useState(false);
    const [formData, setFormData] = useState({
        username: '',
        password: '',
        name: '',
        email: '',
        phone: '',
        role: 'employee',
        department: '',
        position: '',
    });

    useEffect(() => {
        loadUsers();
    }, []);

    const loadUsers = async () => {
        try {
            const response = await api.get('/users');
            setUsers(response.data);
        } catch (error) {
            console.error('加载用户列表失败:', error);
        }
    };

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        try {
            await api.post('/users', formData);
            alert('用户创建成功！');
            setShowModal(false);
            setFormData({
                username: '',
                password: '',
                name: '',
                email: '',
                phone: '',
                role: 'employee',
                department: '',
                position: '',
            });
            loadUsers();
        } catch (error: any) {
            alert(error.response?.data?.error || '创建失败');
        }
    };

    const handleDelete = async (id: number) => {
        if (!confirm('确定要删除该用户吗？')) return;

        try {
            await api.delete(`/users/${id}`);
            alert('删除成功！');
            loadUsers();
        } catch (error: any) {
            alert(error.response?.data?.error || '删除失败');
        }
    };

    return (
        <div>
            <div className="flex-between mb-4">
                <h1 style={{ fontSize: '28px', fontWeight: 'bold' }}>
                    用户管理
                </h1>
                <button
                    onClick={() => setShowModal(true)}
                    className="btn btn-primary"
                >
                    添加用户
                </button>
            </div>

            <div className="card">
                <table className="table">
                    <thead>
                        <tr>
                            <th>ID</th>
                            <th>用户名</th>
                            <th>姓名</th>
                            <th>邮箱</th>
                            <th>电话</th>
                            <th>角色</th>
                            <th>部门</th>
                            <th>职位</th>
                            <th>操作</th>
                        </tr>
                    </thead>
                    <tbody>
                        {users.map((user) => (
                            <tr key={user.id}>
                                <td>{user.id}</td>
                                <td>{user.username}</td>
                                <td>{user.name}</td>
                                <td>{user.email || '-'}</td>
                                <td>{user.phone || '-'}</td>
                                <td>
                                    <span
                                        className={`badge ${
                                            user.role === 'admin'
                                                ? 'badge-danger'
                                                : 'badge-info'
                                        }`}
                                    >
                                        {user.role === 'admin'
                                            ? '管理员'
                                            : user.role === 'manager'
                                            ? '经理'
                                            : '员工'}
                                    </span>
                                </td>
                                <td>{user.department || '-'}</td>
                                <td>{user.position || '-'}</td>
                                <td>
                                    {user.username !== 'admin' && (
                                        <button
                                            onClick={() =>
                                                handleDelete(user.id)
                                            }
                                            className="btn btn-danger"
                                            style={{
                                                padding: '6px 12px',
                                                fontSize: '12px',
                                            }}
                                        >
                                            删除
                                        </button>
                                    )}
                                </td>
                            </tr>
                        ))}
                    </tbody>
                </table>
            </div>

            {/* 添加用户模态框 */}
            {showModal && (
                <div
                    style={{
                        position: 'fixed',
                        top: 0,
                        left: 0,
                        right: 0,
                        bottom: 0,
                        background: 'rgba(0,0,0,0.5)',
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                        zIndex: 1000,
                        overflow: 'auto',
                        padding: '20px',
                    }}
                >
                    <div
                        className="card"
                        style={{
                            width: '600px',
                            maxWidth: '100%',
                            margin: '20px auto',
                        }}
                    >
                        <h2
                            style={{
                                fontSize: '20px',
                                fontWeight: 'bold',
                                marginBottom: '20px',
                            }}
                        >
                            添加用户
                        </h2>
                        <form onSubmit={handleSubmit}>
                            <div
                                style={{
                                    display: 'grid',
                                    gridTemplateColumns: '1fr 1fr',
                                    gap: '16px',
                                }}
                            >
                                <div className="form-group">
                                    <label className="form-label">
                                        用户名 *
                                    </label>
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
                                    />
                                </div>

                                <div className="form-group">
                                    <label className="form-label">密码 *</label>
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
                                        minLength={6}
                                    />
                                </div>

                                <div className="form-group">
                                    <label className="form-label">姓名 *</label>
                                    <input
                                        type="text"
                                        className="form-input"
                                        value={formData.name}
                                        onChange={(e) =>
                                            setFormData({
                                                ...formData,
                                                name: e.target.value,
                                            })
                                        }
                                        required
                                    />
                                </div>

                                <div className="form-group">
                                    <label className="form-label">角色 *</label>
                                    <select
                                        className="form-select"
                                        value={formData.role}
                                        onChange={(e) =>
                                            setFormData({
                                                ...formData,
                                                role: e.target.value,
                                            })
                                        }
                                        required
                                    >
                                        <option value="employee">员工</option>
                                        <option value="manager">经理</option>
                                        <option value="admin">管理员</option>
                                    </select>
                                </div>

                                <div className="form-group">
                                    <label className="form-label">邮箱</label>
                                    <input
                                        type="email"
                                        className="form-input"
                                        value={formData.email}
                                        onChange={(e) =>
                                            setFormData({
                                                ...formData,
                                                email: e.target.value,
                                            })
                                        }
                                    />
                                </div>

                                <div className="form-group">
                                    <label className="form-label">电话</label>
                                    <input
                                        type="tel"
                                        className="form-input"
                                        value={formData.phone}
                                        onChange={(e) =>
                                            setFormData({
                                                ...formData,
                                                phone: e.target.value,
                                            })
                                        }
                                    />
                                </div>

                                <div className="form-group">
                                    <label className="form-label">部门</label>
                                    <input
                                        type="text"
                                        className="form-input"
                                        value={formData.department}
                                        onChange={(e) =>
                                            setFormData({
                                                ...formData,
                                                department: e.target.value,
                                            })
                                        }
                                    />
                                </div>

                                <div className="form-group">
                                    <label className="form-label">职位</label>
                                    <input
                                        type="text"
                                        className="form-input"
                                        value={formData.position}
                                        onChange={(e) =>
                                            setFormData({
                                                ...formData,
                                                position: e.target.value,
                                            })
                                        }
                                    />
                                </div>
                            </div>

                            <div
                                className="flex gap-2 mt-4"
                                style={{ justifyContent: 'flex-end' }}
                            >
                                <button
                                    type="button"
                                    onClick={() => setShowModal(false)}
                                    className="btn btn-secondary"
                                >
                                    取消
                                </button>
                                <button
                                    type="submit"
                                    className="btn btn-primary"
                                >
                                    创建用户
                                </button>
                            </div>
                        </form>
                    </div>
                </div>
            )}
        </div>
    );
}
