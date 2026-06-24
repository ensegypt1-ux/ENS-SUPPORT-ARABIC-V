import type { NextConfig } from "next";
import path from "node:path";
import { fileURLToPath } from "node:url";

const projectRoot = path.dirname(fileURLToPath(import.meta.url));

/**
 * Domains allowed to embed the chat widget (`/embed`) in an iframe.
 * Set EMBED_ALLOWED_ORIGINS to a comma/space separated list of origins,
 * e.g. "https://acme.com https://shop.acme.com". Unset = embeddable anywhere.
 */
const embedFrameAncestors = (() => {
  const raw = process.env.EMBED_ALLOWED_ORIGINS?.trim();
  if (!raw) return "*";
  const origins = raw
    .split(/[\s,]+/)
    .map((o) => o.trim())
    .filter(Boolean);
  return origins.length > 0 ? `'self' ${origins.join(" ")}` : "*";
})();

const nextConfig: NextConfig = {
  // Pin workspace root so Next/Turbopack do not resolve via a parent lockfile.
  turbopack: {
    root: projectRoot,
  },
  async headers() {
    return [
      {
        source: "/embed",
        headers: [
          {
            key: "Content-Security-Policy",
            value: `frame-ancestors ${embedFrameAncestors};`,
          },
        ],
      },
    ];
  },
  reactCompiler: true,
  experimental: {
    // Limit parallel static-generation workers (prevents Windows worker crashes).
    cpus: 4,
    workerThreads: false,
    serverActions: {
      bodySizeLimit: "20mb", // Increase from default 1MB to 20MB for file uploads
    },
  },
  images: {
    remotePatterns: [
      {
        protocol: "https",
        hostname: "**.r2.dev",
        port: "",
        pathname: "/**",
      },
    ],
  },
};

export default nextConfig;
