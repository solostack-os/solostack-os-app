/** @type {import('next').NextConfig} */
const nextConfig = {
  experimental: {
    // Both packages ship native binaries (@react-pdf pulls pdfkit/fontkit,
    // sharp wraps libvips). Marking them external keeps webpack from trying
    // to bundle the native modules — Node requires them at runtime instead.
    serverComponentsExternalPackages: ["@react-pdf/renderer", "sharp"],
  },
};

export default nextConfig;
