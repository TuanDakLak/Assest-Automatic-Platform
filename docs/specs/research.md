# Research Module

> Viết báo cáo Markdown làm nguồn nạp cho NotebookLM.

**Vị trí**: Step 3 của pipeline · `apps/api/src/modules/research/`

---

## Mục đích

NotebookLM cần một tài liệu nguồn để sinh slide. Module này nhận tên chủ đề và
sinh ra một báo cáo Markdown có cấu trúc, tối ưu cho NotebookLM đọc hiểu.

## Cấu trúc báo cáo

Bảy mục cố định, dùng heading chuẩn và gạch đầu dòng để NotebookLM dễ tách ý:

1. Overview — tổng quan chủ đề
2. Core Concepts — các trụ cột chính
3. Industry Terminology — thuật ngữ
4. Latest Trends — xu hướng mới
5. Real-World Examples — tình huống thực tế
6. Glossary — từ điển nhanh
7. References — nguồn tham khảo

Đầu file có dòng ghi chú nói rõ tài liệu được tối ưu cho NotebookLM.

## API

| Method | Đường dẫn | Việc |
|---|---|---|
| `POST` | `/research/generate` | Body `{ topic }`, trả chuỗi Markdown |
| `POST/GET/PUT/DELETE` | `/research[/:id]` | CRUD (chưa dùng) |

## Thiết kế đích v3

Nội dung sinh bởi **Gemini Flash API** (free tier), không phải template tĩnh.

Yêu cầu với lời gọi Gemini:

- Prompt phải ép đúng 7 mục trên, để cấu trúc ổn định giữa các lần chạy
- Ghi lại `tokensUsed` và model vào metadata để theo dõi hạn mức free tier
- Có retry với backoff luỹ thừa, giống cách `GdeltService` đang làm
- Hết quota thì trả lỗi rõ ràng, **không** âm thầm rơi về template

Bản báo cáo được lưu vào `downloads/categories/<category>/<topic>/research_report.md`
để người dùng đọc trực tiếp.

## Phụ thuộc

- Ngoài: Gemini Flash API
- Được gọi bởi: `AutomationService` (Step 3)
- Đầu ra dùng bởi: NotebookLM module (Step 4)

## Trạng thái

**Cần làm lại.** Code hiện tại là template chuỗi tĩnh với `setTimeout(500)` giả độ
trễ — không gọi AI. Mọi chủ đề cho ra cùng một khung câu chữ, chỉ thay tên. Đây là
một trong ba chỗ giả lập còn lại của hệ thống.
