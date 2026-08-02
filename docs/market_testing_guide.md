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

---

## 3. Frontend UI Testing (Next.js App)

We have built a responsive, interactive visual testing dashboard for Category, Style, and Topic Management.

### Verification Steps
1. **Start Services**:
   Ensure both backend and frontend servers are running concurrently from the root directory:
   ```bash
   pnpm dev:api
   pnpm dev:web
   ```

2. **Navigate to Market view**:
   Open your browser and navigate to:
   `http://localhost:3000/market`

3. **Verify Category Management**:
   - In the **Categories** panel on the left, type a category name (e.g. `Mobile App`) and click **Add Category**.
   - Verify it appears in the active categories list immediately.

4. **Verify Style Management**:
   - In the **Design Styles** panel on the left, type a style name (e.g. `Minimalist`) and click **Add Style**.
   - Verify it appears in the active styles list immediately.

5. **Verify AI Discovery Engine**:
   - Click the **Discover New Topics** button in the top-right header panel.
   - The button will spin ("Running Discovery...") and automatically match your active categories/styles, score them, and populate the list below.

6. **Verify Manual Topic Creation**:
   - Type a Title (e.g., `Fintech Dashboard UI Concept`).
   - Select your newly created Category and Style from the dropdowns.
   - Adjust scores and search volume numbers, then click **Create Scored Topic**.
   - Verify it is calculated and listed in the database immediately.

7. **Verify Score Recalculation**:
   - Hover over or locate any topic in the list.
   - Click the reload icon next to its score. It will query the backend algorithm and update the weighted potential score on-the-fly.

