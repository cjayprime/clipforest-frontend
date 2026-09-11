import type { NextConfig } from 'next';

// The browser only ever talks to this app's own origin; the server forwards /api
// to the backend, which is deployed separately. Auth cookies stay first-party and
// no CORS is involved. Next.js resolves rewrites at build time, so in a container
// build API_INTERNAL_URL must be a --build-arg (see Dockerfile), not a runtime env.
const apiOrigin = process.env.API_INTERNAL_URL ?? 'http://localhost:4000';

const nextConfig: NextConfig = {
  output: 'standalone',
  poweredByHeader: false,
  async rewrites() {
    return [{ source: '/api/:path*', destination: `${apiOrigin}/api/:path*` }];
  },
  images: {
    // Thumbnails are short-lived signed storage URLs rendered with plain <img>.
    unoptimized: true,
  },
};

export default nextConfig;
