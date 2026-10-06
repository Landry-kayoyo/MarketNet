const path = require('node:path');

/** @type {import('next').NextConfig} */
const nextConfig = {
  // Root du monorepo : MARKETNET_ARCHITECTURE/
  // Ce fichier est dans MARKETNET_ARCHITECTURE/apps/web/
  outputFileTracingRoot: path.join(__dirname, '../../'),
};

module.exports = nextConfig;
