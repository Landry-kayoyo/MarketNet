const path = require('node:path');

/** @type {import('next').NextConfig} */
const nextConfig = {
  // Point to the monorepo root (MARKETNET_ARCHITECTURE/) so Next.js can
  // trace files and find packages from the shared node_modules.
  // From apps/web/, one level up ('..')  = MARKETNET_ARCHITECTURE/
  outputFileTracingRoot: path.join(__dirname, '..'),
};

module.exports = nextConfig;
