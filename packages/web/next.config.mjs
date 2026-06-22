/** @type {import('next').NextConfig} */
const nextConfig = {
  // Transpile @vr/shared (workspace package, not compiled separately).
  transpilePackages: ['@vr/shared'],

  // Keep build strict — fails on type errors caught by next build.
  typescript: {
    ignoreBuildErrors: false,
  },
  eslint: {
    ignoreDuringBuilds: false,
  },

  webpack(config) {
    // @metamask/sdk pulls in @react-native-async-storage/async-storage as an
    // optional dep that doesn't exist in a browser build. Stub it out so the
    // module graph resolves cleanly.
    // pino-pretty is an optional pretty-printer for pino used by WalletConnect;
    // not needed in the browser — stub it too.
    config.resolve.fallback = {
      ...config.resolve.fallback,
      'pino-pretty': false,
      '@react-native-async-storage/async-storage': false,
    };
    return config;
  },
};

export default nextConfig;
