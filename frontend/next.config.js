/** @type {import('next').NextConfig} */
const nextConfig = {
  reactStrictMode: true,
  async rewrites() {
    return [
      {
        source: '/api/:path*',
        destination: 'http://localhost:8082/api/:path*',
      },
      // OCR feed service (port 8081)
      {
        source: '/ocr-api/:path*',
        destination: 'http://localhost:8081/api/:path*',
      },
    ];
  },
};

module.exports = nextConfig;
