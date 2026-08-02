# Testing Guide

This document outlines the testing strategies, structure, and command guidelines for the **AI Asset Factory**. All future testing updates and new feature testing patterns should be documented in this file.

---

## 1. Backend Testing (NestJS + Jest)

We use **Jest** for unit and integration testing of the modular monolith controllers, services, and repositories.

### Directory Structure
In each backend module (`apps/api/src/modules/<module-name>`), tests are stored inside the `tests/` subdirectory:
- `<module-name>.controller.spec.ts` (Validates route mapping, query params, request payloads, and status codes)
- `<module-name>.service.spec.ts` (Validates business logic, mathematical algorithms, and database delegations)

### Command Execution
Run these commands from the root workspace directory or within the `apps/api` folder:

* **Run all backend tests**:
  ```bash
  # From Root
  pnpm test:api
  
  # From /apps/api
  npm run test
  ```

* **Run tests for a single module (Recommended for speed)**:
  ```bash
  # From /apps/api
  npx jest src/modules/market
  ```

* **Run tests with coverage metrics**:
  ```bash
  # From /apps/api
  npm run test -- --coverage
  ```

### Writing Tests for New Features
When implementing a new module:
1. Mock any dependent services or repositories using `jest.fn()`.
2. Wrap database connections through `PrismaService` mocks to avoid mutating local data.
3. Place test suites under `<module-name>/tests/*.spec.ts`.

---

## 2. Frontend Testing (Next.js + Playwright)

We use **Playwright** to run end-to-end (E2E) UI and user experience tests.

### Directory Structure
Frontend test suites are stored in `apps/web/playwright/`:
- `playwright/e2e/`: E2E flow tests (e.g. `auth.spec.ts` testing registration and login panels).
- `features/<feature-name>/tests/`: Feature-specific unit/component tests.

### Command Execution
Run these commands from the root workspace directory or within the `apps/web` folder:

* **Run all E2E tests (Headless mode)**:
  ```bash
  # From Root
  pnpm test:web
  
  # From /apps/web
  pnpm test
  ```

* **Run Playwright in UI Interactive Mode (Highly recommended for debugging)**:
  ```bash
  # From /apps/web
  npx playwright test --ui
  ```

* **Run a single test file**:
  ```bash
  # From /apps/web
  npx playwright test playwright/e2e/auth.spec.ts
  ```

* **Generate HTML test report**:
  ```bash
  # From /apps/web
  npx playwright show-report
  ```
