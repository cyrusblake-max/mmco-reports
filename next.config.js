/** @type {import('next').NextConfig} */
const nextConfig = {
  // A stray package-lock.json in the home directory makes Next infer the
  // workspace root as ~, which stalls dev startup scanning the whole disk.
  outputFileTracingRoot: __dirname,
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
