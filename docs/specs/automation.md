# Automation Module

> Nhạc trưởng: gọi lần lượt các module khác theo đúng thứ tự.

**Vị trí**: Bao trùm cả pipeline · `apps/api/src/modules/automation/`

---

## Mục đích

Module này không tự làm gì cả. Nó chỉ điều phối: gọi Market, lọc kết quả, gọi
Research, đẩy job vào queue. Từ đó trở đi worker tự chạy tiếp.

## Hai cách kích hoạt

| Cách | Chi tiết |
|---|---|
| Tự động | `@Cron` chạy 00:00 mỗi ngày, quét toàn bộ |
| Thủ công | `POST /automation/trigger` với `{ topicId }` để chạy đúng một topic |

Chế độ thủ công **bỏ qua** bước discovery và bỏ qua cả bộ lọc điểm — hữu ích khi
muốn chạy thử một topic cụ thể.

## Luồng chạy tự động

1. Gọi `MarketService.discoverCommercialTopics()`
2. Lấy tối đa 5 topic có `score >= 75` và `status = DISCOVERED`
3. Với từng topic:
   - Đổi `status` sang `ANALYZING` ngay (khoá, tránh lượt sau nhặt lại)
   - Gọi `ResearchService.generateResearch(title)`
   - Đẩy job vào queue NotebookLM
4. Trả về ngay, không chờ worker

Toàn bộ nằm trong try/catch — một topic lỗi không làm hỏng cả lượt.

## API

| Method | Đường dẫn | Việc |
|---|---|---|
| `POST` | `/automation/trigger` | Body `{ topicId? }`. Không có `topicId` thì chạy full |

Endpoint trả về ngay lập tức; pipeline chạy nền.

## Cảnh báo về ngưỡng điểm

Ngưỡng `score >= 75` đang **hard-code** tại `automation.service.ts`. Ngưỡng này
được đặt khi các chỉ số còn sinh ngẫu nhiên với khoảng thổi phồng (trend 60–100,
market 70–100). Điểm GDELT thật thấp hơn đáng kể.

Trước khi chạy pipeline, kiểm tra:

```sql
SELECT COUNT(*) FROM "MarketTopic" WHERE score >= 75 AND status = 'DISCOVERED';
```

Trả về 0 nghĩa là pipeline sẽ discover xong rồi đứng im. Nên đưa ngưỡng này ra
biến môi trường và hiệu chỉnh lại theo thang điểm thật.

## Trạng thái

Phần điều phối hoàn thành và chạy được. Các hàm CRUD của module trả dữ liệu cứng,
chưa dùng đến.
