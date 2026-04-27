import path from 'path';

/** @type {import('next').NextConfig} */
const nextConfig = {
  // 警告メッセージの指示に従い、experimental の外（トップレベル）に配置
  turbopack: {
    root: path.resolve(process.cwd()),
  },
  
  // キャッシュ問題を最小化
  onDemandEntries: {
    maxInactiveAge: 25 * 1000,
    pagesBufferLength: 2,
  },

  // セキュリティヘッダー（キャッシュ無効化）
  async headers() {
    return [
      {
        source: '/(.*)',
        headers: [
          {
            key: 'Cache-Control',
            value: 'no-store, max-age=0, must-revalidate',
          },
        ],
      },
    ];
  },
};

export default nextConfig;
