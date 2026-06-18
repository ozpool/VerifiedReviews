import hre from 'hardhat';
import { mkdir, writeFile } from 'fs/promises';
import path from 'path';

/**
 * Extracts compiled ABIs and writes them as typed `as const` modules into
 * @vr/shared, so the API and web app consume one canonical copy. The address
 * registry stays env-driven (see shared/src/addresses.ts).
 *
 * Run after compile: pnpm -F @vr/contracts export-abis
 */
const OUT_DIR = path.resolve(__dirname, '../../shared/src/abis');

const TARGETS = [
  { name: 'VisitProofSBT', varName: 'visitProofSbtAbi', file: 'visitProofSbt.ts' },
  { name: 'ReviewRegistry', varName: 'reviewRegistryAbi', file: 'reviewRegistry.ts' },
];

async function main() {
  await mkdir(OUT_DIR, { recursive: true });

  for (const target of TARGETS) {
    const artifact = await hre.artifacts.readArtifact(target.name);
    const contents =
      `// Generated from packages/contracts artifacts. Do not edit by hand.\n` +
      `// Regenerate with: pnpm -F @vr/contracts export-abis\n` +
      `export const ${target.varName} = ${JSON.stringify(artifact.abi, null, 2)} as const;\n`;
    await writeFile(path.join(OUT_DIR, target.file), contents, 'utf8');
    console.log(`Wrote ${target.file} (${artifact.abi.length} entries)`);
  }
}

main().catch((error) => {
  console.error(error);
  process.exitCode = 1;
});
