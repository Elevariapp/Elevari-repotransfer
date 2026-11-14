/**
 * Test-only ESM loader:
 *  - maps `@prisma/client` to a stub (types are erased at runtime)
 *  - resolves Node-style `./x.js` specifiers to the real `./x.ts` sources
 * Usage: node --import ./scripts/certification/register.mjs <script>
 */
import { existsSync } from 'node:fs';
import { fileURLToPath } from 'node:url';

const PRISMA_STUB = new URL('./stubs/prisma-client.mjs', import.meta.url).href;

export async function resolve(specifier, context, next) {
  if (specifier === '@prisma/client') {
    return { url: PRISMA_STUB, shortCircuit: true };
  }

  if (specifier.startsWith('.') && specifier.endsWith('.js') && context.parentURL?.startsWith('file:')) {
    const target = new URL(specifier, context.parentURL);
    const asTs = target.href.replace(/\.js$/, '.ts');
    if (existsSync(fileURLToPath(asTs))) {
      return { url: asTs, shortCircuit: true };
    }
  }

  return next(specifier, context);
}
