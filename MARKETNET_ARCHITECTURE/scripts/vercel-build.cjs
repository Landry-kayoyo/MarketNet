const { spawnSync } = require('node:child_process');
const path = require('node:path');

const root = path.resolve(__dirname, '..');
const npm = process.platform === 'win32' ? 'npm.cmd' : 'npm';

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

run(['--workspace', 'apps/api', 'run', 'prisma:generate']);
run(['--workspace', 'apps/api', 'run', 'build']);
run(['--workspace', 'apps/web', 'run', 'build']);

if (process.env.VERCEL_ENV === 'production') {
  if (!process.env.DIRECT_URL) {
    throw new Error('DIRECT_URL is required for production Prisma migrations.');
  }

  run(['--workspace', 'apps/api', 'run', 'prisma:deploy']);
} else {
  console.log('Skipping database migration: this is not a Vercel Production build.');
}
