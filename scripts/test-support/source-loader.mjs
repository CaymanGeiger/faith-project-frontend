import { readFileSync, existsSync } from 'node:fs';
import { createRequire } from 'node:module';
import path from 'node:path';
import vm from 'node:vm';
import ts from 'typescript';

const projectRoot = path.resolve(import.meta.dirname, '../..');
const require = createRequire(path.join(projectRoot, 'package.json'));

// Compile actual app modules, replacing only native/network boundaries.
// React hooks run through the real React renderer, not a simulated hook loop.
export function sourceLoader(mocks = {}, globals = {}) {
  const cache = new Map();
  function load(file) {
    const absolute = path.resolve(projectRoot, file);
    if (cache.has(absolute)) return cache.get(absolute).exports;
    if (absolute.endsWith('.json')) return JSON.parse(readFileSync(absolute, 'utf8'));
    const module = { exports: {} };
    cache.set(absolute, module);
    const compiled = ts.transpileModule(readFileSync(absolute, 'utf8'), {
      compilerOptions: { module: ts.ModuleKind.CommonJS, target: ts.ScriptTarget.ES2022, jsx: ts.JsxEmit.ReactJSX, esModuleInterop: true },
      fileName: absolute,
    }).outputText;
    const scopedRequire = (name) => {
      if (Object.hasOwn(mocks, name)) return mocks[name];
      if (name.startsWith('.')) {
        const base = path.resolve(path.dirname(absolute), name);
        const resolved = [base, `${base}.ts`, `${base}.tsx`].find((candidate) => existsSync(candidate));
        if (!resolved) throw new Error(`Unresolved test dependency: ${name}`);
        return load(resolved);
      }
      return require(name);
    };
    vm.runInNewContext(compiled, {
      module, exports: module.exports, require: scopedRequire,
      console, setTimeout, clearTimeout, setInterval, clearInterval, Date, Error, URL, process,
      __DEV__: false, ...globals,
    }, { filename: absolute });
    return module.exports;
  }
  return load;
}
