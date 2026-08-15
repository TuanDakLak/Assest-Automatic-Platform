/**
 * Selectors for the Gemini Notebook web app (formerly NotebookLM).
 *
 * Two things make this file necessary rather than inlining selectors:
 *
 * 1. THE UI LANGUAGE FOLLOWS THE GOOGLE ACCOUNT, NOT THE BROWSER.
 *    Setting Playwright's `locale` and `Accept-Language` to en-US does not
 *    switch the interface. A Vietnamese account sees "Tạo mới" where an English
 *    account sees "Create new". Appending `?hl=en` usually forces English, but
 *    it is not guaranteed, so every text selector below lists both languages.
 *
 * 2. NEVER USE A BARE `:has-text()`.
 *    Playwright matches ancestors too, so `:has-text("Generating")` matches
 *    <html> and <body> on any page containing that word. A status check built
 *    on it waits forever for <body> to disappear. Always anchor to a tag or an
 *    attribute.
 *
 * When the UI changes, run `pnpm inspect:notebooklm` and update this file only.
 */

/** Base URL of the app. The `.google` host without `.com` is a marketing site. */
export const APP_URL = process.env.NOTEBOOKLM_URL || 'https://notebooklm.google.com/';

/** Appended to force English regardless of the account's language setting. */
export const FORCE_ENGLISH_PARAM = 'hl=en';

export function buildAppUrl(): string {
  const url = new URL(APP_URL);
  if (process.env.NOTEBOOKLM_FORCE_ENGLISH !== 'false') {
    url.searchParams.set('hl', 'en');
  }
  return url.toString();
}

/** Hosts that mean we actually reached the app. */
export const APP_HOST_PATTERN = /notebooklm\.google\.com|notebook\.google\.com/;

/**
 * Marketing site — every app selector will miss here.
 *
 * The end anchor matters: without it this also matched the real app at
 * notebook.google.COM, because ".google" is a prefix of ".google.com".
 */
export const MARKETING_HOST_PATTERN =
  /^https:\/\/(www\.)?(notebook|notebooklm)\.google(\/|\?|#|$)/;

/**
 * Angular CDK's modal backdrop. While this exists, every element outside the
 * dialog is unclickable — Playwright reports "subtree intercepts pointer
 * events" and retries until it times out.
 *
 * Its presence is the reliable signal that a dialog is open, which matters
 * because the source dialog opens on its own after a notebook is created and
 * takes a moment to render.
 */
export const OVERLAY_BACKDROP = '.cdk-overlay-backdrop-showing';

/**
 * Brief typed into the "Customize Slide Deck" dialog. This is what steers the
 * generated slides toward extractable 3D assets rather than text-heavy pages.
 */
export const SLIDE_DECK_BRIEF =
  process.env.NOTEBOOKLM_SLIDE_PROMPT ||
  'Create a slide presentation featuring 3D assets and elements on a clean, light background. ' +
    'Each slide should centre one isolated graphic object with generous margins and minimal text.';

export const SELECTORS = {
  /**
   * Step 2 — start a new notebook.
   *
   * Confirmed live on 2026-08-14 against a Vietnamese account:
   *   <button aria-label="Tạo sổ ghi chú mới">  text "add Tạo mới"
   *   <mat-card role="button">                  text "add Tạo sổ ghi chú mới"
   *
   * aria-label comes first because it is the most stable handle; the visible
   * text is "Tạo mới" while the label is "Tạo sổ ghi chú mới", so matching on
   * text alone is fragile.
   */
  newNotebook: [
    '[aria-label="Create new notebook"]',
    '[aria-label="Tạo sổ ghi chú mới"]',
    '[aria-label="Create new"]',
    '[aria-label="Tạo mới"]',
    '[aria-label="New notebook"]',
    'button:has-text("Create new")',
    'button:has-text("Tạo mới")',
    'button:has-text("New notebook")',
    // The large "+" card in the recent-notebooks grid (Angular Material).
    'mat-card[role="button"]:has-text("Create new notebook")',
    'mat-card[role="button"]:has-text("Tạo sổ ghi chú mới")',
  ].join(', '),

  /**
   * Step 3a — open the source panel.
   *
   * After creating a notebook the source dialog usually opens on its own. This
   * is the fallback for when it does not, or when it was dismissed.
   */
  addSources: [
    '[aria-label="Add source"]',
    '[aria-label="Thêm nguồn"]',
    'button:has-text("Add sources")',
    'button:has-text("Thêm nguồn")',
  ].join(', '),

  /**
   * Step 3b — switch the dialog to file upload.
   *
   * CRITICAL: `input[type=file]` does not exist until this is clicked.
   * Confirmed live 2026-08-14: 0 file inputs on the freshly created notebook,
   * 1 after clicking "Upload files". The worker used to skip this click and
   * then waited for an input that could never appear.
   */
  uploadFilesTab: [
    'button:has-text("Upload files")',
    'button:has-text("Tải tệp lên")',
    '[aria-label="Upload files"]',
  ].join(', '),

  /** Step 3c — the picker itself. Hidden, but setInputFiles works anyway. */
  fileInput: 'input[type="file"]',

  /**
   * Step 4 — source indexing indicator.
   *
   * Anchored to progress roles first because those are language independent.
   * Text variants are tag-scoped so they cannot match <body>.
   */
  indexing: [
    '[role="progressbar"]',
    '[aria-busy="true"]',
    'span:has-text("Indexing")',
    'span:has-text("Đang lập chỉ mục")',
    'div[role="status"]:has-text("Indexing")',
    'div[role="status"]:has-text("Đang lập chỉ mục")',
  ].join(', '),

  /**
   * Step 5 — ask for a slide deck.
   *
   * Confirmed live 2026-08-14, in the right-hand Studio panel:
   *   <div role="button" aria-label="Slide Deck">  text "tablet Slide Deck chevron_forward"
   *
   * Note it is a DIV, not a BUTTON — `button:has-text("Slide deck")` never
   * matched it. Sibling entries in the same panel are Audio Overview, Video
   * Overview, Mind Map, Reports, Flashcards, Quiz, Infographic, Data Table, so
   * the label must be exact or a neighbour gets clicked.
   */
  generateSlides: [
    '[aria-label="Slide Deck"]',
    '[aria-label="Bản trình bày"]',
    '[role="button"][aria-label*="Slide Deck" i]',
  ].join(', '),

  /**
   * Step 4b — a source has finished indexing.
   *
   * Confirmed live: right after upload the sources panel shows only
   * <button aria-label="test-source.md">. Once indexing completes a matching
   * <input type="checkbox" aria-label="test-source.md"> appears beside it, and
   * the notebook title flips from "Untitled notebook" to a generated one.
   *
   * The checkbox is the cleaner signal — [role="progressbar"] is far too
   * transient to catch reliably and also fires while the page is merely
   * loading.
   */
  sourceIndexed: [
    'input[type="checkbox"][aria-label]:not([aria-label*="Select all" i]):not([aria-label*="Chọn tất cả" i])',
  ].join(', '),

  /**
   * Step 5b — the "Customize Slide Deck" dialog.
   *
   * Clicking "Slide Deck" does NOT start generation; it opens a dialog with
   * format, language and length options plus a free-text brief. The worker
   * previously assumed one click was enough and would have waited forever for
   * a download that was never requested.
   */
  slideDeckBrief: [
    'textarea[aria-label="Describe the slide deck you want to create"]',
    'textarea[aria-label*="slide deck" i]',
  ].join(', '),

  /** Step 5c — the button that actually starts generation. */
  generateConfirm: [
    'button:has-text("Generate")',
    'button:has-text("Tạo")',
  ].join(', '),

  /** Step 5 — generation in progress. Same anchoring rules as `indexing`. */
  generating: [
    '[role="progressbar"]',
    'span:has-text("Generating")',
    'span:has-text("Đang tạo")',
    'div[role="status"]:has-text("Generating")',
    'div[role="status"]:has-text("Đang tạo")',
  ].join(', '),

  /** Step 6 — download the generated file. */
  download: [
    'button[title*="Download" i]',
    'button[title*="Tải xuống" i]',
    'button[aria-label*="Download" i]',
    'button[aria-label*="Tải xuống" i]',
    'button:has-text("Download")',
    'button:has-text("Tải xuống")',
  ].join(', '),
};
