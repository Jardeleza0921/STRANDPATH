import { openDb } from './db.js';
import { seed } from './seed.js';
import { startServer } from './app.js';

const port = Number(process.env.PORT || 8787);
const db = openDb();
const seeded = seed(db);

for (const account of seeded.accounts) {
  if (!account.created) continue;
  console.log(`Provisioned ${account.role} account: ${account.email}`);
  console.log('  Initial password supplied through environment; it must be changed at first sign-in.');
}
for (const warning of seeded.warnings) console.log(`NOTE: ${warning}`);

startServer({ port, db }).then((server) => {
  console.log(`STRANDPATH server listening on http://0.0.0.0:${port}`);
  const shutdown = () => {
    console.log('\nShutting down…');
    server.close(() => {
      db.close();
      process.exit(0);
    });
  };
  process.on('SIGINT', shutdown);
  process.on('SIGTERM', shutdown);
});
