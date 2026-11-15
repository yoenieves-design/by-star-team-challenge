import { readFile, writeFile } from 'node:fs/promises';
import Ajv from 'ajv';
import standaloneCode from 'ajv/dist/standalone/index.js';

// Compile validators ahead of time so the browser can run under a strict script policy.
const ajv = new Ajv({ code: { source: true, esm: true, lines: true }, allErrors: true });
for (const file of ['packet-stream', 'scenario', 'mission']) {
  const source = await readFile(new URL('../schemas/' + file + '.schema.json', import.meta.url), 'utf8');
  ajv.addSchema(JSON.parse(source));
}
const schemas = { validatePackets: 'packet-stream', validateScenario: 'scenario', validateMission: 'mission' };
const imports = new Map();
// Ajv emits CommonJS runtime helpers even for its standalone ESM exports.
const compiled = standaloneCode(ajv, schemas).replace(/require\("(ajv\/dist\/runtime\/[a-z0-9]+)"\)\.default/g, (_, path) => {
  if (!imports.has(path)) imports.set(path, 'helper' + imports.size);
  return imports.get(path);
});
if (/\brequire\(/.test(compiled)) throw new Error('Review the new Ajv standalone runtime dependencies.');
const moduleLines = Array.from(imports, ([path, name]) =>
  'import ' + name + 'Module from ' + JSON.stringify(path + '.js') + ';\nconst ' + name
    + ' = typeof ' + name + 'Module === "function" ? ' + name + 'Module : ' + name + 'Module.default;');
const output = ['// Generated from schemas/. Run npm run schemas to rebuild.', ...moduleLines, compiled, ''].join('\n');
await writeFile(new URL('../src/adapters/validators.generated.js', import.meta.url), output);
