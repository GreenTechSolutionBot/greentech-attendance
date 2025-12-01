import type { Metadata } from 'next';
import './globals.css';

export const metadata: Metadata = {
    title: 'Greentech考勤管理系统',
    description: '企业考勤、休假管理系统',
};

export default function RootLayout({
    children,
}: {
    children: React.ReactNode;
}) {
    return (
        <html lang="zh-CN">
            <body>{children}</body>
        </html>
    );
}
