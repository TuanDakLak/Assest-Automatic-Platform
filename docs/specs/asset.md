# Asset Module

> Sổ cái của mọi asset được sinh ra.

**Vị trí**: Xuyên suốt pipeline · `apps/api/src/modules/asset/`

---

## Mục đích

Mỗi ảnh asset sinh ra đều có một bản ghi ở đây, kèm đủ thông tin để truy vết:
sinh từ slide nào, dùng prompt gì, tốn bao nhiêu token, điểm kiểm định ra sao.

## Model Asset

| Trường | Ý nghĩa |
|---|---|
| `title` | Tên asset |
| `url` | Đường dẫn file trên đĩa |
| `type` | `IMAGE`, `VIDEO`, `SLIDES`, `DOC` |
| `status` | `PENDING` → `COMPLETED` / `FAILED_QC` / `FAILED` |
| `metadata` | JSON: prompt, model, token, chi phí, số lần retry, kết quả QC |
| `userId` | Chủ sở hữu |

`metadata` là chỗ chứa mọi thứ không muốn thêm cột, ví dụ:

```json
{
  "slidePath": "...",
  "model": "gpt-4o",
  "tokensUsed": { "prompt": 800, "completion": 200 },
  "cost": 0.015,
  "retryCount": 0,
  "qualityAssessment": { "finalScore": 95, "passed": true }
}
```

## API

| Method | Đường dẫn | Việc |
|---|---|---|
| `POST` | `/asset/extract` | Trích xuất asset từ một ảnh slide |
| `POST/GET/PUT/DELETE` | `/asset[/:id]` | CRUD |

## Vai trò trong v3

Ở bản hiện tại, module này **vừa trích xuất vừa lưu trữ**: gọi GPT-4o Vision đọc
slide, rồi chroma-key xoá nền bằng skia-canvas.

Ở v3, phần trích xuất và tách nền **chuyển sang Figma module**. Asset module thu
gọn lại thành sổ cái thuần tuý: nhận đường dẫn PNG đã tách nền, ghi bản ghi kèm
metadata. Điều này làm module đơn giản hơn nhiều và bỏ được phụ thuộc skia-canvas.

## Hai điểm cần sửa

**Gán sai chủ sở hữu.** Hàm `create()` lấy `userId` bằng `prisma.user.findFirst()`
— tức luôn gán cho user đầu tiên trong bảng. Sai ngay khi có nhiều user.

**Tự tạo user hệ thống.** Khi DB rỗng, `extractAsset()` tạo một user với mật khẩu
để nguyên dạng chữ thường trong code. Cần bỏ khi làm Auth thật.

## Trạng thái

Hoạt động được nhưng sẽ thu hẹp phạm vi ở v3. Giống Quality module, nó tự rơi về
mock khi thiếu `OPENAI_API_KEY`.
