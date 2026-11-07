import {randomUUID} from "node:crypto";

const release = process.env.BD_BUILD_SHA || randomUUID();

/** @type {import('next').NextConfig} */
const nextConfig = {
  output: "standalone",
  poweredByHeader: false,
  generateBuildId: async () => release,
  deploymentId: release,
  env: { BD_RELEASE: release },
  outputFileTracingIncludes: { "/sw.js": ["./pwa/worker.js"] },
};

export default nextConfig;
