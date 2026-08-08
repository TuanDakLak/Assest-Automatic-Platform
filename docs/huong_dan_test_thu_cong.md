# Hướng Dẫn Kiểm Thử Từ A-Z: Từ Ý Tưởng Đến Thành Phẩm Figma
## AI Asset Automation Platform

Tài liệu này hướng dẫn người dùng cuối (User) và lập trình viên cách kiểm thử toàn diện hệ thống từ A-Z để sản xuất ra một ảnh tài nguyên 3D trong suốt chất lượng cao, sẵn sàng kéo thả sử dụng trên thiết bị thiết kế chuyên nghiệp **Figma**. Cuối tài liệu là mô tả chi tiết **Luồng Logic Nghiệp Vụ (Business Logic Flow)** chạy ngầm bên dưới hệ thống.

---

## PHẦN I: HƯỚNG DẪN KIỂM THỬ HỆ THỐNG TỪ A-Z (USER TESTING GUIDE)

### Bước 1: Chuẩn bị môi trường & phiên đăng nhập Google
Để Playwright có thể điều khiển trình duyệt truy cập và tương tác tự động với Google NotebookLM, hệ thống cần một phiên đăng nhập Google hợp lệ (để tránh bị Google Captcha chặn):
1. **Lưu phiên đăng nhập Google (Quan trọng)**:
   * Chạy lệnh sau ở thư mục gốc dự án để mở trình duyệt tương tác:
     ```powershell
     pnpm save-session
     ```
   * Trình duyệt Chrome/Edge thực tế sẽ tự động khởi chạy. Hãy tiến hành đăng nhập tài khoản Google của bạn.
   * **CHÚ Ý**: Bạn cần thực hiện đăng nhập và xác thực (nếu có) cho đến khi trình duyệt hiển thị giao diện Dashboard chính của Google NotebookLM (nơi hiển thị danh sách các Notebook và nút lớn để tạo **"New Notebook"**).
   * Chỉ **sau khi đã đăng nhập thành công hoàn toàn**, hãy quay lại cửa sổ Terminal/Command Prompt và nhấn nút **ENTER** một lần duy nhất để lưu thông tin phiên đăng nhập vào file `apps/api/session.json`. Tránh nhấn ENTER trước khi đăng nhập thành công vì sẽ ghi đè session trống.
2. **Khởi chạy hệ thống**:
   * Đảm bảo Redis server đang chạy (mặc định cổng `6379`).
   * Khởi động backend API: `pnpm dev:api` (chạy trên `http://localhost:3001`).
   * Khởi động dashboard frontend: `pnpm dev:web` (chạy trên `http://localhost:3000`).

---

### Bước 2: Khai thác ý tưởng thiết kế tiềm năng (Market Discovery)
Mục tiêu là tìm ra các chủ đề thiết kế thương mại đang hot trên thị trường để đảm bảo tài nguyên tạo ra dễ bán và có lượng tìm kiếm lớn.
1. Truy cập vào Dashboard: `http://localhost:3000/dashboard` và chọn tab **Categories**.
2. Thêm mới một danh mục thiết kế mong muốn, ví dụ:
   * **Category Name**: `Technology`
   * **Description**: `Thiết kế kỹ thuật số, công nghệ tương lai`
3. Chuyển sang tab **Topics** và tạo mới một chủ đề tiềm năng:
   * **Title**: `3D Glossy Processor Chip` (Chíp vi xử lý 3D bóng bẩy)
   * **Category Selection**: Chọn `Technology`
   * **Trend Score**: `95`

---

### Bước 3: Tự động nghiên cứu tài liệu nguồn (Automated Research)
1. Trong bảng danh sách chủ đề ở tab **Topics**, nhấn nút **Run Pipeline** bên cạnh chủ đề `3D Glossy Processor Chip`.
2. Hệ thống sẽ kích hoạt một tiến trình nghiên cứu độc lập cho đúng chủ đề đó (Manual Override) thông qua cổng API `http://localhost:3001/api/v1/automation/trigger` bằng cách gửi kèm `topicId`.
   * **Chú ý**: Việc nhấn nút tại dòng cụ thể sẽ chỉ chạy cho đúng chủ đề đã chọn mà không kích hoạt quy trình quét xu hướng tự động ngẫu nhiên (Auto-Discovery) hay làm thay đổi danh sách tiêu đề như phiên bản cũ.
3. Hệ thống kích hoạt `Research Service` viết một bài báo cáo phân tích chi tiết bằng ngôn ngữ Markdown (chứa định nghĩa phần cứng, lịch sử thiết kế chip, bảng chú giải thuật ngữ, ví dụ thực tế và tài liệu tham khảo) được tối ưu cấu trúc nhằm nạp vào NotebookLM. Báo cáo này cũng được lưu trực tiếp vào thư mục `downloads/categories/.../research_report.md` để bạn có thể xem trực tiếp.

---

### Bước 4: Tạo slide tự động bằng NotebookLM (Headless Slide Generation)
1. Một Job tiến trình ngầm (BullMQ Job) sẽ được đẩy vào hàng đợi Redis.
2. Bạn có thể theo dõi tiến trình chạy ngầm này trực tiếp bằng cách chuyển sang tab **Jobs** trên Dashboard Web. Tab này hiển thị các công việc BullMQ thực tế đang chờ hoặc đang chạy lấy trực tiếp từ Redis server.
3. Worker Playwright sẽ tự động mở trình duyệt Chromium ngầm, nạp file `session.json` để đăng nhập Google tự động.
4. Worker thực hiện các thao tác:
   * Truy cập `https://notebooklm.google/`.
   * Nhấp chọn tạo mới một Notebook (`New Notebook`).
   * Tải tệp tài liệu nghiên cứu Markdown vừa tạo ở Bước 3 lên.
   * Gửi prompt định hướng thiết kế vào ô chat sinh slide: 
     * *Prompt cấu hình*: `"Create a slide presentation featuring 3d assets and elements on a clean, light background."*
   * Đợi NotebookLM sinh slide và tải về máy tệp PowerPoint (.pptx).

---

### Bước 5: Cắt slide và phân loại tự động vào Category (Slide Parsing & Organization)
Khi tệp PPTX được tải về thành công:
1. Hệ thống tự động di chuyển tệp trình chiếu vào đúng phân mục lưu trữ theo tên Category đã khai báo:
   * Đường dẫn mục lưu trữ: `downloads/categories/technology/3d_glossy_processor_chip/`
2. `Slides Service` sử dụng thư viện kết xuất đồ họa Node gốc (`skia-canvas`) để chuyển đổi từng slide trong tệp PPTX thành các tệp ảnh PNG chất lượng cao dạng lưới.

---

### Bước 6: Trích xuất & Tách nền tự động bằng AI (Asset Extraction & Background Removal)
1. Đối với từng tệp ảnh slide PNG vừa được tạo ra, hệ thống tự động đẩy dữ liệu sang `Asset Service`.
2. AI GPT Vision phân tích cấu trúc đồ họa trên slide và trích xuất vật thể chip 3D trung tâm.
3. Thuật toán **Chroma-Keying xóa nền** gốc chạy trực tiếp trên Server:
   * Đọc dữ liệu pixel từ canvas.
   * Tự động quét màu nền sáng của slide (các màu có mức phản quang trắng gần tuyệt đối $R, G, B > 235$) và chuyển đổi kênh màu Alpha (độ mờ đục) về $0$.
   * Xuất ra ảnh vật thể hoàn toàn trong suốt định dạng PNG: `3d_glossy_processor_chip_slide_1_transparent.png`.

---

### Bước 7: Kiểm định chất lượng & Xuất bản (Quality Checker & Pass Gate)
1. Hệ thống tự động chuyển ảnh đã tách nền qua `Quality Service`.
2. AI QA Engineer sẽ kiểm định ảnh dựa trên 7 tiêu chí (Tách nền sạch, không dính chữ trôi nổi, không có logo/watermark, không méo hình, không nhòe, v.v.).
3. Ảnh đạt điểm chất lượng **$\ge 90/100$** sẽ được gắn nhãn trạng thái **`COMPLETED`** trên Dashboard, sẵn sàng cho việc sử dụng.

---

### Bước 8: Sử dụng thành phẩm trên Figma (Figma Integration)
1. Mở phần mềm thiết kế **Figma** (phiên bản Web hoặc Desktop Application) và tạo/mở một trang nháp thiết kế (Canvas).
2. Mở thư mục chứa ảnh thành phẩm trên máy tính của bạn:
   * Đường dẫn: `downloads/categories/technology/3d_glossy_processor_chip/`
3. Kéo tệp ảnh `3d_glossy_processor_chip_slide_1_transparent.png` thả trực tiếp vào Figma.
4. **Kết quả đạt được trên Figma**:
   * Vật thể chip vi xử lý 3D hiển thị sắc nét với các góc cạnh bóng bẩy.
   * **Nền xung quanh hoàn toàn trong suốt**, cho phép bạn đặt đè vật thể lên bất kỳ background tối, sáng hoặc màu gradient nào mà không sợ dính vệt viền trắng hay chữ nền slide cũ.
   * Sẵn sàng ghép nối vào các layout banner tiếp thị, thiết kế giao diện web (UI/UX), hoặc bài viết mạng xã hội cao cấp.

---
---

## PHẦN II: LUỒNG LOGIC NGHIỆP VỤ CỦA HỆ THỐNG (BUSINESS LOGIC FLOW)

Luồng nghiệp vụ xử lý của AI Asset Automation Platform được tổ chức chạy bất đồng bộ nhằm tối ưu hóa tài nguyên server và ngăn nghẽn API:

```
[Người dùng/Cron Scheduler]
           │
           ▼
┌────────────────────────────────────────────────────────┐
│ 1. MARKET MODULE (Khám phá & Chấm điểm ý tưởng)       │
│    - Rà soát xu hướng, tính toán Market Score          │
│    - Lưu ý tưởng tiềm năng vào CSDL ở trạng thái       │
│      "DISCOVERED" nếu điểm số đạt chuẩn.               │
└──────────────────┬─────────────────────────────────────┘
                   │ (Tự động kích hoạt hoặc kích hoạt bằng tay)
                   ▼
┌────────────────────────────────────────────────────────┐
│ 2. RESEARCH MODULE (Nghiên cứu tài liệu nguồn)         │
│    - Viết báo cáo Markdown chi tiết cho chủ đề         │
│    - Trạng thái Topic chuyển sang "ANALYZING"          │
└──────────────────┬─────────────────────────────────────┘
                   │ (Đẩy tác vụ vào hàng đợi BullMQ + Redis)
                   ▼
┌────────────────────────────────────────────────────────┐
│ 3. NOTEBOOKLM AUTOMATION (Tự động hóa trình duyệt)      │
│    - Trình duyệt Playwright chạy ngầm tải session.json │
│    - Đăng nhập, tải file Markdown, viết Prompt tạo     │
│      slide "3D, light background"                      │
│    - Tải tệp PPTX về thư mục tạm                       │
└──────────────────┬─────────────────────────────────────┘
                   │ (Hoàn thành Job tải file)
                   ▼
┌────────────────────────────────────────────────────────┐
│ 4. SLIDES PARSER MODULE (Tách trang & Tổ chức thư mục) │
│    - Tạo thư mục lưu trữ theo đúng Category            │
│    - Chuyển đổi tệp PPTX sang các Slide ảnh PNG        │
└──────────────────┬─────────────────────────────────────┘
                   │ (Gửi luồng ảnh slide đi trích xuất)
                   ▼
┌────────────────────────────────────────────────────────┐
│ 5. ASSET EXTRACTION MODULE (Tách lọc vật thể đồ họa)   │
│    - Dùng GPT Vision bóc tách cấu trúc ảnh            │
│    - Tích hợp hàm Chroma-Keying quét dải màu sáng      │
│    - Xóa nền trắng và tạo kênh Alpha trong suốt        │
└──────────────────┬─────────────────────────────────────┘
                   │ (Lưu ảnh trong suốt mới tạo)
                   ▼
┌────────────────────────────────────────────────────────┐
│ 6. QUALITY CHECKER MODULE (Kiểm định chất lượng)       │
│    - Chấm điểm hình ảnh dựa trên 7 tiêu chí visual     │
│    - Điểm >= 90: Update CSDL trạng thái "COMPLETED"    │
│    - Điểm < 90: Đánh dấu trạng thái lỗi "FAILED_QC"    │
└────────────────────────────────────────────────────────┘
```

### Các trạng thái chuyển đổi của Asset & Topic trong Cơ sở dữ liệu:
* **Topic Status Flow**: `DISCOVERED` (Được tìm thấy) $\rightarrow$ `ANALYZING` (Đang tạo báo cáo & chạy slide) $\rightarrow$ `SLIDES_GENERATED` (Đã sinh và tải slide PowerPoint thành công).
* **Asset Status Flow**: `PENDING` (Đang chờ xử lý) $\rightarrow$ `COMPLETED` (Xóa nền & vượt qua bài kiểm định chất lượng) OR `FAILED_QC` (Không vượt qua tiêu chuẩn hình ảnh thương mại) OR `FAILED` (Gặp lỗi hệ thống hoặc kết nối API trong quá trình sinh/trích xuất).
