/** @type {import('next').NextConfig} */
const nextConfig = {
  reactStrictMode: true,
  experimental: {
    // pdfkit reads its built-in font metrics (data/*.afm) from disk at
    // runtime via __dirname — webpack-bundling it breaks those paths in
    // production (ENOENT under .next/server), which silently killed the
    // Verification_Summary.pdf upload to HubSpot. Keep it external so it
    // loads from node_modules, where its data files actually live.
    serverComponentsExternalPackages: ["pdfkit"],
  },
};

export default nextConfig;
