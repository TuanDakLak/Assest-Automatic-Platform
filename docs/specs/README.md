# Đặc tả module — AI Asset Factory

Mỗi module một file. Tài liệu mô tả **thiết kế đích v3**; chỗ nào code hiện tại
khác với đích đều được ghi rõ ở mục *Trạng thái* của từng file.

---

## Hệ thống làm gì

Tự động sản xuất ảnh asset thiết kế 3D đã tách nền, sẵn sàng kéo thả vào Figma.
Từ "chủ đề nào đang hot" đến "file PNG trong suốt" không cần người can thiệp.

Kiến trúc: pnpm monorepo, modular monolith.

- `apps/api` — NestJS 11, Prisma/PostgreSQL, BullMQ/Redis, Playwright
- `apps/web` — Next.js 15, React 19, Tailwind, tổ chức theo feature

## Bảy bước của pipeline

| Bước | Module | Việc | Công cụ |
|---|---|---|---|
| 1 | [market](./market.md) | Tìm và chấm điểm chủ đề | GDELT API |
| 2 | [automation](./automation.md) | Lọc topic đạt ngưỡng | — |
| 3 | [research](./research.md) | Viết báo cáo Markdown | Gemini Flash |
| 4 | [notebooklm](./notebooklm.md) | Sinh slide, tải .pptx | Playwright + NotebookLM |
| 5 | [slides](./slides.md) | Cắt slide thành PNG | node-pptx-png |
| 6 | [figma](./figma.md) | Tách nền | GenLogin + Figma AI |
| 7 | [quality](./quality.md) | Kiểm định 7 tiêu chí | Gemini Vision |

## Module hỗ trợ

| Module | Việc |
|---|---|
| [asset](./asset.md) | Sổ cái mọi asset, kèm metadata truy vết |
| [jobs](./jobs.md) | Nhìn vào hàng đợi BullMQ |
| [auth](./auth.md) | Đăng nhập, phân quyền |
| [storage](./storage.md) | Quản lý file trên đĩa |
| [prompt](./prompt.md) | Mẫu prompt gửi AI |
| [settings](./settings.md) | Cấu hình sửa được lúc chạy |
| [dashboard](./dashboard.md) | Số liệu tổng hợp |

## Trạng thái từng module

| Module | Repository | Trạng thái |
|---|---|---|
| market | Prisma thật | Hoàn thành |
| automation | — | Điều phối chạy được; CRUD là khung |
| notebooklm | khung | Worker chạy được; selector cần đối chiếu |
| slides | khung | Hoàn thành |
| asset | khung | Chạy được; sẽ thu hẹp ở v3 |
| quality | khung | Chạy được; rơi về mock khi thiếu API key |
| jobs | khung | `findAll()` thật, còn lại là khung |
| research | khung | **Template tĩnh, chưa gọi AI** |
| figma | — | **Chưa tồn tại** |
| auth | khung | **Khung rỗng** — không JWT, không hash, không guard |
| storage | khung | Khung rỗng |
| prompt | khung | Khung rỗng |
| settings | khung | Khung rỗng |
| dashboard | khung | Khung rỗng; frontend đang che lỗi bằng dữ liệu giả |

"khung" = repository trả `{ id: 'mock-id' }`, chưa nối Prisma.

## Ba chỗ còn giả lập

Đây là những nơi hệ thống chạy trót lọt nhưng kết quả không thật:

1. **research** — template chuỗi tĩnh với `setTimeout(500)` giả độ trễ. Mọi chủ đề
   cho ra cùng một khung câu chữ
2. **asset** và **quality** — tự rơi về mock khi thiếu `OPENAI_API_KEY`. Mock của
   quality trả **cứng điểm 95**, nên mọi asset đều "đạt"
3. **DashboardPanel** ở frontend — bịa category, topic và job khi API không phản
   hồi, không báo lỗi

Dấu hiệu nhận biết nhanh: mọi Asset đều có `finalScore = 95`, hoặc `searchVolume`
của topic lên tới hàng nghìn (GDELT thật thường chỉ hai đến ba chữ số).

## Việc nên làm trước

| Ưu tiên | Việc | Lý do |
|---|---|---|
| 1 | Auth thật | Mọi endpoint đang mở |
| 2 | Hiệu chỉnh ngưỡng `score >= 75` | Điểm GDELT thật thấp hơn, pipeline có thể không nhặt được topic nào |
| 3 | Research gọi Gemini | Bỏ chỗ giả lập lớn nhất |
| 4 | Bỏ fallback giả ở DashboardPanel | Lỗi đang bị che, khó gỡ |
| 5 | Figma module | Thay chroma-key bằng Figma AI |

## Tài liệu liên quan

- [Hướng dẫn kiểm thử](../testing_guide.md) — 4 lớp test, từ unit tới end-to-end
- `pipeline_flow_v2.md` — sơ đồ luồng v3
