/** @type {import('next').NextConfig} */
const nextConfig = {
  reactStrictMode: true,
  output: 'standalone',
  typescript: { ignoreBuildErrors: true },
  eslint:     { ignoreDuringBuilds: true },
  async rewrites() {
    // BACKEND_URL set at container runtime (e.g. http://p2p-backend:8082 in ECS)
    const backendUrl = process.env.BACKEND_URL || 'http://localhost:8082';
    const ocrUrl    = process.env.OCR_SERVICE_URL || 'http://localhost:8081';
    return [
      {
        source: '/api/:path*',
        destination: `${backendUrl}/api/:path*`,
      },
      {
        source: '/ocr-api/:path*',
        destination: `${ocrUrl}/api/:path*`,
      },
    ];
  },
};

module.exports = nextConfig;
