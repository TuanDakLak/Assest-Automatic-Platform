const fs = require('fs');
const path = require('path');

const rootDir = process.cwd();

// Helper to write files recursively
function ensureDirectoryExistence(filePath) {
  const dirname = path.dirname(filePath);
  if (fs.existsSync(dirname)) {
    return true;
  }
  ensureDirectoryExistence(dirname);
  fs.mkdirSync(dirname);
}

function writeFile(relativeRoute, content) {
  const absolutePath = path.join(rootDir, relativeRoute);
  ensureDirectoryExistence(absolutePath);
  fs.writeFileSync(absolutePath, content.trim() + '\n', 'utf8');
  console.log(`Created: ${relativeRoute}`);
}

const modules = [
  'auth',
  'dashboard',
  'market',
  'research',
  'notebooklm',
  'slides',
  'asset',
  'prompt',
  'automation',
  'quality',
  'storage',
  'jobs',
  'settings'
];

// 1. Root Level Configurations
writeFile('package.json', `{
  "name": "ai-asset-factory",
  "version": "1.0.0",
  "private": true,
  "scripts": {
    "dev:api": "pnpm --filter api run start:dev",
    "dev:web": "pnpm --filter web run dev",
    "build:api": "pnpm --filter api run build",
    "build:web": "pnpm --filter web run build",
    "db:migrate": "pnpm --filter api run db:migrate",
    "db:generate": "pnpm --filter api run db:generate",
    "test:api": "pnpm --filter api run test",
    "test:web": "pnpm --filter web run test"
  },
  "devDependencies": {
    "typescript": "^5.7.0"
  }
}`);

writeFile('pnpm-workspace.yaml', `
packages:
  - 'apps/*'
  - 'packages/*'
`);

writeFile('docker-compose.yml', `
version: '3.8'

services:
  postgres:
    image: postgres:16-alpine
    container_name: asset-factory-db
    environment:
      POSTGRES_USER: postgres
      POSTGRES_PASSWORD: postgrespassword
      POSTGRES_DB: asset_factory
    ports:
      - "5432:5432"
    volumes:
      - postgres_data:/var/lib/postgresql/data
    networks:
      - asset-network

  redis:
    image: redis:7-alpine
    container_name: asset-factory-redis
    ports:
      - "6379:6379"
    volumes:
      - redis_data:/data
    networks:
      - asset-network

volumes:
  postgres_data:
  redis_data:

networks:
  asset-network:
    driver: bridge
`);

writeFile('tsconfig.json', `{
  "compilerOptions": {
    "target": "ES2022",
    "module": "NodeNext",
    "moduleResolution": "NodeNext",
    "esModuleInterop": true,
    "forceConsistentCasingInFileNames": true,
    "strict": true,
    "skipLibCheck": true
  }
}`);

// 2. Apps Backend (NestJS Setup)
writeFile('apps/api/package.json', `{
  "name": "api",
  "version": "1.0.0",
  "private": true,
  "scripts": {
    "build": "nest build",
    "start": "nest start",
    "start:dev": "nest start --watch",
    "db:migrate": "prisma migrate dev",
    "db:generate": "prisma generate",
    "test": "jest"
  },
  "dependencies": {
    "@nestjs/common": "^11.0.0",
    "@nestjs/core": "^11.0.0",
    "@nestjs/platform-express": "^11.0.0",
    "@nestjs/swagger": "^11.0.0",
    "@prisma/client": "^6.0.0",
    "bullmq": "^5.30.0",
    "class-transformer": "^0.5.1",
    "class-validator": "^0.14.1",
    "dotenv": "^16.4.5",
    "ioredis": "^5.4.1",
    "reflect-metadata": "^0.2.2",
    "rxjs": "^7.8.1"
  },
  "devDependencies": {
    "@nestjs/cli": "^11.0.0",
    "@nestjs/schematics": "^11.0.0",
    "@nestjs/testing": "^11.0.0",
    "@types/express": "^5.0.0",
    "@types/jest": "^29.5.14",
    "@types/node": "^22.10.0",
    "jest": "^29.7.0",
    "prisma": "^6.0.0",
    "ts-jest": "^29.2.5",
    "ts-node": "^10.9.2",
    "typescript": "^5.7.0"
  },
  "jest": {
    "moduleFileExtensions": ["js", "json", "ts"],
    "rootDir": "src",
    "testRegex": ".*\\\\.spec\\\\.ts$",
    "transform": {
      "^.+\\\\.(t|j)s$": "ts-jest"
    },
    "collectCoverageFrom": ["**/*.(t|j)s"],
    "coverageDirectory": "../coverage",
    "testEnvironment": "node",
    "moduleNameMapper": {
      "^src/(.*)$": "<rootDir>/$1"
    }
  }
}`);

writeFile('apps/api/tsconfig.json', `{
  "compilerOptions": {
    "module": "commonjs",
    "declaration": true,
    "removeComments": true,
    "emitDecoratorMetadata": true,
    "experimentalDecorators": true,
    "allowSyntheticDefaultImports": true,
    "target": "es2021",
    "sourceMap": true,
    "outDir": "./dist",
    "baseUrl": "./",
    "incremental": true,
    "skipLibCheck": true,
    "strictNullChecks": false,
    "noImplicitAny": false,
    "strictBindCallApply": false,
    "forceConsistentCasingInFileNames": false,
    "noFallthroughCasesInSwitch": false
  }
}`);

writeFile('apps/api/tsconfig.build.json', `{
  "extends": "./tsconfig",
  "exclude": ["node_modules", "test", "dist", "**/*spec.ts"]
}`);

writeFile('apps/api/nest-cli.json', `{
  "$schema": "https://json.schemastore.org/nest-cli",
  "collection": "@nestjs/schematics",
  "sourceRoot": "src",
  "compilerOptions": {
    "deleteOutDir": true
  }
}`);

writeFile('apps/api/prisma/schema.prisma', `
datasource db {
  provider = "postgresql"
  url      = env("DATABASE_URL")
}

generator client {
  provider = "prisma-client-js"
}

// User model supporting the auth and user systems
model User {
  id        String   @id @default(uuid())
  email     String   @unique
  password  String
  name      String?
  role      String   @default("user")
  assets    Asset[]
  jobs      Job[]
  createdAt DateTime @default(now())
  updatedAt DateTime @updatedAt
}

// Asset model representing physical/digital generated items
model Asset {
  id          String   @id @default(uuid())
  title       String
  description String?
  url         String?
  type        String   // IMAGE, VIDEO, SLIDES, DOC, etc.
  status      String   @default("PENDING")
  userId      String
  user        User     @relation(fields: [userId], references: [id], onDelete: Cascade)
  createdAt   DateTime @default(now())
  updatedAt   DateTime @updatedAt
}

// Job model for queuing status tracking
model Job {
  id        String   @id @default(uuid())
  type      String
  status    String   @default("QUEUED")
  payload   Json?
  result    Json?
  userId    String
  user      User     @relation(fields: [userId], references: [id], onDelete: Cascade)
  createdAt DateTime @default(now())
  updatedAt DateTime @updatedAt
}
`);

writeFile('apps/api/.env.example', `
PORT=3001
DATABASE_URL="postgresql://postgres:postgrespassword@localhost:5432/asset_factory?schema=public"
REDIS_HOST="localhost"
REDIS_PORT=6379
JWT_SECRET="super-secret-jwt-key-replace-in-production"
`);

writeFile('apps/api/src/database/prisma.service.ts', `
import { Injectable, OnModuleInit, OnModuleDestroy } from '@nestjs/common';
import { PrismaClient } from '@prisma/client';

@Injectable()
export class PrismaService extends PrismaClient implements OnModuleInit, OnModuleDestroy {
  async onModuleInit() {
    await this.$connect();
  }

  async onModuleDestroy() {
    await this.$disconnect();
  }
}
`);

// Setup NestJS Modules
modules.forEach((mod) => {
  const capName = mod.charAt(0).toUpperCase() + mod.slice(1);
  
  // controller
  writeFile(`apps/api/src/modules/${mod}/${mod}.controller.ts`, `
import { Controller, Get, Post, Body, Param, Put, Delete, UseGuards } from '@nestjs/common';
import { ${capName}Service } from './${mod}.service';
import { Create${capName}Dto } from './dto/create-${mod}.dto';
import { Update${capName}Dto } from './dto/update-${mod}.dto';

@Controller('${mod}')
export class ${capName}Controller {
  constructor(private readonly ${mod}Service: ${capName}Service) {}

  @Post()
  async create(@Body() createDto: Create${capName}Dto) {
    return this.${mod}Service.create(createDto);
  }

  @Get()
  async findAll() {
    return this.${mod}Service.findAll();
  }

  @Get(':id')
  async findOne(@Param('id') id: string) {
    return this.${mod}Service.findOne(id);
  }

  @Put(':id')
  async update(@Param('id') id: string, @Body() updateDto: Update${capName}Dto) {
    return this.${mod}Service.update(id, updateDto);
  }

  @Delete(':id')
  async remove(@Param('id') id: string) {
    return this.${mod}Service.remove(id);
  }
}
`);

  // service
  writeFile(`apps/api/src/modules/${mod}/${mod}.service.ts`, `
import { Injectable } from '@nestjs/common';
import { ${capName}Repository } from './${mod}.repository';
import { Create${capName}Dto } from './dto/create-${mod}.dto';
import { Update${capName}Dto } from './dto/update-${mod}.dto';

@Injectable()
export class ${capName}Service {
  constructor(private readonly repository: ${capName}Repository) {}

  async create(createDto: Create${capName}Dto) {
    return this.repository.create(createDto);
  }

  async findAll() {
    return this.repository.findAll();
  }

  async findOne(id: string) {
    return this.repository.findOne(id);
  }

  async update(id: string, updateDto: Update${capName}Dto) {
    return this.repository.update(id, updateDto);
  }

  async remove(id: string) {
    return this.repository.remove(id);
  }
}
`);

  // repository
  writeFile(`apps/api/src/modules/${mod}/${mod}.repository.ts`, `
import { Injectable } from '@nestjs/common';
import { PrismaService } from 'src/database/prisma.service';
import { Create${capName}Dto } from './dto/create-${mod}.dto';
import { Update${capName}Dto } from './dto/update-${mod}.dto';

@Injectable()
export class ${capName}Repository {
  constructor(private readonly prisma: PrismaService) {}

  async create(dto: Create${capName}Dto) {
    // Boilerplate repository return - DB connection logic fits here
    return { id: 'mock-id', ...dto, createdAt: new Date() };
  }

  async findAll() {
    return [];
  }

  async findOne(id: string) {
    return { id, title: 'mock-title' };
  }

  async update(id: string, dto: Update${capName}Dto) {
    return { id, ...dto, updatedAt: new Date() };
  }

  async remove(id: string) {
    return { id, deleted: true };
  }
}
`);

  // dto/create
  writeFile(`apps/api/src/modules/${mod}/dto/create-${mod}.dto.ts`, `
import { IsString, IsNotEmpty, IsOptional } from 'class-validator';

export class Create${capName}Dto {
  @IsString()
  @IsNotEmpty()
  title: string;

  @IsString()
  @IsOptional()
  description?: string;
}
`);

  // dto/update
  writeFile(`apps/api/src/modules/${mod}/dto/update-${mod}.dto.ts`, `
import { IsString, IsOptional } from 'class-validator';

export class Update${capName}Dto {
  @IsString()
  @IsOptional()
  title?: string;

  @IsString()
  @IsOptional()
  description?: string;
}
`);

  // entities
  writeFile(`apps/api/src/modules/${mod}/entities/${mod}.entity.ts`, `
export class ${capName}Entity {
  id: string;
  title: string;
  description?: string;
  createdAt: Date;
  updatedAt: Date;
}
`);

  // types
  writeFile(`apps/api/src/modules/${mod}/types/index.ts`, `
export type ${capName}Status = 'PENDING' | 'RUNNING' | 'COMPLETED' | 'FAILED';

export interface ${capName}Metadata {
  creatorId: string;
  version: string;
}
`);

  // constants
  writeFile(`apps/api/src/modules/${mod}/constants/index.ts`, `
export const ${mod.toUpperCase()}_MODULE_NAME = '${mod}';
export const DEFAULT_PAGE_SIZE = 10;
`);

  // validators
  writeFile(`apps/api/src/modules/${mod}/validators/index.ts`, `
// Custom validators for the ${mod} module
export function isValid${capName}Name(name: string): boolean {
  return name.length >= 3 && name.length <= 50;
}
`);

  // interfaces
  writeFile(`apps/api/src/modules/${mod}/interfaces/index.ts`, `
export interface I${capName}Service {
  create(dto: any): Promise<any>;
  findAll(): Promise<any[]>;
  findOne(id: string): Promise<any>;
  update(id: string, dto: any): Promise<any>;
  remove(id: string): Promise<any>;
}
`);

  // helpers
  writeFile(`apps/api/src/modules/${mod}/helpers/index.ts`, `
// Helper tools for the ${mod} module
export function format${capName}Response<T>(data: T) {
  return {
    success: true,
    data,
    timestamp: new Date().toISOString(),
  };
}
`);

  // module definition
  writeFile(`apps/api/src/modules/${mod}/${mod}.module.ts`, `
import { Module } from '@nestjs/common';
import { ${capName}Controller } from './${mod}.controller';
import { ${capName}Service } from './${mod}.service';
import { ${capName}Repository } from './${mod}.repository';
import { PrismaService } from 'src/database/prisma.service';

@Module({
  controllers: [${capName}Controller],
  providers: [${capName}Service, ${capName}Repository, PrismaService],
  exports: [${capName}Service],
})
export class ${capName}Module {}
`);

  // tests
  writeFile(`apps/api/src/modules/${mod}/tests/${mod}.controller.spec.ts`, `
import { Test, TestingModule } from '@nestjs/testing';
import { ${capName}Controller } from '../${mod}.controller';
import { ${capName}Service } from '../${mod}.service';

describe('${capName}Controller', () => {
  let controller: ${capName}Controller;
  let service: ${capName}Service;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      controllers: [${capName}Controller],
      providers: [
        {
          provide: ${capName}Service,
          useValue: {
            findAll: jest.fn().mockResolvedValue([]),
            findOne: jest.fn().mockResolvedValue({ id: '1' }),
            create: jest.fn().mockResolvedValue({ id: '1' }),
            update: jest.fn().mockResolvedValue({ id: '1' }),
            remove: jest.fn().mockResolvedValue({ id: '1' }),
          },
        },
      ],
    }).compile();

    controller = module.get<${capName}Controller>(${capName}Controller);
    service = module.get<${capName}Service>(${capName}Service);
  });

  it('should be defined', () => {
    expect(controller).toBeDefined();
  });
});
`);

  writeFile(`apps/api/src/modules/${mod}/tests/${mod}.service.spec.ts`, `
import { Test, TestingModule } from '@nestjs/testing';
import { ${capName}Service } from '../${mod}.service';
import { ${capName}Repository } from '../${mod}.repository';

describe('${capName}Service', () => {
  let service: ${capName}Service;
  let repository: ${capName}Repository;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        ${capName}Service,
        {
          provide: ${capName}Repository,
          useValue: {
            findAll: jest.fn().mockResolvedValue([]),
            findOne: jest.fn().mockResolvedValue({ id: '1' }),
            create: jest.fn().mockResolvedValue({ id: '1' }),
            update: jest.fn().mockResolvedValue({ id: '1' }),
            remove: jest.fn().mockResolvedValue({ id: '1' }),
          },
        },
      ],
    }).compile();

    service = module.get<${capName}Service>(${capName}Service);
    repository = module.get<${capName}Repository>(${capName}Repository);
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });
});
`);
});

// App level module imports
const importsList = modules.map((mod) => {
  const cap = mod.charAt(0).toUpperCase() + mod.slice(1);
  return `import { ${cap}Module } from './modules/${mod}/${mod}.module';`;
}).join('\n');

const modulesInImports = modules.map((mod) => {
  const cap = mod.charAt(0).toUpperCase() + mod.slice(1);
  return `    ${cap}Module,`;
}).join('\n');

writeFile('apps/api/src/app.module.ts', `
import { Module } from '@nestjs/common';
${importsList}
import { PrismaService } from './database/prisma.service';

@Module({
  imports: [
${modulesInImports}
  ],
  providers: [PrismaService],
})
export class AppModule {}
`);

writeFile('apps/api/src/main.ts', `
import { NestFactory } from '@nestjs/core';
import { AppModule } from './app.module';
import { ValidationPipe } from '@nestjs/common';

async function bootstrap() {
  const app = await NestFactory.create(AppModule);
  app.setGlobalPrefix('api/v1');
  app.useGlobalPipes(new ValidationPipe({ transform: true, whitelist: true }));
  app.enableCors();
  
  const port = process.env.PORT || 3001;
  await app.listen(port);
  console.log(\`Backend running on: http://localhost:\${port}/api/v1\`);
}
bootstrap();
`);


// 3. Apps Frontend (Next.js 15 Setup)
writeFile('apps/web/package.json', `{
  "name": "web",
  "version": "1.0.0",
  "private": true,
  "scripts": {
    "dev": "next dev",
    "build": "next build",
    "start": "next start",
    "lint": "next lint",
    "test": "playwright test"
  },
  "dependencies": {
    "next": "^15.1.0",
    "react": "^19.0.0",
    "react-dom": "^19.0.0",
    "clsx": "^2.1.1",
    "tailwind-merge": "^2.5.5",
    "lucide-react": "^0.468.0",
    "@radix-ui/react-slot": "^1.1.0",
    "class-variance-authority": "^0.7.1"
  },
  "devDependencies": {
    "@types/node": "^22.10.0",
    "@types/react": "^19.0.0",
    "@types/react-dom": "^19.0.0",
    "postcss": "^8.4.49",
    "tailwindcss": "^3.4.16",
    "typescript": "^5.7.0",
    "@playwright/test": "^1.49.0"
  }
}`);

writeFile('apps/web/tsconfig.json', `{
  "compilerOptions": {
    "target": "es5",
    "lib": ["dom", "dom.iterable", "esnext"],
    "allowJs": true,
    "skipLibCheck": true,
    "strict": true,
    "noEmit": true,
    "esModuleInterop": true,
    "module": "esnext",
    "moduleResolution": "bundler",
    "resolveJsonModule": true,
    "isolatedModules": true,
    "jsx": "preserve",
    "incremental": true,
    "plugins": [
      {
        "name": "next"
      }
    ],
    "paths": {
      "@/*": ["./src/*"]
    }
  },
  "include": ["next-env.d.ts", "**/*.ts", "**/*.tsx", ".next/types/**/*.ts"],
  "exclude": ["node_modules"]
}`);

writeFile('apps/web/next.config.ts', `
import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  reactStrictMode: true,
  /* config options here */
};

export default nextConfig;
`);

writeFile('apps/web/postcss.config.js', `
module.exports = {
  plugins: {
    tailwindcss: {},
    autoprefixer: {},
  },
}
`);

writeFile('apps/web/tailwind.config.ts', `
import type { Config } from "tailwindcss";

const config: Config = {
  darkMode: "class",
  content: [
    "./src/pages/**/*.{js,ts,jsx,tsx,mdx}",
    "./src/components/**/*.{js,ts,jsx,tsx,mdx}",
    "./src/app/**/*.{js,ts,jsx,tsx,mdx}",
    "./src/features/**/*.{js,ts,jsx,tsx,mdx}",
  ],
  theme: {
    extend: {
      colors: {
        background: "var(--background)",
        foreground: "var(--foreground)",
        border: "var(--border)",
        accent: {
          DEFAULT: "var(--accent)",
          cyan: "var(--accent-cyan)",
          violet: "var(--accent-violet)",
        },
        cardBg: "var(--card-bg)",
      },
      fontFamily: {
        sans: ["var(--font-sans)", "Inter", "sans-serif"],
      },
    },
  },
  plugins: [],
};
export default config;
`);

// Playwright E2E configuration
writeFile('apps/web/playwright.config.ts', `
import { defineConfig, devices } from '@playwright/test';

export default defineConfig({
  testDir: './playwright',
  fullyParallel: true,
  forbidOnly: !!process.env.CI,
  retries: process.env.CI ? 2 : 0,
  workers: process.env.CI ? 1 : undefined,
  reporter: 'html',
  use: {
    baseURL: 'http://localhost:3000',
    trace: 'on-first-retry',
  },
  projects: [
    {
      name: 'chromium',
      use: { ...devices['Desktop Chrome'] },
    },
  ],
});
`);

writeFile('apps/web/playwright/e2e/auth.spec.ts', `
import { test, expect } from '@playwright/test';

test('has title and landing page content', async ({ page }) => {
  await page.goto('/');
  await expect(page).toHaveTitle(/AI Asset Factory/);
  await expect(page.locator('h1')).toContainText('AI Asset Factory');
});
`);

// Styling & Globals
writeFile('apps/web/src/app/globals.css', `
@import url('https://fonts.googleapis.com/css2?family=Outfit:wght@300;400;500;600;700;800&display=swap');

:root {
  --background: #030712;
  --foreground: #f9fafb;
  --border: #1f2937;
  --accent: #4f46e5;
  --accent-cyan: #06b6d4;
  --accent-violet: #8b5cf6;
  --card-bg: rgba(17, 24, 39, 0.7);
  --font-sans: 'Outfit', sans-serif;
}

body {
  background-color: var(--background);
  color: var(--foreground);
  font-family: var(--font-sans);
  overflow-x: hidden;
}

/* Custom premium styles */
.glassmorphism {
  background: var(--card-bg);
  backdrop-filter: blur(12px);
  -webkit-backdrop-filter: blur(12px);
  border: 1px solid rgba(255, 255, 255, 0.05);
}

.gradient-text {
  background: linear-gradient(135deg, #a78bfa 0%, #06b6d4 50%, #4f46e5 100%);
  -webkit-background-clip: text;
  -webkit-text-fill-color: transparent;
}

.glow-button {
  position: relative;
  transition: all 0.3s ease;
}

.glow-button::after {
  content: '';
  position: absolute;
  inset: -2px;
  background: linear-gradient(135deg, #06b6d4, #4f46e5);
  border-radius: inherit;
  z-index: -1;
  opacity: 0;
  transition: opacity 0.3s ease;
  filter: blur(8px);
}

.glow-button:hover::after {
  opacity: 0.75;
}

.custom-grid {
  display: grid;
  grid-template-columns: repeat(auto-fill, minmax(300px, 1fr));
  gap: 1.5rem;
}
`);

writeFile('apps/web/src/app/layout.tsx', `
import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "AI Asset Factory - Premium Commercial Design Assets Automatically",
  description: "Generate highly customizable, commercial-grade digital design assets using scalable enterprise AI models.",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en">
      <body className="antialiased min-h-screen">
        {children}
      </body>
    </html>
  );
}
`);

// NextJS Components Library Setup
writeFile('apps/web/src/components/ui/button.tsx', `
import * as React from "react"
import { Slot } from "@radix-ui/react-slot"
import { cva, type VariantProps } from "class-variance-authority"
import { cn } from "@/utils"

const buttonVariants = cva(
  "inline-flex items-center justify-center whitespace-nowrap rounded-md text-sm font-medium transition-colors focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring disabled:pointer-events-none disabled:opacity-50",
  {
    variants: {
      variant: {
        default: "bg-accent text-foreground shadow hover:bg-accent/90",
        destructive: "bg-destructive text-destructive-foreground shadow-sm hover:bg-destructive/90",
        outline: "border border-border bg-background shadow-sm hover:bg-accent hover:text-accent-foreground",
        secondary: "bg-secondary text-secondary-foreground shadow-sm hover:bg-secondary/80",
        ghost: "hover:bg-accent hover:text-accent-foreground",
        link: "text-primary underline-offset-4 hover:underline",
        premium: "bg-gradient-to-r from-accent-violet to-accent-cyan text-white glow-button font-semibold"
      },
      size: {
        default: "h-9 px-4 py-2",
        sm: "h-8 rounded-md px-3 text-xs",
        lg: "h-10 rounded-md px-8",
        icon: "h-9 w-9",
      },
    },
    defaultVariants: {
      variant: "default",
      size: "default",
    },
  }
)

export interface ButtonProps
  extends React.ButtonHTMLAttributes<HTMLButtonElement>,
    VariantProps<typeof buttonVariants> {
  asChild?: boolean
}

const Button = React.forwardRef<HTMLButtonElement, ButtonProps>(
  ({ className, variant, size, asChild = false, ...props }, ref) => {
    const Comp = asChild ? Slot : "button"
    return (
      <Comp
        className={cn(buttonVariants({ variant, size, className }))}
        ref={ref}
        {...props}
      />
    )
  }
)
Button.displayName = "Button"

export { Button, buttonVariants }
`);

writeFile('apps/web/src/utils/index.ts', `
import { clsx, type ClassValue } from "clsx";
import { tailwindMerge } from "tailwind-merge";

export function cn(...inputs: ClassValue[]) {
  return tailwindMerge(clsx(inputs));
}

export function formatDate(date: Date): string {
  return new Intl.DateTimeFormat('en-US', {
    month: 'short',
    day: 'numeric',
    year: 'numeric'
  }).format(date);
}
`);

// Setup Frontend Features
modules.forEach((mod) => {
  const capName = mod.charAt(0).toUpperCase() + mod.slice(1);
  
  // barrel file index.ts
  writeFile(`apps/web/src/features/${mod}/index.ts`, `
export * from './components';
export * from './hooks/use-${mod}';
export * from './services/${mod}.service';
export * from './types';
export * from './constants';
export * from './utils';
`);

  // components
  writeFile(`apps/web/src/features/${mod}/components/index.ts`, `
// Export feature-specific UI elements here
export { default as ${capName}Panel } from './${capName}Panel';
`);

  writeFile(`apps/web/src/features/${mod}/components/${capName}Panel.tsx`, `
import React from 'react';

export default function ${capName}Panel() {
  return (
    <div className="glassmorphism p-6 rounded-2xl border border-border flex flex-col gap-4">
      <h3 className="text-xl font-bold text-white">${capName} Management</h3>
      <p className="text-zinc-400 text-sm">
        Integrates core logic, constants, hooks, and services built for the ${mod} feature workspace.
      </p>
      <div className="p-4 rounded-lg bg-black/40 border border-zinc-800 text-xs font-mono text-accent-cyan">
        [Feature Module: ${capName}] Initialized successfully.
      </div>
    </div>
  );
}
`);

  // hooks
  writeFile(`apps/web/src/features/${mod}/hooks/use-${mod}.ts`, `
import { useState, useEffect } from 'react';

export function use${capName}() {
  const [data, setData] = useState<any>(null);
  const [loading, setLoading] = useState<boolean>(false);
  const [error, setError] = useState<string | null>(null);

  const executeAction = async () => {
    setLoading(true);
    try {
      // Logic for feature action goes here
      setData({ initialized: true });
    } catch (e: any) {
      setError(e.message);
    } finally {
      setLoading(false);
    }
  };

  return { data, loading, error, executeAction };
}
`);

  // services
  writeFile(`apps/web/src/features/${mod}/services/${mod}.service.ts`, `
export class ${capName}Service {
  private static apiBase = '/api/v1/${mod}';

  static async fetchAll() {
    const res = await fetch(this.apiBase);
    if (!res.ok) throw new Error('Failed to fetch ${mod} assets');
    return res.json();
  }

  static async create(payload: any) {
    const res = await fetch(this.apiBase, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(payload),
    });
    if (!res.ok) throw new Error('Failed to create ${mod} item');
    return res.json();
  }
}
`);

  // types
  writeFile(`apps/web/src/features/${mod}/types/index.ts`, `
export interface ${capName}Model {
  id: string;
  name: string;
  status: string;
  createdAt: string;
}
`);

  // constants
  writeFile(`apps/web/src/features/${mod}/constants/index.ts`, `
export const ${mod.toUpperCase()}_FEATURE_KEY = 'feature_${mod}';
export const ACTION_TIMEOUT_MS = 5000;
`);

  // utils
  writeFile(`apps/web/src/features/${mod}/utils/index.ts`, `
export function format${capName}Name(val: string): string {
  return \`[\${val.toUpperCase()}]\`;
}
`);

  // tests
  writeFile(`apps/web/src/features/${mod}/tests/${mod}.spec.tsx`, `
import React from 'react';
// Sample test spec for future frontend testing integration
describe('${capName} Feature Component Spec', () => {
  it('correctly mounts', () => {
    // Assert feature rendering
  });
});
`);

  // Page Routing inside App Router
  // If landing page dashboard, map pages
  if (mod === 'dashboard') {
    writeFile(`apps/web/src/app/dashboard/page.tsx`, `
import React from 'react';
import ${capName}Panel from '@/features/${mod}/components/${capName}Panel';

export default function DashboardPage() {
  return (
    <div className="max-w-7xl mx-auto px-4 py-12 flex flex-col gap-8">
      <h1 className="text-4xl font-extrabold tracking-tight text-white">System Dashboard</h1>
      <${capName}Panel />
    </div>
  );
}
`);
  } else {
    writeFile(`apps/web/src/app/${mod}/page.tsx`, `
import React from 'react';
import ${capName}Panel from '@/features/${mod}/components/${capName}Panel';

export default function ${capName}Page() {
  return (
    <div className="max-w-7xl mx-auto px-4 py-12 flex flex-col gap-8">
      <div className="flex flex-col gap-2">
        <span className="text-xs uppercase tracking-widest text-accent-cyan font-bold">Feature Workspace</span>
        <h1 className="text-4xl font-extrabold tracking-tight text-white">${capName} View</h1>
      </div>
      <${capName}Panel />
    </div>
  );
}
`);
  }
});

// Write the main premium index/landing page UI demonstrating high aesthetic quality
writeFile('apps/web/src/app/page.tsx', `
import React from 'react';
import { 
  Sparkles, Layers, Sliders, ShieldCheck, Zap, 
  Database, DatabaseBackup, Command, BookOpen, 
  Presentation, BarChart3, Settings, Shield, UserCheck 
} from 'lucide-react';
import { Button } from '@/components/ui/button';

export default function LandingPage() {
  const modulesList = [
    { name: 'Authentication', icon: UserCheck, desc: 'OAuth & role-based route guard profiles.', path: '/auth' },
    { name: 'Analytics Dashboard', icon: BarChart3, desc: 'High fidelity chart views & pipelines.', path: '/dashboard' },
    { name: 'Asset Market', icon: Layers, desc: 'Browse and trade premium generated digital assets.', path: '/market' },
    { name: 'Research Lab', icon: Zap, desc: 'Market intelligence and structural search analysis.', path: '/research' },
    { name: 'NotebookLM Integration', icon: BookOpen, desc: 'Synthesize document sources into active prompts.', path: '/notebooklm' },
    { name: 'Slides Generator', icon: Presentation, desc: 'Automate high-quality slide decks via AI layouts.', path: '/slides' },
    { name: 'Asset Engine', icon: Sparkles, desc: 'Generate multi-format commercial assets on command.', path: '/asset' },
    { name: 'Prompt Studio', icon: Command, desc: 'Fine-tuned prompt parameters & vector embedding.', path: '/prompt' },
    { name: 'Automation Pipeline', icon: Sliders, desc: 'Trigger complex background generation cycles.', path: '/automation' },
    { name: 'Quality Control', icon: ShieldCheck, desc: 'Automate rating validation & visual filtering.', path: '/quality' },
    { name: 'Distributed Storage', icon: DatabaseBackup, desc: 'Fast object uploads and S3 sync workflows.', path: '/storage' },
    { name: 'Background Jobs', icon: Database, desc: 'Monitor BullMQ progress & Redis caching metrics.', path: '/jobs' },
    { name: 'Settings Control', icon: Settings, desc: 'Workspace settings, keys, and rate controls.', path: '/settings' }
  ];

  return (
    <div className="relative min-h-screen overflow-hidden bg-[#030712]">
      {/* Decorative gradient background glows */}
      <div className="absolute top-[-10%] left-[-10%] w-[50%] h-[50%] rounded-full bg-accent-violet/10 blur-[150px] pointer-events-none" />
      <div className="absolute bottom-[-10%] right-[-10%] w-[50%] h-[50%] rounded-full bg-accent-cyan/10 blur-[150px] pointer-events-none" />

      {/* Navigation Header */}
      <header className="border-b border-zinc-900 glassmorphism sticky top-0 z-50">
        <div className="max-w-7xl mx-auto px-6 h-16 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <div className="w-8 h-8 rounded-lg bg-gradient-to-tr from-accent-violet to-accent-cyan flex items-center justify-center font-bold text-white shadow-lg">
              A
            </div>
            <span className="font-bold tracking-tight text-white text-lg">AI Asset Factory</span>
          </div>
          <nav className="hidden md:flex items-center gap-6 text-sm text-zinc-400">
            <a href="#features" className="hover:text-white transition-colors">Features</a>
            <a href="#architecture" className="hover:text-white transition-colors">Architecture</a>
            <a href="#stack" className="hover:text-white transition-colors">Tech Stack</a>
          </nav>
          <div className="flex items-center gap-3">
            <Button variant="outline" size="sm">Docs</Button>
            <Button variant="premium" size="sm">Launch App</Button>
          </div>
        </div>
      </header>

      {/* Hero Section */}
      <main className="max-w-7xl mx-auto px-6 py-20 flex flex-col items-center justify-center text-center gap-8 relative z-10">
        <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full border border-accent-cyan/30 bg-accent-cyan/5 text-xs text-accent-cyan font-semibold tracking-wide">
          <Sparkles className="w-3.5 h-3.5" /> Introducing Modular Monolith Generation
        </div>
        
        <h1 className="text-5xl md:text-7xl font-extrabold tracking-tight text-white max-w-4xl">
          Automate Premium Commercial <span className="gradient-text">Design Assets</span>
        </h1>
        
        <p className="text-zinc-400 text-lg md:text-xl max-w-2xl font-light">
          An enterprise-ready AI Asset Engine built on a highly scalable, production-grade Modular Monolith architecture.
        </p>

        <div className="flex flex-wrap justify-center gap-4 mt-4">
          <Button variant="premium" size="lg">Get Started</Button>
          <Button variant="outline" size="lg">Explore Architecture</Button>
        </div>

        {/* Feature Grid */}
        <section id="features" className="w-full mt-24 flex flex-col gap-12 text-left">
          <div className="flex flex-col gap-2">
            <h2 className="text-3xl font-extrabold text-white">System Modules</h2>
            <p className="text-zinc-500 max-w-xl">
              13 logically isolated workspaces structured to scale. Click on any module to review its sandbox layout.
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {modulesList.map((mod, idx) => {
              const Icon = mod.icon;
              return (
                <a 
                  key={idx} 
                  href={mod.path} 
                  className="group relative glassmorphism p-6 rounded-2xl border border-zinc-900 hover:border-zinc-800 transition-all duration-300 hover:-translate-y-1"
                >
                  <div className="absolute top-0 right-0 w-24 h-24 bg-gradient-to-bl from-accent/5 to-transparent rounded-tr-2xl pointer-events-none opacity-0 group-hover:opacity-100 transition-opacity" />
                  <div className="flex items-center gap-4 mb-4">
                    <div className="w-10 h-10 rounded-xl bg-zinc-900 border border-zinc-800 flex items-center justify-center text-accent-cyan group-hover:text-white group-hover:bg-accent transition-colors">
                      <Icon className="w-5 h-5" />
                    </div>
                    <h3 className="font-bold text-lg text-white group-hover:text-accent-cyan transition-colors">{mod.name}</h3>
                  </div>
                  <p className="text-zinc-400 text-sm leading-relaxed">{mod.desc}</p>
                </a>
              );
            })}
          </div>
        </section>
      </main>

      {/* Footer */}
      <footer className="border-t border-zinc-900 mt-20 py-8 text-center text-sm text-zinc-600">
        <p>&copy; 2026 AI Asset Factory. Structured as a Bounded Modular Monolith.</p>
      </footer>
    </div>
  );
}
`);

console.log('Project Structure setup configuration completed. Running generator sync...');

module.exports = {
  writeFile,
  modules
};
