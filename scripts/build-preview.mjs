import { readFile, writeFile } from 'node:fs/promises';

const root = new URL('../', import.meta.url);
const read = name => readFile(new URL(name, root), 'utf8');
const [html, css, js] = await Promise.all(['index.html', 'styles.css', 'app.js'].map(read));
for (const tag of ['<link rel="stylesheet" href="styles.css">', '<script src="app.js"></script>']) {
  if (html.split(tag).length !== 2) throw new Error(`Expected exactly one source reference: ${tag}`);
}
const preview = html
  .replace('<link rel="stylesheet" href="styles.css">', () => `<style>\n${css}\n</style>`)
  .replace('<script src="app.js"></script>', () => `<script>\n${js}\n</script>`);
const target = 'docs/health-inspection-preview.html';
if (process.argv.includes('--check')) {
  if (await read(target) !== preview) throw new Error('Single-file preview differs from source. Run npm run build.');
  console.log('Single-file HTML matches index.html, styles.css and app.js.');
} else {
  await writeFile(new URL(target, root), preview);
  console.log(`Built ${target}`);
}
