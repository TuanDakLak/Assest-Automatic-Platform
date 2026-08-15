/**
 * Shared browser fingerprint for every Google-facing Playwright session.
 *
 * WHY THIS FILE EXISTS
 *
 * Google binds a signed-in session loosely to the browser that created it. If
 * cookies are saved from one browser fingerprint and replayed from a different
 * one, Google bounces the session to a sign-in page — and then refuses the
 * sign-in too, with "This browser or app may not be secure".
 *
 * That is exactly what happened when `save-session.js` used real Chrome with
 * stealth flags while `notebooklm.processor.ts` replayed the cookies in a bare
 * bundled Chromium. Both sides now import this file, so the two fingerprints
 * cannot drift apart.
 *
 * Plain CommonJS on purpose: it is required from `save-session.js` (JS, run by
 * node) and from the compiled NestJS worker. The relative path
 * `../../../browser-profile` resolves to this file from both
 * `src/modules/notebooklm/` and `dist/modules/notebooklm/`.
 */

/** Pinned so the saved session and the replayed session look identical. */
const USER_AGENT =
  'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/122.0.0.0 Safari/537.36';

const VIEWPORT = { width: 1280, height: 800 };

/**
 * English on purpose, for two reasons:
 *
 * 1. The worker's selectors match English button text ("New notebook",
 *    "Generate slide deck", "Download"). A Vietnamese UI silently breaks all
 *    of them and looks identical to a selector bug.
 * 2. The session must be SAVED under the same locale it is REPLAYED under.
 *    Saving in vi-VN and replaying in en-US is one more difference for Google
 *    to notice.
 */
const LOCALE = 'en-US';
const ACCEPT_LANGUAGE = 'en-US,en;q=0.9';
const TIMEZONE = 'Asia/Ho_Chi_Minh';

/** Flags that keep Chrome from advertising itself as automated. */
function launchOptions(headless) {
  return {
    headless: Boolean(headless),
    args: [
      '--disable-blink-features=AutomationControlled',
      '--no-sandbox',
      '--disable-setuid-sandbox',
      '--disable-infobars',
      `--window-size=${VIEWPORT.width},${VIEWPORT.height}`,
    ],
  };
}

function contextOptions(extra = {}) {
  return {
    viewport: VIEWPORT,
    userAgent: USER_AGENT,
    locale: LOCALE,
    timezoneId: TIMEZONE,
    extraHTTPHeaders: { 'Accept-Language': ACCEPT_LANGUAGE },
    ...extra,
  };
}

/** Runs before any page script; hides the clearest automation tell. */
function stealthInit() {
  Object.defineProperty(navigator, 'webdriver', { get: () => undefined });
}

/**
 * Launches real Chrome when available, then Edge, then bundled Chromium.
 *
 * Order matters: Google is markedly more tolerant of a genuine Chrome build
 * than of Playwright's bundled Chromium, and the bundled build is what the
 * worker was failing on.
 */
async function launchBrowser(chromium, headless, log = () => {}) {
  const opts = launchOptions(headless);

  for (const channel of ['chrome', 'msedge']) {
    try {
      const browser = await chromium.launch({ ...opts, channel });
      log(`Launched ${channel}${headless ? ' (headless)' : ''}.`);
      return { browser, channel };
    } catch (err) {
      log(`${channel} unavailable: ${err.message.split('\n')[0]}`);
    }
  }

  const browser = await chromium.launch(opts);
  log('Falling back to bundled Chromium. Google may reject this session.');
  return { browser, channel: 'chromium' };
}

/** Creates a context with the shared fingerprint and the stealth patch applied. */
async function createContext(browser, extra = {}) {
  const context = await browser.newContext(contextOptions(extra));
  await context.addInitScript(stealthInit);
  return context;
}

module.exports = {
  USER_AGENT,
  VIEWPORT,
  LOCALE,
  TIMEZONE,
  ACCEPT_LANGUAGE,
  launchOptions,
  contextOptions,
  stealthInit,
  launchBrowser,
  createContext,
};
