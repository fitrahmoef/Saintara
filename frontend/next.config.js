/** @type {import('next').NextConfig} */
const nextConfig = {
  reactStrictMode: true,
  images: {
    domains: ['placehold.co'],
  },
  // Enable standalone output for Docker
  output: 'standalone',
}

module.exports = nextConfig
