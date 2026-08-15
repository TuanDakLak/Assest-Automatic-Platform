# Quality Module

> Cổng kiểm định: asset đạt chuẩn thương mại mới được đánh dấu hoàn thành.

**Vị trí**: Step 7 của pipeline · `apps/api/src/modules/quality/`

---

## Mục đích

Asset sinh tự động có thể bị dính chữ, còn viền nền, méo hình. Module này chấm
điểm ảnh cuối bằng mô hình thị giác và quyết định cho qua hay loại.

## Bảy tiêu chí

Mỗi tiêu chí chấm 0–100, kèm lý do bằng chữ:

| Tiêu chí | Kiểm tra gì |
|---|---|
| `backgroundRemoved` | Nền đã trong suốt sạch chưa |
| `noFloatingText` | Còn sót chữ trôi nổi không |
| `noWatermark` | Có watermark, dấu bản quyền không |
| `noDuplicatedObjects` | Có vật thể bị nhân đôi không |
| `noCroppedObjects` | Vật thể có bị cắt ở mép không |
| `noBlur` | Ảnh có nét không |
| `noDistortion` | Có méo do AI sinh không |

Điểm cuối là trung bình cộng 7 tiêu chí. **Ngưỡng đạt: 90.**

## API

| Method | Đường dẫn | Việc |
|---|---|---|
| `POST` | `/quality/check` | Body `{ assetId }`, chấm điểm và cập nhật DB |

## Kết quả

| Điểm | Status ghi vào Asset |
|---|---|
| ≥ 90 | `COMPLETED` |
| < 90 | `FAILED_QC` |

Chi tiết đánh giá lưu vào `Asset.metadata.qualityAssessment`, gồm điểm từng tiêu
chí, lý do, điểm cuối và thời điểm chấm.

## Thiết kế đích v3

Dùng **Gemini Flash Vision** thay cho GPT-4o Vision. Prompt và 7 tiêu chí giữ
nguyên, chỉ đổi nhà cung cấp để về mức chi phí bằng 0.

## Trạng thái

Hoàn thành phần logic, nhưng **có bẫy**: khi thiếu `OPENAI_API_KEY` hoặc chạy ở
`NODE_ENV=test`, service tự rơi về `getMockQualityResponse()` trả **cứng điểm 95**.
Nghĩa là mọi asset đều "đạt" mà không hề được kiểm tra.

Dấu hiệu nhận biết: nếu mọi Asset trong DB đều có `finalScore = 95`, bạn đang chạy
trên mock. Đây là hành vi tiện cho test nhưng dễ gây hiểu nhầm khi chạy thật —
nên cân nhắc bắt buộc khai báo biến môi trường rõ ràng thay vì âm thầm rơi về mock.
