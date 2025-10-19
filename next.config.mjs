export default {
  reactStrictMode: true,
  images: {
    remotePatterns: [
      { protocol: 'https', hostname: 'images.unsplash.com' },
      { protocol: 'https', hostname: 'plus.unsplash.com' }
    ]
  },
  // Ensure proper static file serving
  trailingSlash: false,
  generateEtags: false,
  poweredByHeader: false,
  compress: true
};