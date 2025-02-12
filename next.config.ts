import { NextConfig } from 'next';
import { NextFederationPlugin } from '@module-federation/nextjs-mf';

const nextConfig: NextConfig = {
  reactStrictMode: true,
  webpack: (config, { isServer }) => {
    if (!isServer) {
      config.plugins = config.plugins || [];
      config.plugins.push(
        new NextFederationPlugin({
          name: 'MicroFrontend',
          filename: 'static/chunks/remoteEntry.js',
          exposes: {
            './MicroFrontend': './src/components/MicroFrontend',
          },
          shared: {
            react: { singleton: true, requiredVersion: false },
            'react-dom': { singleton: true, requiredVersion: false },
          },
          remotes: {
            MicroFrontend:
              'MicroFrontend@http://localhost:3000/_next/static/chunks/remoteEntry.js',
          },
          extraOptions: {},
        })
      );
    }
    return config;
  },
};

export default nextConfig;
