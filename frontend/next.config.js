// /** @type {import('next').NextConfig} */
// module.exports = {
//   reactStrictMode: true,
// }
// next.config.js
module.exports = {
    async rewrites() {
        return [
          {
            source: '/api/:path*',
            destination: 'http://localhost:5000/:path*',
          },
        ]
      },
  };
