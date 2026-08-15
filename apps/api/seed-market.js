/**
 * Seeds Categories (with GDELT-friendly keywords) and Styles so the discovery
 * engine has something to work with.
 *
 *   node seed-market.js
 *
 * Keyword choice matters. GDELT indexes world news, so seeds must be real news
 * subjects. Design vocabulary ("glassmorphism", "claymorphism", "neo-brutalist")
 * returns zero coverage and will be skipped by discovery. Design vocabulary
 * belongs in the Style table, which the discovery engine pairs with each
 * subject after scoring.
 *
 * Verify any new keyword before committing it:
 *   GET /api/v1/market/gdelt/probe?keyword=your+phrase
 */
const { PrismaClient } = require('@prisma/client');

const prisma = new PrismaClient();

const CATEGORIES = [
  {
    name: 'Sustainability',
    description: 'Green economy, circular production, climate technology.',
    keywords: [
      'sustainable packaging',
      'circular economy',
      'renewable energy',
      'carbon capture',
    ],
  },
  {
    name: 'Mobility',
    description: 'Transport, vehicles and urban movement.',
    keywords: ['electric vehicles', 'autonomous driving', 'urban mobility'],
  },
  {
    name: 'Technology',
    description: 'Computing, software and consumer hardware.',
    keywords: ['artificial intelligence', 'quantum computing', 'semiconductor industry'],
  },
  {
    name: 'Health & Wellness',
    description: 'Medicine, fitness and mental health.',
    keywords: ['mental health', 'digital health', 'preventive medicine'],
  },
  {
    name: 'Finance',
    description: 'Banking, payments and capital markets.',
    keywords: ['digital payments', 'central bank digital currency', 'green finance'],
  },
];

const STYLES = [
  { name: 'Minimalist', description: 'Restrained palette, generous whitespace, few elements.' },
  { name: 'Glassmorphism', description: 'Frosted translucent panels with soft blur and depth.' },
  { name: '3D Isometric', description: 'Isometric projection with volumetric shading.' },
  { name: 'Neo-Brutalist', description: 'Hard edges, raw contrast, unapologetic type.' },
  { name: 'Claymorphism', description: 'Soft inflated shapes with rounded, tactile surfaces.' },
  { name: 'Flat Vector', description: 'Clean two-dimensional shapes with no gradients.' },
];

async function main() {
  console.log('Seeding market categories and styles...\n');

  for (const category of CATEGORIES) {
    const record = await prisma.category.upsert({
      where: { name: category.name },
      create: category,
      update: {
        description: category.description,
        keywords: category.keywords,
      },
    });
    console.log(
      `  Category  ${record.name.padEnd(20)} ${category.keywords.length} keyword(s)`,
    );
  }

  console.log('');

  for (const style of STYLES) {
    const record = await prisma.style.upsert({
      where: { name: style.name },
      create: style,
      update: { description: style.description },
    });
    console.log(`  Style     ${record.name}`);
  }

  const keywordCount = CATEGORIES.reduce((sum, c) => sum + c.keywords.length, 0);
  const throttleMs = parseInt(process.env.GDELT_THROTTLE_MS || '2000', 10);
  const estimateSeconds = Math.ceil((keywordCount * 3 * throttleMs) / 1000);

  console.log(
    `\nDone. ${CATEGORIES.length} categories, ${STYLES.length} styles, ${keywordCount} seed keywords.`,
  );
  console.log(
    `A full discovery run issues ~${keywordCount * 3} GDELT requests ` +
      `(3 per keyword) and will take roughly ${estimateSeconds}s at the current throttle.`,
  );
  console.log('\nNext:  curl -X POST http://localhost:3001/api/v1/market/discover');
}

main()
  .catch((error) => {
    console.error('Seed failed:', error.message);
    process.exitCode = 1;
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
