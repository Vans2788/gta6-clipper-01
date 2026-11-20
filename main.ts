// gta6-clipper-01 entry.
//
// The competition is decided by how many views the linked YouTube video
// earns, not by anything this program computes. The program's only job is
// to hand the gate the video's address: it copies VIDEO.json from the
// repository root into the output directory, unchanged.
//
// Directories come from the environment so the same code runs both in the
// grader's container and locally:
//   MAKEFUN_BOT_DIR    - where VIDEO.json lives (default: /bot)
//   MAKEFUN_OUTPUT_DIR - where the copy must land (default: /output)
//
// Local check, run from the repository root:
//   mkdir -p out && MAKEFUN_BOT_DIR=. MAKEFUN_OUTPUT_DIR=out node main.ts

import { existsSync, mkdirSync, readFileSync, writeFileSync } from 'node:fs';
import { join } from 'node:path';

const sourceDir = process.env.MAKEFUN_BOT_DIR ?? '/bot';
const outputDir = process.env.MAKEFUN_OUTPUT_DIR ?? '/output';

const sourceFile = join(sourceDir, 'VIDEO.json');
const targetFile = join(outputDir, 'VIDEO.json');

if (!existsSync(sourceFile)) {
  console.error(`error: VIDEO.json not found in ${sourceDir}`);
  process.exit(1);
}

try {
  mkdirSync(outputDir, { recursive: true });
  const contents = readFileSync(sourceFile);

  // Validate the payload before handing it to the gate: it must be JSON
  // with a non-empty "url" string, otherwise the entry scores nothing
  // and the failure should be loud here, not silent in the gate.
  let parsed: unknown;
  try {
    parsed = JSON.parse(contents.toString('utf8'));
  } catch {
    console.error(`error: VIDEO.json in ${sourceDir} is not valid JSON`);
    process.exit(1);
  }
  const url = (parsed as { url?: unknown } | null)?.url;
  if (typeof url !== 'string' || url.length === 0) {
    console.error(`error: VIDEO.json in ${sourceDir} has no non-empty "url" field`);
    process.exit(1);
  }

  writeFileSync(targetFile, contents);

  // Confirm the copy landed byte-for-byte; a partial write must not
  // pass as a successful entry.
  const copied = readFileSync(targetFile);
  if (!copied.equals(contents)) {
    console.error(`error: copied VIDEO.json in ${outputDir} differs from the source`);
    process.exit(1);
  }
} catch (err) {
  const reason = err instanceof Error ? err.message : String(err);
  console.error(`error: failed to copy VIDEO.json from ${sourceDir} to ${outputDir}: ${reason}`);
  process.exit(1);
}
