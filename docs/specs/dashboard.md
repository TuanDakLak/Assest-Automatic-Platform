# Dashboard Module

> Số liệu tổng hợp cho màn hình quản trị.

**Vị trí**: Hỗ trợ · `apps/api/src/modules/dashboard/`

---

## Mục đích

Gom số liệu từ nhiều nguồn về một endpoint để giao diện không phải gọi năm sáu API
rồi tự cộng.

## Số liệu cần cung cấp

| Nhóm | Nội dung |
|---|---|
| Topic | Tổng số, phân bố theo status, điểm trung bình |
| Asset | Tổng số, tỉ lệ đạt QC, điểm QC trung bình |
| Job | Đang chạy, chờ, xong, lỗi, thông lượng |
| Chi phí | Tổng token và tiền đã dùng, cộng từ `Asset.metadata.cost` |
| Đĩa | Dung lượng thư mục `downloads/` |

## API

| Method | Đường dẫn | Việc |
|---|---|---|
| `POST/GET/PUT/DELETE` | `/dashboard[/:id]` | CRUD sinh tự động |

Nên thay bằng một endpoint `GET /dashboard/summary` trả toàn bộ số liệu trên.

## Lưu ý về giao diện

Component `DashboardPanel.tsx` ở frontend hiện **tự bịa dữ liệu** khi API không
phản hồi. Nó có nhánh fallback im lặng: tạo category giả trong React state, sinh
topic giả, giả lập luôn cả việc kích hoạt pipeline. Người dùng không nhận được
thông báo lỗi nào.

Hậu quả thực tế: tạo category xong thấy hiện lên, nhưng sau khi làm mới thì biến
mất — vì nó chưa bao giờ được lưu.

Nên bỏ toàn bộ nhánh fallback này. Trang `/market` (dùng `MarketPanel`) báo lỗi
trung thực và là mẫu nên theo.

## Trạng thái

**Khung rỗng** ở backend, và frontend đang che lỗi bằng dữ liệu giả.
