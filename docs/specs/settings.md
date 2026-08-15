# Settings Module

> Cấu hình hệ thống sửa được lúc đang chạy.

**Vị trí**: Hỗ trợ · `apps/api/src/modules/settings/`

---

## Mục đích

Nhiều tham số đang nằm trong biến môi trường hoặc hard-code, muốn đổi phải sửa
file và khởi động lại. Module này đưa chúng vào DB.

## Các tham số nên quản lý

| Tham số | Hiện ở đâu | Ghi chú |
|---|---|---|
| Ngưỡng chạy pipeline | Hard-code `score >= 75` | Cần hiệu chỉnh theo thang điểm GDELT thật |
| Ngưỡng đạt QC | Hard-code `>= 90` | |
| Khoá API Gemini | `.env` | Cần che khi hiển thị |
| Tần suất cron | Hard-code `EVERY_DAY_AT_MIDNIGHT` | |
| Số topic mỗi lượt | Hard-code `take: 5` | |
| Cấu hình GDELT | `.env` | Throttle, cooldown, TTL cache |

Hai ngưỡng đầu là quan trọng nhất. Ngưỡng 75 được đặt khi chỉ số còn sinh ngẫu
nhiên với khoảng thổi phồng; với dữ liệu GDELT thật nó có thể lọc sạch mọi topic.

## Nguyên tắc

- Không bao giờ trả khoá API nguyên vẹn qua API, luôn che dạng `sk-...abc`
- Biến môi trường vẫn là giá trị mặc định; DB chỉ ghi đè khi có bản ghi
- Ghi log mỗi lần đổi, kèm người đổi và thời điểm

## API

| Method | Đường dẫn | Việc |
|---|---|---|
| `POST/GET/PUT/DELETE` | `/settings[/:id]` | CRUD |

## Trạng thái

**Khung rỗng.** Trang `/settings` ở frontend đã có nhưng chưa nối vào backend thật.
