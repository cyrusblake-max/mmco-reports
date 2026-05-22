/** @type {import('next').NextConfig} */
const nextConfig = {
  images: {
    remotePatterns: [
      { protocol: 'https', hostname: 'images.unsplash.com' },
      { protocol: 'https', hostname: '**.cloudfront.net' },
      { protocol: 'https', hostname: 'cdnjs.cloudflare.com' },
    ],
  },
  webpack: (config) => {
    // pdfjs-dist ships as ESM; tell webpack to leave its canvas mock alone
    config.resolve.alias.canvas = false
    return config
  },
}
module.exports = nextConfig
