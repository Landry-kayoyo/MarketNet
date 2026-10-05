const { spawnSync } = require('node:child_process');
const fs = require('node:fs');
const path = require('node:path');

const root = path.resolve(__dirname, '..');
const npm = process.platform === 'win32' ? 'npm.cmd' : 'npm';

function clearPrismaCache() {
  const prismaCacheDir = path.join(root, 'node_modules', '.prisma');
  if (!fs.existsSync(prismaCacheDir)) {
    return;
  }

  try {
    fs.rmSync(prismaCacheDir, { recursive: true, force: true });
  } catch (error) {
    const code = error && typeof error === 'object' && 'code' in error ? error.code : null;
    if (code === 'EPERM' || code === 'EBUSY' || code === 'EACCES') {
      console.warn('Skipping Prisma cache cleanup because the client is locked on this platform:', error.message);
      return;
    }

    throw error;
  }
}

function run(args) {
  const result = spawnSync(npm, args, {
    cwd: root,
    env: process.env,
    stdio: 'inherit',
    shell: process.platform === 'win32',
  });

  if (result.error) throw result.error;
  if (result.status !== 0) process.exit(result.status ?? 1);
}

clearPrismaCache();
run(['--workspace', 'apps/api', 'exec', '--', 'prisma', 'generate']);
run(['--workspace', 'apps/api', 'run', 'build']);
run(['--workspace', 'apps/web', 'run', 'build']);

if (process.env.VERCEL_ENV === 'production') {
  if (!process.env.DIRECT_URL) {
    throw new Error('DIRECT_URL is required for production Prisma migrations.');
  }

  run(['--workspace', 'apps/api', 'exec', '--', 'prisma', 'migrate', 'deploy']);
} else {
  console.log('Skipping database migration: this is not a Vercel Production build.');
}
