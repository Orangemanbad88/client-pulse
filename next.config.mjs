/** @type {import('next').NextConfig} */
const nextConfig = {
  images: {
    remotePatterns: [
      {
        protocol: 'https',
        hostname: 'realtimerental.com',
      },
      {
        protocol: 'https',
        hostname: 'comp-search.vercel.app',
      },
    ],
  },
};
export default nextConfig;
