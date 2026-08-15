# NotebookLM Module

> Điều khiển trình duyệt để Google NotebookLM sinh slide và tải file .pptx về.

**Vị trí**: Step 4 của pipeline · `apps/api/src/modules/notebooklm/`

---

## Mục đích

NotebookLM không có API công khai. Module này dùng Playwright điều khiển một
Chromium thật, đăng nhập bằng phiên đã lưu, upload báo cáo Markdown, yêu cầu sinh
slide rồi tải file `.pptx` về đĩa.

Vì thao tác trình duyệt chậm và dễ lỗi, công việc chạy qua hàng đợi chứ không
chạy trực tiếp trong request.

## Hai thành phần

| File | Vai trò |
|---|---|
| `notebooklm.service.ts` | Đẩy job vào queue, tra trạng thái job |
| `notebooklm.processor.ts` | Worker tiêu thụ queue, chạy Playwright |

Queue: BullMQ tên `notebooklm-automation` trên Redis. Concurrency 2, retry 3 lần
với backoff luỹ thừa bắt đầu từ 5 giây.

## API

| Method | Đường dẫn | Việc |
|---|---|---|
| `POST` | `/notebooklm/trigger` | Body `{ topic, markdownContent }`, trả `jobId` |
| `GET` | `/notebooklm/jobs/:id` | Trạng thái job, kèm `failedReason` khi lỗi |

## Các bước worker thực hiện

1. Ghi Markdown ra `downloads/temp_research_<jobId>.md`
2. Mở Chromium, nạp cookie từ `session.json`
3. Vào `notebooklm.google`, tạo notebook mới
4. Upload file Markdown, chờ index xong (tối đa 70 giây)
5. Yêu cầu sinh slide deck, chờ xử lý (tối đa 90 giây)
6. Bắt sự kiện download, lưu `.pptx`
7. Gọi tiếp Step 5 → 6 → 7 trong cùng job

Toàn bộ vòng 1–6 retry tối đa 3 lần với backoff tăng dần.

## Phiên đăng nhập Google

Chạy `pnpm save-session` một lần để đăng nhập thủ công và lưu cookie.

**Điểm cần chú ý**: `save-session.js` mở Chrome thật (`channel: 'chrome'`) với
userAgent, locale và timezone tuỳ chỉnh, đồng thời vá `navigator.webdriver`.
Nhưng processor lại nạp cookie đó vào một Chromium headless **không có thiết lập
nào tương ứng**. Google có thể coi đây là phiên lạ và chặn.

Nếu worker timeout ở bước "New notebook", nguyên nhân thường là:

1. Chưa cài browser: `pnpm exec playwright install chromium`
2. Không tìm thấy `session.json` — đặt `NOTEBOOKLM_SESSION_STATE_PATH` bằng đường dẫn tuyệt đối
3. Google chặn do fingerprint lệch — cần đồng bộ context của processor với `save-session.js`
4. Selector không khớp giao diện NotebookLM hiện tại

Chạy với `PLAYWRIGHT_HEADLESS=false` để nhìn tận mắt nó dừng ở đâu.

## Phụ thuộc

- Ngoài: Google NotebookLM, Redis
- Trong: gọi tiếp `SlidesService`, `AssetService`, `QualityService`
- Được gọi bởi: `AutomationService` (Step 4)

## Trạng thái

Hoàn thành phần khung. Selector đang là phỏng đoán và cần đối chiếu với giao diện
NotebookLM thật.
