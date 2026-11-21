// Stands in for modules a test can't load here (Electron, a real mail server). Call it first, then
// load what's under test with `await import(…)` (a static import would load before the fakes exist).
import { registerHooks } from 'node:module';

export function fakeModules(fakes: Record<string, string>): void {
  registerHooks({
    resolve: (specifier, context, next) =>
      Object.hasOwn(fakes, specifier) ? { url: `fake:${specifier}`, shortCircuit: true } : next(specifier, context),
    load: (url, context, next) =>
      url.startsWith('fake:')
        ? { format: 'module', source: fakes[url.slice(5)], shortCircuit: true }
        : next(url, context),
  });
}
