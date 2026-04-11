import { access } from 'node:fs/promises';
import path from 'node:path';
import { fileURLToPath, pathToFileURL } from 'node:url';

export async function resolve(specifier, context, defaultResolve) {
  try {
    return await defaultResolve(specifier, context, defaultResolve);
  } catch (error) {
    if (
      error && typeof error === 'object' && 'code' in error && error.code === 'ERR_MODULE_NOT_FOUND'
      && (specifier.startsWith('./') || specifier.startsWith('../'))
      && !path.extname(specifier)
      && context.parentURL
    ) {
      const parentPath = fileURLToPath(context.parentURL);
      const candidatePath = path.resolve(path.dirname(parentPath), `${specifier}.ts`);
      try {
        await access(candidatePath);
        return {
          url: pathToFileURL(candidatePath).href,
          shortCircuit: true,
        };
      } catch {
        // fall through
      }
    }
    throw error;
  }
}
