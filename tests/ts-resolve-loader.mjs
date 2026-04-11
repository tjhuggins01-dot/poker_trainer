import { access } from 'node:fs/promises';

const tryFile = async (url) => {
  try {
    await access(url);
    return true;
  } catch {
    return false;
  }
};

export async function resolve(specifier, context, defaultResolve) {
  try {
    return await defaultResolve(specifier, context, defaultResolve);
  } catch (error) {
    const isRelative = specifier.startsWith('./') || specifier.startsWith('../');
    const hasKnownExt = /\.(mjs|cjs|js|json|node|ts|tsx)$/.test(specifier);
    if (!isRelative || hasKnownExt) throw error;

    const candidates = [`${specifier}.ts`, `${specifier}.tsx`, `${specifier}/index.ts`];
    for (const candidate of candidates) {
      const url = new URL(candidate, context.parentURL);
      if (await tryFile(url)) {
        return { url: url.href, shortCircuit: true };
      }
    }

    throw error;
  }
}
