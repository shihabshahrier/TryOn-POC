/** @type {import('next').NextConfig} */
const nextConfig = {
  reactStrictMode: true,
  swcMinify: true,
  async rewrites() {
    return [
      {
        source: '/api/:path*',
        destination: 'http://localhost:8000/:path*',
      },
      {
        source: '/api/static/:path*',
        destination: 'http://localhost:8000/static/:path*',
      },
    ]
  },
}

module.exports = nextConfig

