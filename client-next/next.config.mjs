/** @type {import('next').NextConfig} */
const nextConfig = {
  transpilePackages: ['@package/name'], 
  
  experimental: {
    
  },

  async rewrites() {
    return {
      beforeFiles: [
        {
          source: '/admin',
          destination: 'http://localhost:3001/admin',
        },
        {
          source: '/admin/:path*',
          destination: 'http://localhost:3001/admin/:path*',
        },
        {
          source: '/catalogo',
          destination: 'http://localhost:3002/catalogo',
        },
        {
          source: '/catalogo/:path*',
          destination: 'http://localhost:3002/catalogo/:path*',
        },
      ],
    };
  },
};

export default nextConfig;

