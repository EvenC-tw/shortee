const withTM = require('next-transpile-modules')(['antd']);

module.exports = withTM({
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
  webpack: (config) => {
    // 配置 Less 支持
    config.module.rules.push({
      test: /\.less$/,
      use: [
        {
          loader: 'style-loader',
        },
        {
          loader: 'css-loader',
          options: {
            importLoaders: 1,
          },
        },
        {
          loader: 'less-loader',
          options: {
            lessOptions: {
              javascriptEnabled: true,
            },
          },
        },
      ],
    });

    // 配置 CSS 支持
    config.module.rules.push({
      test: /\.css$/,
      use: ['style-loader', 'css-loader'],
    });

    return config;
  },
});
