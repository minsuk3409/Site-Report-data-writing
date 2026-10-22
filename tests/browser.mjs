import assert from 'node:assert/strict';
import { createServer } from 'node:http';
import { readFile, mkdir, writeFile } from 'node:fs/promises';
import { createRequire } from 'node:module';
const { chromium } = createRequire(import.meta.url)('playwright');

const root = new URL('../', import.meta.url);
const allowed = new Map([
  ['/', ['index.html', 'text/html']],
  ['/index.html', ['index.html', 'text/html']],
  ['/styles.css', ['styles.css', 'text/css']],
  ['/app.js', ['app.js', 'text/javascript']],
  ['/docs/health-inspection-preview.html', ['docs/health-inspection-preview.html', 'text/html']],
]);
const server = createServer(async (req, res) => {
  const asset = allowed.get(new URL(req.url, 'http://localhost').pathname);
  if (!asset) { res.writeHead(404); res.end(); return; }
  try {
    const content = await readFile(new URL(asset[0], root));
    res.writeHead(200, { 'Content-Type': `${asset[1]}; charset=utf-8` });
    res.end(content);
  } catch { res.writeHead(500); res.end(); }
});
await new Promise(resolve => server.listen(0, '127.0.0.1', resolve));
const origin = `http://127.0.0.1:${server.address().port}`;
const errors = [];
const external = [];
function observe(page) {
  page.on('pageerror', error => errors.push(error.message));
  page.on('console', message => { if (message.type() === 'error') errors.push(message.text()); });
  page.on('request', request => {
    if (!request.url().startsWith(origin) && !request.url().startsWith('data:') && !request.url().startsWith('blob:')) external.push(request.url());
  });
}
let browser;
try {
  browser = await chromium.launch({ headless: true, executablePath: process.env.PLAYWRIGHT_CHROMIUM_EXECUTABLE, args: ['--no-sandbox'] });
  const routes = ['dashboard', 'inspections', 'upload', 'analysis', 'report', 'template'];
  await mkdir(new URL('test-results/', root), { recursive: true });
  let comparisons = 0;
  for (const viewport of [{ width: 1440, height: 1000 }, { width: 390, height: 844 }]) {
    const context = await browser.newContext({ viewport });
    const page = await context.newPage();
    observe(page);
    for (const route of routes) {
      const images = [];
      for (const path of ['/', '/docs/health-inspection-preview.html']) {
        await page.goto(`${origin}${path}#${route}`);
        await page.locator(`#app[data-view="${route}"] h1`).waitFor();
        await page.evaluate(() => document.fonts.ready);
        assert(await page.evaluate(() => document.documentElement.scrollWidth <= innerWidth + 1), `${route} overflows at ${viewport.width}px`);
        images.push(await page.screenshot({ fullPage: true, animations: 'disabled' }));
      }
      assert(images[0].equals(images[1]), `${route} differs from reference HTML at ${viewport.width}px`);
      await writeFile(new URL(`test-results/${route}-${viewport.width}.png`, root), images[0]);
      comparisons++;
    }
    await context.close();
  }

  const context = await browser.newContext({ viewport: { width: 1440, height: 1000 }, acceptDownloads: true });
  const page = await context.newPage();
  observe(page);
  async function route(name) {
    await page.goto(`${origin}/#${name}`);
    await page.locator(`#app[data-view="${name}"] h1`).waitFor();
  }
  await route('dashboard');
  await page.locator('[data-category="1"]').click();
  assert.equal(await page.locator('.recent-panel tbody tr').count(), 1);
  await page.locator('.sidebar nav a[href="#inspections"]').click();
  await page.locator('#site-search').fill('존재하지 않는 현장');
  assert.match(await page.locator('#list-results').innerText(), /조건에 맞는 점검이 없습니다/);
  await page.locator('#site-search').fill('');
  await page.locator('#type-filter').selectOption('all');
  await page.locator('#status-filter').selectOption('최종 확정');
  assert.equal(await page.locator('#list-results [data-open]').count(), 2);
  await page.locator('#site-search').fill('업무시설');
  assert.equal(await page.locator('#list-results [data-open]').count(), 1);
  await page.locator('#list-results [data-open]').click();
  await page.locator('#report-editor').waitFor();
  assert.match(await page.locator('#report-editor').inputValue(), /한랭질환 모니터링/);

  async function upload(filename, site = '검수용 가상현장') {
    await route('upload');
    await page.locator('[name="site"]').fill(site);
    await page.locator('[name="date"]').fill('2026-10-23');
    await page.locator('[name="author"]').fill('검수 담당자');
    await page.locator('#files').setInputFiles({ name: filename, mimeType: 'application/octet-stream', buffer: Buffer.from('synthetic test data') });
    await page.locator('#upload-form [type="submit"]').click();
  }
  await upload('unsupported.exe');
  assert.match(await page.locator('#upload-error').innerText(), /지원 형식/);
  for (const extension of ['xls', 'xlsx', 'hwp', 'hwpx', 'ppt', 'pptx', 'pdf']) {
    await upload(`synthetic.${extension}`);
    await page.locator('#review-form').waitFor();
    assert((await page.locator('#app').innerText()).includes(`synthetic.${extension}`));
  }
  const site = '<img src=x onerror="window.injected=true">';
  await upload('synthetic.xlsx', site);
  await page.locator('#review-form').waitFor();
  assert((await page.locator('.page-heading').innerText()).includes(site));
  assert.equal(await page.locator('#app img').count(), 0);
  assert.equal(await page.evaluate(() => window.injected), undefined);
  await page.locator('#review-form [type="submit"]').click();
  assert.equal(new URL(page.url()).hash, '#analysis');
  const finding = '검수용 휴게시설 기록 보완 필요 <script>window.injected=true</script>';
  const health = '검수용 건강관리 기록 추가 확인 필요';
  await page.locator('[name="finding"]').fill(finding);
  await page.locator('[name="health"]').fill(health);
  await page.locator('#review-confirm').check();
  await page.locator('#review-form [type="submit"]').click();
  await page.locator('#report-editor').waitFor();
  assert((await page.locator('#report-editor').inputValue()).includes(finding));
  assert((await page.locator('#report-editor').inputValue()).includes(health));
  assert.equal(await page.evaluate(() => window.injected), undefined);
  const edited = '검수용 보고서\n내용 수정 및 미리보기 확인';
  await page.locator('#report-editor').fill(edited);
  await page.locator('#preview').click();
  assert.equal(await page.locator('#report-preview').innerText(), edited);
  await page.locator('#preview').click();
  await page.locator('.sidebar nav a[href="#template"]').click();
  await page.locator('a[href="#report"]').click();
  assert.equal(await page.locator('#report-editor').inputValue(), edited);
  const pending = page.waitForEvent('download');
  await page.locator('#download').click();
  const download = await pending;
  assert.equal(await readFile(await download.path(), 'utf8'), edited);
  await page.goto(`${origin}/#unknown-route`);
  await page.locator('#app[data-view="dashboard"] h1').waitFor();
  assert.deepEqual(errors, [], 'Browser errors');
  assert.deepEqual(external, [], 'Unexpected external requests');
  console.log(`PASS: ${comparisons} pixel-identical desktop/mobile reference comparisons; filters, all supported file extensions, validation, review, editing, download and escaping; no browser errors or external requests.`);
  await context.close();
} finally {
  if (browser) await browser.close();
  await new Promise(resolve => server.close(resolve));
}
