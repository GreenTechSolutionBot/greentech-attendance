/** @type {import('next').NextConfig} */
const nextConfig = {
    output: 'standalone',
    typescript: {
        // 在生产构建时忽略 TypeScript 错误
        ignoreBuildErrors: true,
    },
    eslint: {
        // 在生产构建时忽略 ESLint 错误
        ignoreDuringBuilds: true,
    },
    async rewrites() {
        return [
            {
                source: '/api/:path*',
                destination: 'http://localhost:8081/api/:path*',
            },
        ];
    },
};

module.exports = nextConfig;
