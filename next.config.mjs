/** @type {import('next').NextConfig} */
const nextConfig = {
  experimental: {
    // React-PDF pulls in native-ish deps (pdfkit, fontkit) that don't play
    // nicely with webpack bundling. Marking it external lets Node require it
    // at runtime from node_modules inside the server bundle.
    serverComponentsExternalPackages: ["@react-pdf/renderer"],
  },
};

export default nextConfig;
