import fs from 'fs';
import path from 'path';
import { pathToFileURL } from 'url';

function resolveProjectSpecifier(specifier) {
  const relative = specifier.slice(2);
  const basePath = path.join(process.cwd(), relative);
  const candidates = [
    `${basePath}.js`,
    `${basePath}.mjs`,
    path.join(basePath, 'index.js'),
    path.join(basePath, 'index.mjs'),
    basePath
  ];

  const match = candidates.find((candidate) => fs.existsSync(candidate) && fs.statSync(candidate).isFile());
  return match ? pathToFileURL(match).href : null;
}

export async function resolve(specifier, context, nextResolve) {
  if (specifier === 'server-only') {
    return nextResolve(pathToFileURL(path.join(process.cwd(), 'scripts/server-only-noop.mjs')).href, context);
  }

  if (specifier.startsWith('@/')) {
    const resolved = resolveProjectSpecifier(specifier);
    if (resolved) {
      return nextResolve(resolved, context);
    }
  }

  return nextResolve(specifier, context);
}
