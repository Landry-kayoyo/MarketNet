const { spawnSync } = require('node:child_process');
const fs = require('node:fs');
const path = require('node:path');

const root = path.resolve(__dirname, '..');
const npm = process.platform === 'win32' ? 'npm.cmd' : 'npm';

function clearPrismaCache() {
  const prismaCacheDir = path.join(root, 'node_modules', '.prisma');
  const clientDir = path.join(prismaCacheDir, 'client');

  if (fs.existsSync(clientDir)) {
    for (const entry of fs.readdirSync(clientDir)) {
      if (entry.includes('.tmp') || entry.startsWith('query_engine-') && entry.includes('.tmp')) {
        const tempPath = path.join(clientDir, entry);
        try {
          fs.unlinkSync(tempPath);
        } catch (error) {
          // Ignore temp-file cleanup errors; the main cache removal below is the real reset.
        }
      }
    }
  }

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

function run(args, { allowFailure = false } = {}) {
  const result = spawnSync(npm, args, {
    cwd: root,
    env: process.env,
    stdio: 'inherit',
    shell: process.platform === 'win32',
  });

  if (result.error) throw result.error;
  if (!allowFailure && result.status !== 0) process.exit(result.status ?? 1);
}

clearPrismaCache();
run(['--workspace', 'apps/api', 'run', 'prisma:generate']);
run(['--workspace', 'apps/api', 'run', 'build']);
run(['--workspace', 'apps/web', 'run', 'build']);

if (process.env.VERCEL_ENV === 'production') {
  if (!process.env.DIRECT_URL) {
    throw new Error('DIRECT_URL is required for production Prisma migrations.');
  }

  // The database may be in an inconsistent state where _prisma_migrations records
  // migrations as applied but the actual tables are missing (e.g. after a Supabase
  // project reset). Roll back both migrations so migrate deploy re-applies them
  // from scratch against the current idempotent SQL.
  // allowFailure=true because the migration may not exist in _prisma_migrations at all
  // on a brand-new database, in which case resolve exits with a non-zero code.
  run(
    ['--workspace', 'apps/api', 'run', 'prisma:resolve', '--', '--rolled-back', '20261005_marketnet_init'],
    { allowFailure: true },
  );
  run(
    ['--workspace', 'apps/api', 'run', 'prisma:resolve', '--', '--rolled-back', '20261005_guest_checkout_remove_client_role'],
    { allowFailure: true },
  );

  run(['--workspace', 'apps/api', 'run', 'prisma:deploy']);
} else {
  console.log('Skipping database migration: this is not a Vercel Production build.');
}
