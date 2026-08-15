# Figma Module

> Tách nền asset bằng Figma AI thay vì tự xử lý pixel.

**Vị trí**: Step 6 của pipeline · **chưa tồn tại trong repo**

---

## Mục đích

Đây là thay đổi lớn nhất của v3. Thay vì tự viết thuật toán tách nền, hệ thống
điều khiển Figma Pro và dùng tính năng **Remove Background** có sẵn của Figma AI.

Lý do đổi: cách cũ quét pixel có `R, G, B > 235` rồi đặt alpha về 0. Cách này chỉ
hoạt động khi nền trắng tuyệt đối và làm thủng cả những vùng sáng nằm trong vật
thể. Figma AI phân biệt được đâu là vật thể, đâu là nền.

## Cách kết nối Figma

Figma không cho tự động hoá phần AI qua API. Đường vòng:

1. **GenLogin Desktop** giữ sẵn một profile trình duyệt đã đăng nhập Figma Pro,
   kèm fingerprint giả lập để không bị phát hiện là bot
2. GenLogin mở cổng gỡ lỗi **CDP :9222**
3. Playwright nối vào bằng `connectOverCDP` — điều khiển trình duyệt có sẵn thay
   vì mở trình duyệt mới

Khác biệt so với NotebookLM module: ở đó Playwright tự mở Chromium và nạp cookie;
ở đây Playwright gắn vào một trình duyệt đang chạy sẵn.

## Vòng lặp cho mỗi slide

1. Tạo Section trong Figma, đặt tên `"<Topic Title> [YYYY-MM-DD]"`
2. Đặt ảnh slide PNG vào Section, tên layer `slide_01_asset`
3. Chọn layer → Edit Image → Remove Background (Figma AI xử lý ~3–5 giây)
4. Export layer ra PNG trong suốt, lưu về đĩa

## Cấu trúc file Figma sau khi chạy

```
AI Asset Library (Figma Working File)
├── Section: "Sustainable Packaging - Minimalist [2026-08-12]"
│   ├── slide_01_asset      (đã tách nền)
│   └── slide_02_asset
└── Section: "Electric Vehicles - 3D Isometric [2026-08-12]"
    └── slide_01_asset
```

Không giữ slide gốc trong Figma. Mỗi layer là một asset đã tách nền hoàn chỉnh,
file Figma trở thành thư viện asset dùng lại được.

## API dự kiến

| Method | Đường dẫn | Việc |
|---|---|---|
| `POST` | `/figma/extract` | Body `{ slidePaths[], topicTitle, categoryName }` |
| `GET` | `/figma/health` | Kiểm tra GenLogin và CDP có sẵn sàng không |

## Rủi ro cần tính trước

- **Phụ thuộc GenLogin chạy trên máy** — không deploy lên server không giao diện được
- **Figma AI có hạn mức** — cần đếm số lần gọi và xử lý khi hết
- **Selector giao diện Figma thay đổi** — giống vấn đề đang gặp với NotebookLM
- **Chạy tuần tự** — mỗi slide 3–5 giây, một topic 10 slide mất gần một phút

## Trạng thái

**Chưa bắt đầu.** Hiện tại Step 6 do `AssetService` đảm nhiệm với GPT-4o Vision
cộng chroma-key bằng skia-canvas. Sprint 6 đang ở giai đoạn thiết kế.
