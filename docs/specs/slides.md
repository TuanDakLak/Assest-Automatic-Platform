# Slides Module

> Cắt file .pptx thành từng ảnh PNG.

**Vị trí**: Step 5 của pipeline · `apps/api/src/modules/slides/`

---

## Mục đích

File `.pptx` tải từ NotebookLM chứa nhiều slide. Module này render từng slide
thành một file PNG riêng để bước sau tách nền lấy asset.

Dùng thư viện `node-pptx-png` (nền Skia-Canvas) — render thuần JavaScript, không
cần LibreOffice hay PowerPoint.

## API

| Method | Đường dẫn | Việc |
|---|---|---|
| `POST` | `/slides/parse` | Render file pptx thành PNG |

Body:

| Trường | Mặc định | Ý nghĩa |
|---|---|---|
| `filePath` | bắt buộc | Đường dẫn file .pptx |
| `outputDir` | cạnh file gốc | Thư mục xuất PNG |
| `scale` | `2.0` | Hệ số phóng, 2× cho ảnh nét |
| `width` | — | Chỉ định chiều rộng, ghi đè `scale` |
| `transparent` | `false` | Nền trong suốt khi render |

Trả về `{ success, slideCount, savedPaths[], slides[] }`.

## Cách đặt tên và lưu

PNG lưu vào thư mục theo Category để dễ tra:

```
downloads/categories/<category>/<topic>/
  research_report.md
  <ten_file>_slide_1.png
  <ten_file>_slide_2.png
```

Slide nào render lỗi thì ghi log và bỏ qua, các slide còn lại vẫn xuất bình thường.

## Phụ thuộc

- Ngoài: `node-pptx-png` (giấy phép MIT)
- Được gọi bởi: `NotebooklmProcessor` sau khi tải xong .pptx
- Đầu ra dùng bởi: Figma module (Step 6)

## Trạng thái

Hoàn thành.
