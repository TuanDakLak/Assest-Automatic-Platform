import { Injectable, OnModuleInit, OnModuleDestroy, Logger } from '@nestjs/common';
import { Worker, Job } from 'bullmq';
import { chromium } from 'playwright';
import * as path from 'path';
import * as fs from 'fs';
import { PrismaService } from 'src/database/prisma.service';
import { SlidesService } from '../slides/slides.service';
import { AssetService } from '../asset/asset.service';
import { QualityService } from '../quality/quality.service';

// Plain CommonJS module shared with save-session.js so the browser fingerprint
// used to SAVE the Google session matches the one used to REPLAY it. Resolves
// to apps/api/browser-profile.js from both src/ and dist/.
const browserProfile = require('../../../browser-profile');

import {
  SELECTORS,
  buildAppUrl,
  APP_HOST_PATTERN,
  OVERLAY_BACKDROP,
  SLIDE_DECK_BRIEF,
} from './constants/selectors';

@Injectable()
export class NotebooklmProcessor implements OnModuleInit, OnModuleDestroy {
  private worker: Worker;
  private readonly logger = new Logger(NotebooklmProcessor.name);

  constructor(
    private readonly prisma: PrismaService,
    private readonly slidesService: SlidesService,
    private readonly assetService: AssetService,
    private readonly qualityService: QualityService,
  ) {}

  onModuleInit() {
    const redisHost = process.env.REDIS_HOST || 'localhost';
    const redisPort = parseInt(process.env.REDIS_PORT || '6379', 10);

    // Initialize BullMQ Worker
    this.worker = new Worker(
      'notebooklm-automation',
      async (job: Job) => {
        return this.processJob(job);
      },
      {
        connection: { host: redisHost, port: redisPort },
        concurrency: 2, // Support parallel worker execution
      }
    );

    this.worker.on('completed', (job) => {
      this.logger.log(`[Worker] Job ${job.id} completed successfully.`);
    });

    this.worker.on('failed', (job, err) => {
      this.logger.error(`[Worker] Job ${job?.id} failed with error: ${err.message}`, err.stack);
    });

    this.logger.log(`NotebookLM Automation Worker initialized with Redis connection: ${redisHost}:${redisPort}`);
  }

  async onModuleDestroy() {
    if (this.worker) {
      await this.worker.close();
    }
  }

  private async processJob(job: Job) {
    const { topic, markdownContent } = job.data;
    this.logger.log(`[Job ${job.id}] Starting NotebookLM automation process for: "${topic}"`);

    const headless = process.env.PLAYWRIGHT_HEADLESS !== 'false';
    const sessionPath = process.env.NOTEBOOKLM_SESSION_STATE_PATH || 'session.json';
    const downloadDir = path.join(process.cwd(), 'downloads');

    if (!fs.existsSync(downloadDir)) {
      fs.mkdirSync(downloadDir, { recursive: true });
    }

    const tempFilePath = path.join(downloadDir, `temp_research_${job.id}.md`);
    fs.writeFileSync(tempFilePath, markdownContent);
    this.logger.log(`[Job ${job.id}] Saved temporary source file to: ${tempFilePath}`);

    const maxRetries = 3;
    let attempt = 0;
    let success = false;
    let downloadedFilePath = '';

    while (attempt < maxRetries && !success) {
      attempt++;
      this.logger.log(`[Job ${job.id}] Starting browser automation attempt ${attempt}/${maxRetries}`);

      // Real Chrome first, bundled Chromium only as a last resort. Google
      // rejects the bundled build far more often.
      const { browser, channel } = await browserProfile.launchBrowser(
        chromium,
        headless,
        (msg: string) => this.logger.log(`[Job ${job.id}] ${msg}`),
      );

      if (channel === 'chromium') {
        this.logger.warn(
          `[Job ${job.id}] Running on bundled Chromium. Google frequently refuses ` +
            'sessions from this build — install Chrome or Edge on the host.',
        );
      }

      try {
        const storage: Record<string, unknown> = {};
        if (fs.existsSync(sessionPath)) {
          this.logger.log(`[Job ${job.id}] StorageState session file found. Loading cookies and storage...`);
          storage.storageState = sessionPath;
        } else {
          this.logger.warn(`[Job ${job.id}] Warning: No session storageState state file found at: ${sessionPath}. Google account may block this request.`);
        }

        // Fingerprint (userAgent, locale, timezone, webdriver patch) comes from
        // browser-profile.js — the same module save-session.js uses.
        const context = await browserProfile.createContext(browser, {
          ...storage,
          acceptDownloads: true,
        });

        const page = await context.newPage();
        page.setDefaultTimeout(35000); // 35 seconds timeout limit

        // Step 1: Open the app.
        //
        // Must be the .com host. "notebooklm.google" (no .com) is the public
        // marketing site and since the July 2026 rename it redirects to
        // notebook.google — a landing page with pricing and an FAQ, no app UI.
        // Pointing the worker there was why every selector timed out.
        const appUrl = buildAppUrl();
        this.logger.log(`[Job ${job.id}] Step 1: Navigating to ${appUrl}`);
        await page.goto(appUrl, { waitUntil: 'domcontentloaded' });

        // A redirect away from the app host means the session was rejected.
        await page.waitForTimeout(3000);
        const landedOn = page.url();
        if (!APP_HOST_PATTERN.test(landedOn)) {
          throw new Error(
            `Expected the Gemini Notebook app but landed on ${landedOn}. ` +
              'Either session.json was rejected (re-run `pnpm save-session`) or ' +
              'the app URL moved again — set NOTEBOOKLM_URL to override.',
          );
        }

        // Step 2: Create Notebook
        this.logger.log(`[Job ${job.id}] Step 2: Creating a new notebook`);
        const newNotebookBtn = page.locator(SELECTORS.newNotebook);
        await newNotebookBtn.waitFor({ state: 'visible', timeout: 15000 });
        await newNotebookBtn.click();

        // Step 3: Upload the source file.
        //
        // Three sub-steps, not one. Creating a notebook opens a source dialog
        // offering "Upload files / Websites / Drive / Copied text", and the
        // <input type=file> is only mounted after picking "Upload files".
        // Waiting for the input straight away — as this used to — waits for an
        // element that never appears.
        this.logger.log(`[Job ${job.id}] Step 3: Waiting for the source dialog`);

        // The dialog opens by itself after a notebook is created, but renders
        // a second or two later. Wait for it before deciding anything: acting
        // too early means clicking "Add source", which sits BEHIND the dialog's
        // backdrop and produces a 35s "intercepts pointer events" timeout.
        const uploadTab = page.locator(SELECTORS.uploadFilesTab).first();
        let dialogOpen = true;
        try {
          await uploadTab.waitFor({ state: 'visible', timeout: 20000 });
        } catch {
          dialogOpen = false;
        }

        if (!dialogOpen) {
          this.logger.log(`[Job ${job.id}] Step 3: Dialog absent, opening it manually`);

          // A leftover backdrop would block the click. Clear it first.
          const backdrop = page.locator(OVERLAY_BACKDROP);
          if ((await backdrop.count()) > 0) {
            this.logger.warn(`[Job ${job.id}] An overlay is blocking the page. Sending Escape.`);
            await page.keyboard.press('Escape');
            await backdrop.waitFor({ state: 'detached', timeout: 10000 }).catch(() => undefined);
          }

          const addSources = page.locator(SELECTORS.addSources).first();
          await addSources.waitFor({ state: 'visible', timeout: 15000 });
          await addSources.click();
          await uploadTab.waitFor({ state: 'visible', timeout: 15000 });
        }

        this.logger.log(`[Job ${job.id}] Step 3: Selecting the "Upload files" option`);
        await uploadTab.waitFor({ state: 'visible', timeout: 15000 });

        // Clicking "Upload files" pops the operating system's file picker.
        // A native dialog is outside the page, so nothing in Playwright can
        // dismiss it — the browser just sits there until the job times out.
        //
        // waitForEvent('filechooser') intercepts it before it is drawn, so the
        // dialog never appears and the file is attached programmatically. This
        // also removes the dependency on the hidden <input type=file>, which
        // only gets mounted after the click.
        const [fileChooser] = await Promise.all([
          page.waitForEvent('filechooser', { timeout: 20000 }),
          uploadTab.click(),
        ]);

        this.logger.log(`[Job ${job.id}] Step 3: Attaching ${path.basename(tempFilePath)}`);
        await fileChooser.setFiles(tempFilePath);
        this.logger.log(`[Job ${job.id}] Source file uploaded to Gemini Notebook.`);

        // Step 4: Wait for the source to finish indexing.
        //
        // Waiting for a spinner to vanish is unreliable here — the progress bar
        // is transient and also appears during ordinary page loads, so it can
        // be missed entirely or seen when nothing is indexing. Waiting for the
        // per-source checkbox to appear is a positive signal instead.
        this.logger.log(`[Job ${job.id}] Step 4: Waiting for the source to be indexed...`);
        await page
          .locator(SELECTORS.sourceIndexed)
          .first()
          .waitFor({ state: 'visible', timeout: 120000 });
        this.logger.log(`[Job ${job.id}] Source indexed.`);

        // Step 5a: Open the Slide Deck panel.
        this.logger.log(`[Job ${job.id}] Step 5: Opening the Slide Deck options`);
        const slideDeckBtn = page.locator(SELECTORS.generateSlides).first();
        await slideDeckBtn.waitFor({ state: 'visible', timeout: 15000 });
        await slideDeckBtn.click();

        // Step 5b: Fill in the brief.
        //
        // This click opens a "Customize Slide Deck" dialog rather than starting
        // generation. The dialog carries the free-text brief that steers the
        // deck toward isolated 3D graphics, which is the whole point of the
        // pipeline — without it the deck comes back text-heavy and there is
        // nothing worth extracting.
        const brief = page.locator(SELECTORS.slideDeckBrief).first();
        await brief.waitFor({ state: 'visible', timeout: 20000 });
        await brief.fill(SLIDE_DECK_BRIEF);
        this.logger.log(`[Job ${job.id}] Step 5: Brief entered`);

        // Step 5c: Start generation.
        const confirmBtn = page.locator(SELECTORS.generateConfirm).first();
        await confirmBtn.waitFor({ state: 'visible', timeout: 15000 });
        await confirmBtn.click();
        this.logger.log(`[Job ${job.id}] Step 5: Generation requested`);

        // Wait for the deck to finish. The dialog closes on submit, so the
        // download control appearing is the completion signal.
        this.logger.log(`[Job ${job.id}] Waiting for slide generation...`);
        await page
          .locator(SELECTORS.download)
          .first()
          .waitFor({ state: 'visible', timeout: 300000 });
        this.logger.log(`[Job ${job.id}] Slide generation successful.`);

        // Step 6: Download slide deck presentation
        this.logger.log(`[Job ${job.id}] Step 6: Initiating file download`);
        const downloadPromise = page.waitForEvent('download', { timeout: 30000 });
        
        const downloadBtn = page.locator(SELECTORS.download);
        await downloadBtn.first().click();

        const download = await downloadPromise;
        const filename = `${topic.toLowerCase().replace(/[^a-z0-9]+/g, '_')}_presentation_${job.id}.pptx`;
        downloadedFilePath = path.join(downloadDir, filename);
        await download.saveAs(downloadedFilePath);

        this.logger.log(`[Job ${job.id}] File downloaded and saved to: ${downloadedFilePath}`);
        success = true;

        // --- CONNECT DOWNSTREAM PIPELINE ---
        this.logger.log(`[Job ${job.id}] Triggering downstream E2E processing: Parse -> Category Copy -> Extract -> Remove Background -> Quality Check`);
        
        // 1. Resolve category folder name to copy slides into appropriate section
        let categoryName = 'general';
        const dbTopic = await this.prisma.marketTopic.findFirst({
          where: { title: topic },
          include: { category: true }
        });
        if (dbTopic?.category) {
          categoryName = dbTopic.category.name.toLowerCase().replace(/[^a-z0-9]+/g, '_');
        }

        const categoryDir = path.join(process.cwd(), 'downloads', 'categories', categoryName, topic.toLowerCase().replace(/[^a-z0-9]+/g, '_'));
        if (!fs.existsSync(categoryDir)) {
          fs.mkdirSync(categoryDir, { recursive: true });
        }

        // Save a permanent copy of the research report in the category directory
        const permanentReportPath = path.join(categoryDir, 'research_report.md');
        try {
          fs.copyFileSync(tempFilePath, permanentReportPath);
          this.logger.log(`[Job ${job.id}] Saved permanent copy of research report to: ${permanentReportPath}`);
        } catch (copyErr: any) {
          this.logger.warn(`[Job ${job.id}] Failed to save permanent copy of research report: ${copyErr.message}`);
        }

        // 2. Parse slide PPTX to PNG images inside the category-specific directory
        const parseResult = await this.slidesService.parseSlides({
          filePath: downloadedFilePath,
          outputDir: categoryDir,
          scale: 2.0,
          transparent: false
        });

        if (parseResult.success && parseResult.savedPaths) {
          this.logger.log(`[Job ${job.id}] Successfully parsed ${parseResult.slideCount} slides into category folder: ${categoryDir}`);
          
          for (const slidePath of parseResult.savedPaths) {
            this.logger.log(`[Job ${job.id}] Extracting assets from slide: ${slidePath}`);
            
            // 3. Extract asset from slide PNG with user prompt template
            const extractResult = await this.assetService.extractAsset(slidePath, {
              promptTemplate: `Isolate the design assets from this slide. The design style is 3D graphic design style with a clean, light background. Keep only the central asset graphic.`,
            });

            if (extractResult.success && extractResult.assetId) {
              const assetId = extractResult.assetId;
              const assetRecord = extractResult.asset;
              
              if (assetRecord.url) {
                // 4. Remove light background (transparent overlay)
                const transparentPath = await this.assetService.removeBackground(assetRecord.url);
                
                // Update Asset URL to the new background-removed file
                await this.prisma.asset.update({
                  where: { id: assetId },
                  data: { url: transparentPath }
                });

                // 5. Execute Quality Checker on the final background-removed asset
                this.logger.log(`[Job ${job.id}] Executing Quality check on asset: ${assetId}`);
                await this.qualityService.checkQuality(assetId);
              }
            }
          }
        }
      } catch (err: any) {
        this.logger.warn(`[Job ${job.id}] Attempt ${attempt} failed with: ${err.message}`);
        if (attempt >= maxRetries) {
          throw err;
        }
        // Backoff delay
        await new Promise((resolve) => setTimeout(resolve, attempt * 3000));
      } finally {
        await browser.close();
      }
    }

    // Cleanup temp markdown file
    try {
      if (fs.existsSync(tempFilePath)) {
        fs.unlinkSync(tempFilePath);
      }
    } catch (cleanupErr) {
      this.logger.warn(`[Job ${job.id}] Failed to delete temp file: ${tempFilePath}`);
    }

    return {
      success: true,
      downloadedFilePath,
      topic,
    };
  }
}
