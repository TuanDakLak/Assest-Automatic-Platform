# Hướng Dẫn Kiểm Thử Thủ Công Toàn Diện (Manual Testing Guide)

Tài liệu này hướng dẫn chi tiết cách kiểm thử thủ công tất cả các tính năng trên giao diện người dùng (Frontend Web Dashboard) kết hợp với Backend API.

---

## 1. Chuẩn Bị Môi Trường Trước Khi Test

Đảm bảo các dịch vụ sau đang chạy trên máy tính của bạn:

1. **Backend API (NestJS)**: Chạy trên cổng `3001`
   * Lệnh khởi động: `pnpm dev:api` (hoặc `pnpm --filter api run start:dev`)
2. **Frontend Web (Next.js)**: Chạy trên cổng `3000`
   * Lệnh khởi động: `pnpm dev:web` (hoặc `pnpm --filter web run dev`)
3. **Cơ sở dữ liệu (Prisma/PostgreSQL hoặc SQLite)**: Đã được sync migration đầy đủ (`pnpm db:generate`).
4. **Redis**: Đang chạy trên cổng mặc định `6379` (yêu cầu bắt buộc để chạy Queue BullMQ cho NotebookLM).
5. **Playwright Browser**: Đã cài đặt nhân trình duyệt Chromium:
   * Lệnh cài đặt: `npx playwright install chromium`

---

## 2. Kịch Bản 1: Quản Lý Thị Trường (Market Panel)

Mục tiêu: Đảm bảo thêm mới danh mục, phong cách và các chủ đề thương mại hoạt động bình thường, không còn lỗi `Validation failed`.

### Các bước thực hiện:
1. Truy cập vào Dashboard Frontend: `http://localhost:3000/market` (hoặc tab **Market** trên thanh điều hướng).
2. **Thêm Danh mục (Category)**:
   * Tìm nút **Add Category** (hoặc biểu tượng dấu cộng tương ứng).
   * Nhập tên danh mục (ví dụ: `T-Shirt Design`, `Canvas Wall Art`).
   * Nhập mô tả tùy chọn và nhấn **Save / Add**.
   * *Đánh giá*: Danh mục mới phải hiển thị ngay trên danh sách hoặc thanh lựa chọn mà không báo lỗi.
3. **Thêm Phong cách (Style)**:
   * Tìm nút **Add Style**.
   * Nhập tên phong cách (ví dụ: `Vintage Retro`, `Minimalist Line Art`, `Watercolor`).
   * Nhập mô tả và nhấn **Save**.
   * *Đánh giá*: Phong cách mới xuất hiện thành công.
4. **Thêm Chủ đề Thị trường (Market Topic)**:
   * Tìm nút **Create/Add Topic**.
   * Điền các thông tin:
     * **Title**: Tên chủ đề (ví dụ: `Cute cat drinking coffee vintage`).
     * **Category**: Chọn danh mục đã tạo ở bước 2.
     * **Style**: Chọn phong cách đã tạo ở bước 3.
     * **Trend Score**: Điền điểm xu hướng (từ `0` đến `100`, ví dụ: `85`).
     * **Market Score**: Điền điểm thị trường (từ `0` đến `100`, ví dụ: `90`).
     * **Search Volume**: Điền lượng tìm kiếm (ví dụ: `15000`).
     * **Competition Score**: Điền điểm cạnh tranh (từ `0` đến `100`, ví dụ: `40`).
   * Nhấn **Submit / Create**.
   * *Đánh giá*: Chủ đề được tạo thành công, xuất hiện trong bảng danh sách với trạng thái mặc định là `DISCOVERED` và điểm tổng hợp (Weighted Score) tự động tính toán chính xác.

---

## 3. Kịch Bản 2: Động Cơ Nghiên Cứu AI (Research Panel)

Mục tiêu: Tạo báo cáo nghiên cứu dạng Markdown tối ưu hóa cho NotebookLM từ một chủ đề.

### Các bước thực hiện:
1. Truy cập tab **Research** (`http://localhost:3000/research`).
2. Chọn một chủ đề có sẵn trong danh sách (được đồng bộ từ Market Module) hoặc nhập trực tiếp chủ đề mong muốn vào ô tìm kiếm/nhập liệu.
3. Nhấp chọn nút **Generate Research Report** (hoặc **Tự động tạo báo cáo**).
4. Đợi hệ thống phản hồi (tầm 1-3 giây do đang sử dụng Mock AI API tốc độ cao).
5. *Đánh giá*:
   * Trên giao diện hiển thị tài liệu nghiên cứu định dạng Markdown chi tiết.
   * Báo cáo phải chứa đầy đủ các phần bắt buộc:
     * **Overview** (Tổng quan)
     * **Core Concepts** (Khái niệm cốt lõi)
     * **Industry Terminology** (Thuật ngữ chuyên ngành)
     * **Latest Trends** (Xu hướng mới nhất)
     * **Real-world Examples** (Ví dụ thực tế)
     * **Glossary** (Bảng thuật ngữ)
     * **References** (Tài liệu tham khảo)

---

## 4. Kịch Bản 3: Tự Động Hóa NotebookLM (NotebookLM Automation)

Mục tiêu: Đưa dữ liệu nghiên cứu vào Google NotebookLM để sinh Slide trình chiếu và tải về tự động.

### Bước chuẩn bị tài khoản (Bắt buộc):
Vì NotebookLM yêu cầu đăng nhập tài khoản Google, bạn cần lưu file phiên đăng nhập Google trước:
1. Trên máy tính của bạn, mở terminal chạy lệnh Playwright ở chế độ tương tác để đăng nhập tài khoản Google của bạn:
   * Cách làm: Tạo file session bằng cách chạy trình duyệt và lưu lại trạng thái cookies vào file `session.json` ở thư mục gốc của dự án (hoặc thư mục được chỉ định trong `.env` bởi khóa `NOTEBOOKLM_SESSION_STATE_PATH`).
   * *Lưu ý*: Không commit file `session.json` lên Git (đã được cấu hình tự động bỏ qua trong `.gitignore`).

### Các bước thực hiện trên Frontend:
1. Truy cập tab **NotebookLM** (`http://localhost:3000/notebooklm`).
2. Chọn bài nghiên cứu Markdown đã tạo ở Kịch bản 2.
3. Nhấp nút **Trigger Presentation Generation** (hoặc **Bắt đầu tạo Slide tự động**).
4. Hệ thống sẽ trả về ID của tiến trình ngầm (BullMQ Job) và hiển thị trạng thái `QUEUED` hoặc `ACTIVE`.
5. Mở tab **Jobs / Monitor** (hoặc xem trực tiếp log từ Terminal của Backend):
   * Bạn sẽ thấy trình duyệt Playwright Chromium chạy ngầm (Headless), tự động truy cập NotebookLM, tạo Notebook mới, tải tài liệu Markdown lên, đợi nạp dữ liệu, tạo Slide trình bày và tải file PPTX về thư mục lưu trữ cục bộ.
6. *Đánh giá*: Khi Job hoàn thành (`COMPLETED`), file PowerPoint (.pptx) sẽ tự động xuất hiện trong thư mục tải xuống của hệ thống.

---

## 5. Kịch Bản 4: Trích Xuất Ảnh Slide (Slide Parser)

Mục tiêu: Cắt file PowerPoint (.pptx) vừa tải về thành các slide ảnh PNG riêng lẻ chất lượng cao.

### Các bước thực hiện:
1. Truy cập tab **Slides / Parser** (`http://localhost:3000/slides`).
2. Tải lên (Upload) file PowerPoint `.pptx` của bạn hoặc nhập đường dẫn file vật lý trên ổ đĩa.
3. Tùy chọn cấu hình bộ chuyển đổi trên giao diện:
   * **Resolution / Scale**: Chọn độ phân giải (ví dụ: `2.0` cho ảnh nét gấp đôi gốc, hoặc nhập chiều rộng `1920` pixel).
   * **Background Transparency**: Bật hoặc Tắt chế độ nền trong suốt (Transparent).
4. Nhấn nút **Parse Presentation** (hoặc **Trích xuất Slide**).
5. Đợi hệ thống xử lý (tốc độ cực nhanh nhờ thư viện render Skia trực tiếp trên Node.js).
6. *Đánh giá*:
   * Giao diện hiển thị danh sách các slide đã được cắt thành ảnh dạng lưới (Grid View).
   * Mỗi slide hiển thị đầy đủ số trang, độ phân giải thực tế (ví dụ: `1920x1080`).
   * Nhấp chọn từng ảnh để xem chi tiết hoặc nhấn nút **Download All PNGs** dưới dạng file nén `.zip` (hoặc tải trực tiếp từng ảnh).
   * Kiểm tra ảnh tải về: Định dạng `.png`, chữ và hình vẽ vector hiển thị sắc nét, nền trong suốt được áp dụng chính xác nếu chọn chế độ Transparent.
