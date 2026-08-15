# Jobs Module

> Cửa sổ nhìn vào hàng đợi BullMQ.

**Vị trí**: Hỗ trợ · `apps/api/src/modules/jobs/`

---

## Mục đích

Cho giao diện biết đang có job nào chạy, chờ, xong hay lỗi. Đọc trực tiếp từ
Redis chứ không lưu bản sao trong PostgreSQL.

## API

| Method | Đường dẫn | Việc |
|---|---|---|
| `GET` | `/jobs` | Danh sách job từ BullMQ, sắp xếp mới nhất trước |
| `POST/GET/PUT/DELETE` | `/jobs[/:id]` | CRUD (chưa dùng thật) |

## Dữ liệu trả về

Repository gom bốn nhóm trạng thái từ queue `notebooklm-automation`:

| Nhóm BullMQ | Status hiển thị |
|---|---|
| `getActive()` | `RUNNING` |
| `getWaiting()` | `QUEUED` |
| `getCompleted()` | `COMPLETED` |
| `getFailed()` | `FAILED` |

Mọi job đều gắn nhãn `type: 'NOTEBOOKLM_SLIDES'` vì hiện chỉ có một loại queue.

## Hạn chế hiện tại

- **Không trả lý do lỗi.** Job `FAILED` chỉ có id và thời gian. Muốn biết vì sao
  phải gọi sang `GET /notebooklm/jobs/:id` để lấy `failedReason`. Nên gộp thông
  tin này vào `/jobs` để giao diện đỡ phải gọi hai nơi
- **Không phân trang.** Queue nhiều job sẽ trả về hết một lúc
- **`findOne`, `update`, `remove` trả dữ liệu cứng**

Model `Job` trong Prisma đã có sẵn nhưng chưa dùng — hiện mọi thứ đọc từ Redis.

## Trạng thái

`findAll()` hoạt động thật. Các hàm còn lại là khung rỗng.
