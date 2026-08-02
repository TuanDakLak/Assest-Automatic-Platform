# AI Asset Factory

An enterprise-ready SaaS platform built to automatically generate premium commercial design assets.

## 🏗️ Architecture
This project is structured as a **pnpm Monorepo Workspace** hosting a **Modular Monolith**:
- **Frontend (`apps/web`)**: Next.js 15, React 19, TailwindCSS, and shadcn/ui. Organized under a feature-based folder design.
- **Backend (`apps/api`)**: NestJS backend containing logically bounded modules (Auth, Dashboard, Market, Research, Slides, Assets, Prompts, Storage, Jobs, etc.) interfacing with PostgreSQL via Prisma and Redis via BullMQ.

---

## 🚀 Getting Started

### Prerequisites
Make sure you have the following installed on your machine:
- **Node.js** (v20+ recommended)
- **pnpm** (v9+ recommended)
- **Docker** and **Docker Compose**

---

### Setup Instructions

1. **Clone the Repository**
   ```bash
   git clone <repository-url>
   cd "Assest Automation Platform"
   ```

2. **Install Dependencies**
   Run the following command at the root workspace:
   ```bash
   pnpm install
   ```

3. **Start Local Infrastructure**
   Spin up local PostgreSQL and Redis containers using Docker Compose:
   ```bash
   docker-compose up -d
   ```

4. **Environment Variables**
   Ensure you have a `.env` file in the backend folder:
   - Root: `/apps/api/.env` (See `/apps/api/.env.example` for details)

5. **Run Prisma Migrations**
   Generate the Prisma Client and migrate tables:
   ```bash
   # Generate types
   pnpm db:generate
   
   # Run PostgreSQL migrations
   pnpm db:migrate
   ```

---

## 💻 Running Locally

You can run development servers concurrently from the root directory:

| App | Run Command | Address |
| --- | --- | --- |
| **Backend (NestJS)** | `pnpm dev:api` | `http://localhost:3001/api/v1` |
| **Frontend (Next.js)** | `pnpm dev:web` | `http://localhost:3000` |

---

## 🧪 Testing

To run tests in the workspace:
- **Backend Unit Tests**: `pnpm test:api`
- **Frontend E2E Tests**: `pnpm test:web`

For more detailed information, please read the [Testing Guide](./docs/testing_guide.md).
