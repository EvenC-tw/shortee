module.exports = {
  distDir: 'build',
  reactStrictMode: true,
  async headers() {
    return [
      {
        source: '/index',
        headers: [
          {
            key: 'Cache-Control',
            value: 'no-cache',
          },
        ],
      },
    ];
  },
};
