# Prompt Module

> Quản lý các mẫu prompt gửi cho AI.

**Vị trí**: Hỗ trợ · `apps/api/src/modules/prompt/`

---

## Mục đích

Hệ thống gửi prompt tới AI ở ba chỗ khác nhau, và cả ba đang nằm rải rác trong
code:

| Nơi dùng | Prompt gì | Đang nằm ở đâu |
|---|---|---|
| Asset | Hướng dẫn trích xuất asset từ slide | `asset/constants/prompt.constants.ts` |
| Quality | 7 tiêu chí kiểm định | Viết thẳng trong `quality.service.ts` |
| Research | Sinh báo cáo Markdown | Chưa có (đang là template tĩnh) |

Module này gom chúng về DB để sửa được mà không cần deploy lại.

## Việc cần làm

| Nhiệm vụ | Chi tiết |
|---|---|
| Model `Prompt` | `key`, `content`, `version`, `isActive`, `updatedAt` |
| Lấy theo key | `getActive('asset.extract')` trả bản đang bật |
| Lưu lịch sử | Giữ các phiên bản cũ để so sánh và quay lui |
| Sửa qua giao diện | Trang `/prompt` đã có sẵn ở frontend |

`AssetService` đã có `getPromptTemplate()` / `setPromptTemplate()` nhưng chỉ lưu
trong bộ nhớ — mất khi khởi động lại.

## API

| Method | Đường dẫn | Việc |
|---|---|---|
| `POST/GET/PUT/DELETE` | `/prompt[/:id]` | CRUD |

## Trạng thái

**Khung rỗng.** Chưa có model trong Prisma, repository trả dữ liệu cứng.
