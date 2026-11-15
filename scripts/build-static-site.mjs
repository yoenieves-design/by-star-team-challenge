import { readFile, writeFile } from 'node:fs/promises';

const template = await readFile(new URL('../index.html', import.meta.url), 'utf8');
const html = template.replace('</head>', '  <link rel="stylesheet" href="./assets/by-star-app.css">\n  </head>')
  .replace('<script type="module" src="/src/app/main.ts"></script>', '<script src="./assets/by-star-app.js" defer></script>');
await writeFile(new URL('../dist/index.html', import.meta.url), html);
// Keep the project's license alongside every deployed static build.
await writeFile(new URL('../dist/LICENSE.txt', import.meta.url), await readFile(new URL('../LICENSE', import.meta.url), 'utf8'));

const thirdParty = {
  'Inter Variable font': '@fontsource-variable/inter/LICENSE',
  'lit-html': 'lit-html/LICENSE',
  'Ajv validator runtime': 'ajv/LICENSE',
  'fast-deep-equal validator helper': 'fast-deep-equal/LICENSE',
};
const notices = await Promise.all(Object.entries(thirdParty).map(async ([name, path]) =>
  name + '\n\n' + (await readFile(new URL('../node_modules/' + path, import.meta.url), 'utf8')).replaceAll('\r\n', '\n').trim()));
const imageCredit = 'Moon imagery: NASA’s Scientific Visualization Studio. https://svs.gsfc.nasa.gov/11747/';
await writeFile(new URL('../dist/THIRD-PARTY-NOTICES.txt', import.meta.url), [imageCredit, ...notices].join('\n\n---\n\n') + '\n');
