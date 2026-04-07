import { access } from 'node:fs/promises';

export async function resolve(specifier, context, defaultResolve) {
  try {
    return await defaultResolve(specifier, context, defaultResolve);
  } catch (error) {
    const isRelative = specifier.startsWith('./') || specifier.startsWith('../');
    const hasKnownExt = /\.(mjs|cjs|js|json|node|ts|tsx)$/.test(specifier);
    if (!isRelative || hasKnownExt) throw error;
    const tsSpecifier = `${specifier}.ts`;
    const resolved = await defaultResolve(tsSpecifier, context, defaultResolve);
    await access(new URL(resolved.url));
    return resolved;
  }
}
