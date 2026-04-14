/** @type {import('next').NextConfig} */
const nextConfig = {
  async redirects() {
    return [
      {
        source: '/services',
        destination: 'https://hsoaresseguros.com.br/',
        permanent: true
      },
      {
        source: '/:path*',
        has: [{ type: 'host', value: 'www.hsoaresseguros.com.br' }],
        destination: 'https://hsoaresseguros.com.br/:path*',
        permanent: true
      }
    ];
  },
  images: {
    remotePatterns: [
      { protocol: 'https', hostname: 'images.unsplash.com' },
      { protocol: 'https', hostname: 'www.porto.vc' }
    ]
  }
};

export default nextConfig;
