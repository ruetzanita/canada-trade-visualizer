/** @type {import('next').NextConfig} */
const nextConfig = {
  ...(process.env.NODE_ENV === 'production' ? { output: 'export' } : {}),
  // Next.js 15+ Image optimization relies on Node.js by default.
  // Since we are exporting a static site, we need to disable unoptimized images.
  images: {
    unoptimized: true,
  },
};

export default nextConfig;
