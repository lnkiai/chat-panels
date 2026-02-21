/** @type {import('next').NextConfig} */
const nextConfig = {
  // TypeScript errors must be fixed — no longer bypassed
  // Cloudflare Pages: images must be unoptimized (no sharp on edge)
  images: {
    unoptimized: true,
  },
}

export default nextConfig
