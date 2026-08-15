# Market Module

> Tìm chủ đề đáng làm asset, chấm điểm bằng dữ liệu tin tức thật.

**Vị trí**: Step 1 của pipeline · `apps/api/src/modules/market/`

---

## Mục đích

Trả lời câu hỏi "nên làm asset về chủ đề gì". Module ghép **chủ đề** (lấy từ tin
tức thế giới qua GDELT) với **phong cách thiết kế** (do người dùng tự định nghĩa),
rồi chấm điểm để pipeline biết cái nào đáng chạy tiếp.

Điểm cần nhớ: GDELT là kho tin tức, không phải kho xu hướng thiết kế. Nó biết
"sustainable packaging" đang nóng, nhưng không biết gì về "glassmorphism". Vì vậy
trục chủ đề lấy từ GDELT, còn trục phong cách nằm ở bảng `Style` cục bộ.

## Dữ liệu

| Model | Vai trò |
|---|---|
| `Category` | Nhóm chủ đề. Có `keywords[]` là các từ khoá gửi sang GDELT |
| `Style` | Phong cách thiết kế (Minimalist, Glassmorphism...). Không liên quan GDELT |
| `MarketTopic` | Một ứng viên = keyword × style, kèm 4 chỉ số và điểm tổng |
| `GdeltSnapshot` | Cache chỉ số theo keyword, TTL 12 giờ |

## Bốn chỉ số và nguồn gốc

| Chỉ số | Lấy từ đâu | Công thức |
|---|---|---|
| `searchVolume` | GDELT `timelinevolraw` | Tổng bài viết 7 ngày gần nhất |
| `trendScore` | cùng response | `(TB 7 ngày / TB 3 tháng) × 50`, chặn 0–100 |
| `marketScore` | GDELT `tonechart` | % bài có tone dương |
| `competitionScore` | GDELT `artlist` | Số toà soạn khác nhau / 150 × 100 |

Điểm tổng: `trend×0.35 + market×0.35 + volume_chuẩn_hoá×0.15 + (100−competition)×0.15`

Ý nghĩa `marketScore`: chủ đề được đưa tin tích cực (ra mắt, đầu tư, tăng trưởng)
thường gắn với nhu cầu thương mại hơn là chủ đề đưa tin tiêu cực (thảm hoạ, thu hồi).

## API

| Method | Đường dẫn | Việc |
|---|---|---|
| `POST/GET/PUT/DELETE` | `/market/categories[/:id]` | CRUD Category kèm `keywords[]` |
| `POST/GET/PUT/DELETE` | `/market/styles[/:id]` | CRUD Style |
| `POST/GET/PUT/DELETE` | `/market/topics[/:id]` | CRUD Topic, hỗ trợ lọc theo category/style/status |
| `POST` | `/market/topics/:id/recalculate` | Tính lại điểm từ chỉ số hiện có |
| `POST` | `/market/discover?forceRefresh=` | Chạy discovery. `forceRefresh=true` bỏ qua cache |
| `GET` | `/market/gdelt/probe?keyword=` | Thử một keyword mà không tạo topic |

Validate bằng Zod (`validators/index.ts`), không dùng class-validator.

## Luồng discovery

1. Gom tất cả `keywords[]` từ mọi Category. Không có keyword nào thì trả 400
2. Với từng keyword: đọc cache, hết hạn thì gọi GDELT
3. Keyword không có coverage (`searchVolume = 0`) thì **bỏ qua kèm lý do**, không bịa số
4. Ghép với một Style ngẫu nhiên, tạo title `"Chủ Đề (Category - Style)"`
5. Trùng title thì bỏ qua
6. Tạo `MarketTopic` với `status = DISCOVERED`

Trả về `{ count, evaluated, aborted, topics[], skipped[] }`.

## Chống rate limit

GDELT báo quá tải theo **hai cách**: HTTP 429 (có thể kèm `Retry-After`), hoặc
HTTP 200 với body rỗng. Cả hai đều được xử lý.

- Mọi request xếp hàng nối tiếp, cách nhau `GDELT_THROTTLE_MS` (mặc định 5000ms)
- Gặp 429: dừng **toàn bộ** request trong `GDELT_COOLDOWN_MS` (mặc định 60s)
- 3 keyword lỗi liên tiếp: dừng cả lượt discovery, trả `aborted: true`

Bộ ngắt mạch quan trọng vì mỗi keyword lỗi tốn ~40 giây. Không có nó, danh sách
17 keyword mất hơn 10 phút để thất bại toàn bộ và càng làm rate limit nặng thêm.

Cache lưu theo từng keyword nên chạy lại nhiều lần là an toàn — mỗi lượt tiếp tục
từ chỗ dở.

## Phụ thuộc

- Ngoài: GDELT DOC 2.0 API (miễn phí, không cần key)
- Trong: PostgreSQL qua Prisma
- Được gọi bởi: `AutomationService` (Step 1)

## Trạng thái

Hoàn thành. Đây là module duy nhất có repository thật kết nối Prisma; các module
khác vẫn là khung rỗng.
