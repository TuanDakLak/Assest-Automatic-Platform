# Kiến Trúc Hệ Thống & Kế Hoạch Triển Khai (Sprint Plan)
## AI Asset Automation Platform

Tài liệu này trình bày chi tiết kiến trúc tổng quan của dự án **AI Asset Automation Platform** cùng kế hoạch phân chia giai đoạn (Sprints) để triển khai từng cấu phần thông qua các prompt độc lập, giúp việc cộng tác phát triển đạt hiệu quả và chất lượng cao nhất.

---

## 1. Kiến Trúc Tổng Quan (Architecture Overview)

Nền tảng được thiết kế theo mô hình **Modular Monolith** kết hợp hàng đợi bất đồng bộ xử lý tác vụ nặng.

### 1.1. Sơ đồ khối hệ thống (System Architecture)
```mermaid
graph TD
    subgraph Frontend (Next.js Dashboard)
        UI[Giao diện Dashboard / UI Panels]
    end

    subgraph Backend API (NestJS Monolith)
        Orch[Automation Service / Scheduler]
        Mkt[Market Module]
        Res[Research Module]
        Nlm[NotebookLM Automation]
        Sld[Slide Parser Module]
        Ast[Asset Extraction Module]
        Qc[Quality Checker Module]
        Rcp[Asset Recipe Engine]
    end

    subgraph Queue & Database
        Redis[(Redis - BullMQ Queue)]
        DB[(Database - Prisma ORM)]
    end

    subgraph External
        Google[Google NotebookLM via Playwright]
        GPT[GPT Image API]
    end

    UI <--> Backend API
    Mkt <--> DB
    Nlm --> Redis
    Redis <--> Worker[Playwright Headless Worker]
    Worker <--> Google
    Sld --> PptxRenderer[node-pptx-png / Skia-Canvas]
    Ast <--> GPT
```

### 1.2. Luồng dữ liệu tự động (System Data Flow)
1. **Khám Phá**: `Market Module` rà soát thị trường $\rightarrow$ chấm điểm $\rightarrow$ chọn ra chủ đề tiềm năng.
2. **Nghiên Cứu**: `Research Module` viết báo cáo Markdown cho chủ đề đã chọn.
3. **Tạo Slide**: `NotebookLM Automation` nạp tài liệu lên Google NotebookLM $\rightarrow$ sinh slide $\rightarrow$ tải PowerPoint (.pptx).
4. **Cắt Ảnh Slide**: `Slide Parser` tách file PPTX thành các ảnh PNG chất lượng cao, hỗ trợ tách nền.
5. **Trích Xuất & Kiểm Định**: `Asset Extraction` sinh tài nguyên thương mại $\rightarrow$ `Quality Checker` kiểm tra chất lượng ($\ge 90$ điểm).
6. **Lưu Trữ Công Thức**: `Asset Recipe Engine` lưu lại toàn bộ dữ liệu cấu thành tài nguyên dưới dạng một công thức (Recipe) tái tạo.

---

## 2. Kế Hoạch Triển Khai Chi Tiết Theo Sprints

Dự án được phát triển theo chuỗi 9 Sprints tuần tự dưới đây:

### [Sprint 1] Tạo skeleton project
*   **Mục tiêu**: Khởi dựng cấu trúc cây thư mục chuẩn cho Modular Monolith ở cả Frontend và Backend.
*   **Trạng thái**:  **Đã Hoàn Thành (Completed)**

### [Sprint 2] Triển khai Market Module
*   **Mục tiêu**: Xây dựng cơ chế chấm điểm ý tưởng thiết kế tiềm năng dựa trên Category, Style, Trend, Market, Search Volume, và Competition Score.
*   **Trạng thái**:  **Đã Hoàn Thành (Completed)**

### [Sprint 3] Triển khai Research Engine
*   **Mục tiêu**: Tự động sinh báo cáo Markdown có cấu trúc gồm: Overview, Core concepts, Industry terminology, Latest trends, Real-world examples, Glossary, References.
*   **Trạng thái**:  **Đã Hoàn Thành (Completed)**

### [Sprint 4] Triển khai NotebookLM Automation
*   **Mục tiêu**: Tích hợp Playwright & BullMQ để tự động hóa tạo Notebook, upload Markdown, đợi index, tạo Slide và download tệp trình chiếu PPTX từ Google NotebookLM.
*   **Trạng thái**:  **Đã Hoàn Thành (Completed)**

### [Sprint 5] Triển khai Slide Parser
*   **Mục tiêu**: Sử dụng `node-pptx-png` để chuyển đổi file PPTX sang bộ ảnh PNG độ phân giải cao, hỗ trợ tách nền trong suốt và giữ nguyên tỷ lệ khung hình.
*   **Trạng thái**:  **Đã Hoàn Thành (Completed)**

---

### [Sprint 6] Triển khai Asset Extraction Module
*   **Mục tiêu**: Đưa ảnh Slide PNG vào GPT Image API để tách lọc và sinh ra các tài nguyên thiết kế thương mại (commercial assets).
*   **Prompt Yêu Cầu**:
    ```text
    Implement Asset Extraction module.
    Input: Slide PNG.
    Output: Commercial PNG assets.
    Use GPT Image API.
    Prompt should be configurable.
    Store prompt template.
    Retry failed jobs.
    Save metadata.
    Generate service only.
    ```
*   **Trạng thái**:  **Chưa Triển Khai (Pending)**

### [Sprint 7] Triển khai Quality Checker
*   **Mục tiêu**: Đánh giá tự động tài nguyên được tạo ra để đảm bảo chất lượng hình ảnh thương mại cao nhất.
*   **Prompt Yêu Cầu**:
    ```text
    Implement Quality Checker.
    Every generated asset must be evaluated.
    Checks:
    - Background removed
    - No floating text
    - No watermark
    - No duplicated objects
    - No cropped objects
    - No blur
    - No distortion
    Return a score.
    Pass only assets with score >=90.
    ```
*   **Trạng thái**:  **Chưa Triển Khai (Pending)**

### [Sprint 8] Xây dựng Giao Diện Admin Dashboard
*   **Mục tiêu**: Thiết kế bảng điều khiển hoàn chỉnh cho phép xem danh mục, chủ đề, tiến trình hàng đợi và danh sách tài nguyên đã tạo.
*   **Prompt Yêu Cầu**:
    ```text
    Implement Dashboard.
    Pages:
    - Categories
    - Topics
    - Jobs
    - Assets
    - Queue
    - Settings
    Use shadcn/ui.
    Support dark mode.
    Responsive.
    No placeholder data.
    ```
*   **Trạng thái**:  **Chưa Triển Khai (Pending)**

### [Sprint 9] Triển khai Asset Recipe Engine
*   **Mục tiêu**: Thay vì chỉ lưu trữ hình ảnh đầu ra, hệ thống lưu lại toàn bộ **"Công thức tái tạo tài nguyên" (Asset Recipe)** để có thể chạy lại và sinh lại tài nguyên với bất kỳ phiên bản mô hình AI mới nào trong tương lai mà không cần thực hiện nghiên cứu lại từ đầu.
*   **Cấu trúc dữ liệu Recipe lưu trữ**:
    *   `Category`: Danh mục thiết kế.
    *   `Topic`: Chủ đề thiết kế.
    *   `Research`: Tài liệu Markdown nghiên cứu nguồn.
    *   `Notebook Prompt`: Prompt cấu hình cho NotebookLM.
    *   `GPT Prompt`: Prompt cấu hình cho mô hình sinh ảnh/tách vật thể.
    *   `Negative Prompt`: Các từ khóa phủ định hạn chế lỗi hình ảnh.
    *   `Created Time` & `Generation Cost`: Thời gian khởi tạo và chi phí tài nguyên API.
    *   `Quality Score`: Điểm chất lượng được đánh giá từ Quality Checker.
    *   `Output PNG`: Lưu trữ đường dẫn ảnh kết quả cuối cùng.
*   **Mô hình cấu trúc tệp tin (Ví dụ)**:
    ```yaml
    Technology/
        AI Infrastructure/
            Glass/
                research.md
                notebook-prompt.txt
                gpt-prompt.txt
                asset-001.png
                asset-002.png
                metadata.json # Lưu trữ điểm số, chi phí và cấu hình
    ```
*   **Trạng thái**:  **Chưa Triển Khai (Pending)**
