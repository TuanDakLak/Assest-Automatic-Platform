/**
 * Selector discovery tool for the NotebookLM worker.
 *
 *   node inspect-notebooklm.js
 *
 * Opens NotebookLM in the SAME browser context the worker uses (same
 * session.json, same launch flags), then lets you walk through the flow by hand
 * and dump every clickable element at each step.
 *
 * Why not just look at the page in your own Chrome: the worker runs headless
 * Chromium loading cookies that were saved from a different browser. If Google
 * treats that as a suspicious session, the worker sees a login wall while your
 * normal Chrome sees the real app. This script reproduces the worker's view.
 *
 * Env:
 *   HEADLESS=true                     run headless, exactly like the worker
 *   NOTEBOOKLM_SESSION_STATE_PATH=... absolute path to session.json
 */
const { chromium } = require('playwright');
const readline = require('readline');
const path = require('path');
const fs = require('fs');
const profile = require('./browser-profile');

const SESSION_PATH = process.env.NOTEBOOKLM_SESSION_STATE_PATH
  || path.join(__dirname, 'session.json');
const HEADLESS = process.env.HEADLESS === 'true';

/** Selectors the worker currently relies on, in the order it uses them. */
const WORKER_SELECTORS = [
  ['Step 2 — tạo notebook', '[aria-label="Create new notebook"], [aria-label="Tạo sổ ghi chú mới"], [aria-label="Create new"], [aria-label="Tạo mới"], [aria-label="New notebook"], button:has-text("Create new"), button:has-text("Tạo mới"), button:has-text("New notebook"), mat-card[role="button"]:has-text("Create new notebook"), mat-card[role="button"]:has-text("Tạo sổ ghi chú mới")'],
  ['Step 3a — mở panel nguồn', '[aria-label="Add source"], [aria-label="Thêm nguồn"], button:has-text("Add sources"), button:has-text("Thêm nguồn")'],
  ['Step 3b — chọn Upload files', 'button:has-text("Upload files"), button:has-text("Tải tệp lên"), [aria-label="Upload files"]'],
  ['Step 4 — nguồn đã index xong', 'input[type="checkbox"][aria-label]:not([aria-label*="Select all" i]):not([aria-label*="Chọn tất cả" i])'],
  ['Step 5a — mở panel Slide Deck', '[aria-label="Slide Deck"], [aria-label="Bản trình bày"], [role="button"][aria-label*="Slide Deck" i]'],
  ['Step 5b — ô nhập mô tả', 'textarea[aria-label="Describe the slide deck you want to create"], textarea[aria-label*="slide deck" i]'],
  ['Step 5c — nút Generate', 'button:has-text("Generate"), button:has-text("Tạo")'],
  ['Step 6 — nút tải về', 'button[title*="Download" i], button[title*="Tải xuống" i], button[aria-label*="Download" i], button[aria-label*="Tải xuống" i], button:has-text("Download"), button:has-text("Tải xuống")'],
];

async function dumpInteractive(page) {
  return page.evaluate(() => {
    const sel = 'button, a[href], [role="button"], [role="menuitem"], [role="tab"], input, textarea, [contenteditable="true"]';
    const out = [];
    for (const el of document.querySelectorAll(sel)) {
      const rect = el.getBoundingClientRect();
      const visible = rect.width > 0 && rect.height > 0
        && getComputedStyle(el).visibility !== 'hidden'
        && getComputedStyle(el).display !== 'none';
      const text = (el.innerText || el.value || '').trim().replace(/\s+/g, ' ').slice(0, 70);
      const aria = el.getAttribute('aria-label');
      const title = el.getAttribute('title');
      if (!text && !aria && !title && el.tagName !== 'INPUT') continue;
      out.push({
        tag: el.tagName.toLowerCase(),
        type: el.getAttribute('type') || '',
        role: el.getAttribute('role') || '',
        visible,
        text,
        aria: aria || '',
        title: title || '',
      });
    }
    return out;
  });
}

/** Fingerprint of the current DOM, used to prove a click actually did something. */
async function pageFingerprint(page) {
  const els = await dumpInteractive(page).catch(() => []);
  return `${page.url()}|${els.length}|${els.map((e) => e.aria || e.text).join('~').slice(0, 400)}`;
}

/**
 * Clicks a selector and waits for the page to actually change.
 *
 * Returns false when the DOM is byte-identical afterwards — which is the
 * situation this whole session kept hitting: a step label was recorded but the
 * app never moved, so every capture showed the same notebook list.
 */
async function clickAndWait(page, selector, label, timeoutMs = 15000) {
  const before = await pageFingerprint(page);

  const loc = page.locator(selector).first();
  try {
    await loc.waitFor({ state: 'visible', timeout: timeoutMs });
  } catch {
    console.log(`\n  >> Không tìm thấy "${label}" để bấm. Selector chưa khớp ở màn hình này.`);
    return false;
  }

  // An Angular CDK backdrop makes everything outside the dialog unclickable.
  // Detect it up front instead of letting Playwright retry for 35 seconds.
  const backdrop = page.locator('.cdk-overlay-backdrop-showing');
  if ((await backdrop.count()) > 0) {
    const inDialog = await loc
      .evaluate((el) => Boolean(el.closest('.cdk-overlay-container')))
      .catch(() => false);

    if (!inDialog) {
      console.log(`\n  >> "${label}" đang bị lớp phủ modal che. Có hộp thoại đang mở.`);
      console.log('     Bấm thứ gì đó BÊN TRONG hộp thoại, hoặc gõ  esc  để đóng nó.');
      return false;
    }
  }

  try {
    await loc.click({ timeout: timeoutMs });
  } catch (err) {
    console.log(`\n  >> Bấm "${label}" thất bại: ${err.message.split('\n')[0]}`);
    return false;
  }
  console.log(`\n  >> Đã bấm "${label}". Đang chờ trang đổi...`);

  const deadline = Date.now() + timeoutMs;
  while (Date.now() < deadline) {
    await page.waitForTimeout(700);
    if ((await pageFingerprint(page)) !== before) {
      await page.waitForTimeout(1500); // let animations settle
      console.log('  >> Trang đã đổi.');
      return true;
    }
  }

  console.log('  >> Bấm xong nhưng trang KHÔNG đổi gì. Có thể nút bị chặn hoặc sai phần tử.');
  return false;
}

/**
 * Clicks "Upload files" and attaches a file without letting the operating
 * system's picker appear.
 *
 * Clicking that button opens a NATIVE dialog. It lives outside the page, so no
 * Playwright call can close it — the script would just hang. Intercepting the
 * `filechooser` event handles the dialog before it is drawn, which is exactly
 * what the worker now does.
 */
async function uploadFile(page, filePath) {
  const uploadBtn = page
    .locator('button:has-text("Upload files"), [aria-label="Upload files"]')
    .first();

  if (!(await uploadBtn.isVisible().catch(() => false))) {
    console.log('\n  !! Không thấy nút "Upload files". Mở panel nguồn trước:');
    console.log('     click:Add source');
    return false;
  }

  try {
    const [chooser] = await Promise.all([
      page.waitForEvent('filechooser', { timeout: 20000 }),
      uploadBtn.click(),
    ]);
    await chooser.setFiles(filePath);
    console.log(`\n  >> Đã gắn file: ${path.basename(filePath)}`);
    await page.waitForTimeout(3000);
    return true;
  } catch (err) {
    console.log(`\n  !! Gắn file thất bại: ${err.message.split('\n')[0]}`);
    return false;
  }
}

async function report(page, label) {
  console.log('\n' + '='.repeat(78));
  console.log(`  ${label}`);
  console.log(`  URL: ${page.url()}`);
  console.log('='.repeat(78));

  const url = page.url();

  // Redirected to a Google sign-in page = the session was rejected.
  if (/accounts\.google\.com|ServiceLogin|signin/i.test(url)) {
    console.log('\n  !! Đang ở trang đăng nhập Google — session.json bị từ chối.');
    console.log('     Đây là nguyên nhân, không phải selector sai.\n');
  }

  // The marketing site, not the app. The end anchor matters: without it this
  // also flags the real app at notebook.google.COM.
  if (/^https:\/\/(www\.)?(notebook|notebooklm)\.google(\/|\?|#|$)/.test(url)) {
    console.log('\n  !! Đây là TRANG GIỚI THIỆU, không phải ứng dụng.');
    console.log('     Ứng dụng nằm ở https://notebooklm.google.com/ (có .com).');
    console.log('     Mọi selector sẽ trượt ở đây — không phải lỗi tên nút.\n');
  }

  const els = await dumpInteractive(page);
  const visible = els.filter((e) => e.visible);

  console.log(`\n-- Phần tử bấm được đang HIỆN (${visible.length}/${els.length}) --`);
  for (const e of visible) {
    const parts = [`<${e.tag}${e.type ? ' type=' + e.type : ''}>`];
    if (e.text) parts.push(`text="${e.text}"`);
    if (e.aria) parts.push(`aria-label="${e.aria}"`);
    if (e.title) parts.push(`title="${e.title}"`);
    if (e.role) parts.push(`role=${e.role}`);
    console.log('   ' + parts.join('  '));
  }

  const fileInputs = els.filter((e) => e.tag === 'input' && e.type === 'file');
  console.log(`\n-- input[type=file]: ${fileInputs.length} (kể cả ẩn — Playwright vẫn dùng được) --`);

  console.log('\n-- Đối chiếu selector worker đang dùng --');
  for (const [stage, selector] of WORKER_SELECTORS) {
    let total = 0;
    let vis = 0;
    try {
      const loc = page.locator(selector);
      total = await loc.count();
      for (let i = 0; i < total; i++) {
        if (await loc.nth(i).isVisible().catch(() => false)) vis++;
      }
    } catch (err) {
      console.log(`   ERR   ${stage}: ${err.message.split('\n')[0]}`);
      continue;
    }
    const mark = vis > 0 ? 'KHỚP ' : total > 0 ? 'ẨN   ' : 'TRƯỢT';
    console.log(`   ${mark} ${stage}  (khớp ${total}, hiện ${vis})`);
  }

  const shot = path.join(__dirname, `notebooklm_${label.replace(/\W+/g, '_')}.png`);
  await page.screenshot({ path: shot, fullPage: false });
  console.log(`\n   Ảnh màn hình: ${shot}`);
}

async function main() {
  if (!fs.existsSync(SESSION_PATH)) {
    console.log(`\n!! Không tìm thấy session.json tại: ${SESSION_PATH}`);
    console.log('   Chạy `pnpm save-session` trước, hoặc đặt NOTEBOOKLM_SESSION_STATE_PATH.\n');
  } else {
    const size = fs.statSync(SESSION_PATH).size;
    console.log(`session.json: ${SESSION_PATH} (${size} bytes)`);
    if (size < 500) {
      console.log('!! File rất nhỏ — nhiều khả năng đã lưu khi chưa đăng nhập xong.');
    }
  }

  // Same shared profile the worker and save-session.js use, so what you see
  // here is what the worker sees.
  const { browser, channel } = await profile.launchBrowser(chromium, HEADLESS, console.log);
  if (channel === 'chromium') {
    console.log('\n!! Đang dùng Chromium đóng gói — Google hay từ chối bản này.\n');
  }

  const context = await profile.createContext(browser, {
    ...(fs.existsSync(SESSION_PATH) ? { storageState: SESSION_PATH } : {}),
    acceptDownloads: true,
  });

  const page = await context.newPage();
  page.setDefaultTimeout(35000);

  // The .com host is the app. "notebooklm.google" (no .com) is the marketing
  // site. hl=en asks Google for an English UI regardless of the account's
  // language setting — the browser locale alone does not change it.
  const base = process.env.NOTEBOOKLM_URL || 'https://notebooklm.google.com/';
  const APP_URL = new URL(base);
  if (process.env.NOTEBOOKLM_FORCE_ENGLISH !== 'false') {
    APP_URL.searchParams.set('hl', 'en');
  }

  console.log(`\nĐang mở ${APP_URL.toString()} ...`);
  await page.goto(APP_URL.toString(), { waitUntil: 'domcontentloaded' });
  await page.waitForTimeout(5000);

  /**
   * Clicking through the app can open a new tab. Always report on the most
   * recently opened page, otherwise every capture after the first keeps
   * dumping the stale first tab — which looks exactly like "the click did
   * nothing".
   */
  const activePage = () => {
    const pages = context.pages().filter((p) => !p.isClosed());
    return pages[pages.length - 1] || page;
  };

  await report(activePage(), 'landing');

  const rl = readline.createInterface({ input: process.stdin, output: process.stdout });
  const ask = (q) => new Promise((r) => rl.question(q, r));

  // Auto mode: the script drives the first hop itself using the confirmed
  // Step 2 selector, so discovering the post-create UI does not depend on
  // anyone remembering to click in the browser window.
  if (process.env.AUTO !== 'false') {
    console.log('\n' + '-'.repeat(78));
    console.log('CHẾ ĐỘ TỰ ĐỘNG: script tự bấm "Create new notebook".');
    console.log('Đặt AUTO=false nếu muốn tự thao tác tay hoàn toàn.');
    console.log('-'.repeat(78));

    const moved = await clickAndWait(
      activePage(),
      WORKER_SELECTORS[0][1],
      'Create new notebook',
    );

    if (moved) {
      // The source dialog opens by itself but renders a beat later. Waiting
      // avoids capturing a half-built page — the earlier run showed only 13
      // elements because the modal had not appeared yet.
      const p = activePage();
      await p
        .locator('button:has-text("Upload files")')
        .first()
        .waitFor({ state: 'visible', timeout: 20000 })
        .then(() => console.log('  >> Hộp thoại chọn nguồn đã mở.'))
        .catch(() => console.log('  >> Hộp thoại chưa tự mở sau 20s.'));

      await report(activePage(), 'sau-khi-tao-notebook');
    } else {
      console.log('\n  Không vào được màn hình notebook. Thử bấm tay rồi gõ tên bước.');
    }
  }

  console.log('\n' + '-'.repeat(78));
  console.log('Lệnh dùng được  (CHÚ Ý: phải có tiền tố click: hoặc upload:)');
  console.log('  click:<chữ>        bấm phần tử chứa đoạn chữ đó, rồi chụp');
  console.log('                     ví dụ:  click:Add source');
  console.log('                             click:Slide Deck');
  console.log('  upload:<đường dẫn> gắn file vào ô Upload files, rồi chụp');
  console.log('                     ví dụ:  upload:C:\\temp\\test.md');
  console.log('  <tên bước>         CHỈ chụp lại, KHÔNG bấm gì');
  console.log('  q                  thoát');
  console.log('');
  console.log('Nếu bấm tay trên cửa sổ trình duyệt, nhớ đợi trang load xong rồi mới gõ.');
  console.log('URL và số phần tử trong bản chụp phải khác lần trước — nếu giống hệt');
  console.log('nghĩa là trang chưa đổi và bản chụp đó vô nghĩa.');
  console.log('-'.repeat(78));

  let lastFingerprint = await pageFingerprint(activePage());

  for (;;) {
    const input = (await ask('\nTên bước / click:<chữ> / q: ')).trim();
    if (!input || input.toLowerCase() === 'q') break;

    const open = context.pages().filter((p) => !p.isClosed());
    if (open.length > 1) {
      console.log(`\n  (${open.length} tab đang mở — chụp tab mới nhất)`);
    }

    if (input.toLowerCase() === 'esc') {
      await activePage().keyboard.press('Escape');
      await activePage().waitForTimeout(1200);
      console.log('\n  >> Đã gửi Escape.');
      await report(activePage(), 'sau-khi-esc');
      lastFingerprint = await pageFingerprint(activePage());
      continue;
    }

    if (input.toLowerCase().startsWith('click:')) {
      const needle = input.slice(6).trim();
      if (!needle) continue;
      // Match on aria-label first, then visible text.
      const selector = `[aria-label*="${needle}" i], button:has-text("${needle}"), [role="button"]:has-text("${needle}")`;
      await clickAndWait(activePage(), selector, needle);
      await report(activePage(), `click_${needle}`);
      lastFingerprint = await pageFingerprint(activePage());
      continue;
    }

    if (input.toLowerCase().startsWith('upload:')) {
      const filePath = input.slice(7).trim();
      if (!fs.existsSync(filePath)) {
        console.log(`\n  !! Không thấy file: ${filePath}`);
        continue;
      }
      await uploadFile(activePage(), filePath);
      await report(activePage(), 'sau-khi-upload');
      lastFingerprint = await pageFingerprint(activePage());
      continue;
    }

    const now = await pageFingerprint(activePage());
    if (now === lastFingerprint) {
      console.log('\n  !! Trang KHÔNG đổi so với bản chụp trước — bản chụp này sẽ trùng lặp.');
      console.log('     Hãy thao tác trên cửa sổ trình duyệt trước, hoặc dùng click:<chữ>.');
    }
    lastFingerprint = now;

    await report(activePage(), input);
  }

  rl.close();
  await browser.close();
  console.log('\nXong. Gửi toàn bộ output ở trên để tôi sửa selector.\n');
}

main().catch((err) => {
  console.error('Lỗi:', err.message);
  process.exit(1);
});
