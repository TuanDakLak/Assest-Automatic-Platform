# Research Module Testing Guide

This guide details how to verify and test the generation functionality of the **Research** module.

---

## 1. Automated Unit Tests (Jest)

To execute the unit tests developed for the `ResearchService` (validating the Markdown parser, content structures, and input validations), run:

```bash
# 1. Navigate to the backend application folder
cd apps/api

# 2. Run Jest on the research module scope
npx jest src/modules/research
```

Expected result:
```text
PASS src/modules/research/tests/research.controller.spec.ts
PASS src/modules/research/tests/research.service.spec.ts

Test Suites: 2 passed, 2 total
Tests:       4 passed, 4 total
```

---

## 2. Integration & Usage Guide (Service Only)

The `ResearchService` has been built as a service-only class (mocking external LLM integrations) to facilitate downstream NotebookLM generation.

### Service Signature
```typescript
async generateResearch(topic: string): Promise<string>
```

- **Input**: `topic` (string) — The subject of the research document.
- **Output**: `string` (Markdown) — A detailed report featuring headers for **Overview**, **Core Concepts**, **Industry Terminology**, **Latest Trends**, **Real-World Examples**, **Glossary**, and **References**.

### Integration Example
To call this service from other backend modules (e.g. `NotebooklmModule` or `SlidesModule`):

```typescript
import { Injectable } from '@nestjs/common';
import { ResearchService } from '../research/research.service';

@Injectable()
export class SlidesWorkflowService {
  constructor(private readonly researchService: ResearchService) {}

  async createSlidesFromTopic(topic: string) {
    // 1. Generate the research source Markdown document
    const sourceMarkdown = await this.researchService.generateResearch(topic);
    
    // 2. Pass sourceMarkdown to NotebookLM / Slide builder engines
    // ...
  }
}
```
