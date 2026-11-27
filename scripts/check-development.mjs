/**
 * Bundles the TypeScript development self-test with esbuild (a Vite
 * dependency) and runs it in Node.
 */
import { build } from 'esbuild';
import { mkdtemp, rm } from 'node:fs/promises';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import { pathToFileURL } from 'node:url';

const directory = await mkdtemp(join(tmpdir(), 'strandpath-development-'));
const outfile = join(directory, 'selftest.mjs');

try {
  await build({
    entryPoints: ['src/development/selftest.ts'],
    outfile,
    bundle: true,
    format: 'esm',
    platform: 'node',
    target: 'node20',
    logLevel: 'silent'
  });
  await import(pathToFileURL(outfile).href);
} finally {
  await rm(directory, { recursive: true, force: true });
}
