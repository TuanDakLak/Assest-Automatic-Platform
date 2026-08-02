# Market Module Testing Guide

This guide describes how to verify the functionality of the **Market** module on the backend.

---

## 1. Automated Unit Tests (Jest)

To run the unit tests written for the controller and service of the Market module, execute:

```bash
# 1. Navigate to the backend application folder
cd apps/api

# 2. Run Jest specifically for the market module
npx jest src/modules/market
```

---

## 2. Manual REST API Testing (curl)

Ensure the backend server is running (`pnpm dev:api` on `http://localhost:3001`).

### A. Category CRUD

* **Create Category**:
  ```bash
  curl -X POST http://localhost:3001/api/v1/market/categories \
    -H "Content-Type: application/json" \
    -d '{"name": "E-Commerce", "description": "Online storefronts and checkout pages"}'
  ```

* **List Categories**:
  ```bash
  curl -X GET http://localhost:3001/api/v1/market/categories
  ```

---

### B. Style CRUD

* **Create Style**:
  ```bash
  curl -X POST http://localhost:3001/api/v1/market/styles \
    -H "Content-Type: application/json" \
    -d '{"name": "Glassmorphism", "description": "Frosted glass aesthetic with blur effects"}'
  ```

* **List Styles**:
  ```bash
  curl -X GET http://localhost:3001/api/v1/market/styles
  ```

---

### C. Market Topic Operations

* **Create a Topic manually**:
  *(Note: Replace `categoryId` and `styleId` with the UUIDs returned from the Category and Style creation responses).*
  ```bash
  curl -X POST http://localhost:3001/api/v1/market/topics \
    -H "Content-Type: application/json" \
    -d '{
      "title": "Crypto Wallet Dashboard UI",
      "categoryId": "PASTE-CATEGORY-UUID-HERE",
      "styleId": "PASTE-STYLE-UUID-HERE",
      "trendScore": 85.5,
      "marketScore": 92.0,
      "searchVolume": 12500,
      "competitionScore": 34.0,
      "status": "DISCOVERED"
    }'
  ```

* **List all Topics (with potential score rank)**:
  ```bash
  curl -X GET http://localhost:3001/api/v1/market/topics
  ```

* **Filter Topics by Category or Style**:
  ```bash
  curl -X GET "http://localhost:3001/api/v1/market/topics?categoryId=PASTE-CATEGORY-UUID&status=DISCOVERED"
  ```

* **Trigger Automated Discover Engine**:
  *This automatically generates, scores, and saves 3 trending commercial topics combining your active categories & styles.*
  ```bash
  curl -X POST http://localhost:3001/api/v1/market/discover
  ```

* **Recalculate Topic Score manually**:
  ```bash
  curl -X POST http://localhost:3001/api/v1/market/topics/PASTE-TOPIC-UUID-HERE/recalculate
  ```
