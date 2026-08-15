# Hướng dẫn kiểm thử — AI Asset Factory

Tài liệu này mô tả cách kiểm thử hệ thống theo **4 lớp**, xếp từ rẻ và nhanh
nhất đến tốn kém nhất. Chạy đúng thứ tự: nếu lớp 1 hỏng thì kết quả các lớp
sau không còn ý nghĩa.

| Lớp | Phạm vi | Cần mạng? | Cần DB? | Thời gian |
|---|---|---|---|---|
| 1 | Unit test (Jest) | Không | Không | ~10 giây |
| 2 | Probe một keyword với GDELT thật | Có | Có | ~6 giây/keyword |
| 3 | Chạy discovery đầy đủ | Có | Có | ~100 giây |
| 4 | Pipeline end-to-end | Có | Có + Redis | vài phút |

---

## Chuẩn bị

Trước khi test, đảm bảo đã chạy xong:

```bash
docker-compose up -d          # PostgreSQL + Redis
cd apps/api
pnpm db:generate              # sinh Prisma Client (bắt buộc, có model mới)
pnpm db:migrate               # tạo cột Category.keywords và bảng GdeltSnapshot
pnpm seed:market              # 5 category, 17 keyword, 6 style
```

Kiểm tra nhanh migration đã áp dụng chưa:

```sql
\d "Category"        -- phải thấy cột keywords (text[])
\d "GdeltSnapshot"   -- bảng phải tồn tại
```

Nếu thiếu, `pnpm db:migrate` chưa chạy hoặc chạy nhầm database.

---

## Lớp 1 — Unit test

Không chạm mạng, không chạm database. `GdeltService` tự vô hiệu hoá khi
`NODE_ENV=test` (Jest set sẵn biến này), nên test luôn xác định, chạy được
offline và không bao giờ bị GDELT rate-limit.

```bash
# Từ thư mục gốc
pnpm test:api

# Chỉ chạy module market
cd apps/api
pnpm test -- --testPathPattern=market

# Xem coverage
pnpm test -- --coverage
```

### Các spec liên quan đến GDELT

| File | Kiểm tra điều gì |
|---|---|
| `market/tests/gdelt.service.spec.ts` | Ba hàm suy ra chỉ số, chạy trên payload mẫu — trong đó tone chart là dữ liệu thật, nguyên vẹn, lấy từ GDELT cho `"sustainable packaging"` |
| `market/tests/market.service.spec.ts` | Luồng discovery: kiểm tra keyword, bỏ qua khi không có coverage, bỏ qua khi API lỗi, chống trùng topic, cắt title quá dài |
| `market/tests/market.controller.spec.ts` | Truyền `forceRefresh`, và ba tình huống của endpoint probe |

### Bốn con số cần để ý

Đây là các assertion neo vào dữ liệu thật. Nếu chúng đỏ, nghĩa là logic đã đổi:

| Assertion | Giá trị | Ý nghĩa khi đỏ |
|---|---|---|
| `marketScore` từ tone chart thật | `78.88` | 127 bài tone dương / 161 tổng. Cách tính tone đã đổi |
| `trendScore` khi coverage đúng mức nền | `50` | Công thức momentum đã đổi |
| `competitionScore` với 30 domain | `20` | Trần bão hoà (mặc định 150) đã đổi |
| `score` tổng hợp | `63.10` | Trọng số trong `calculateTopicScore` đã đổi |

### Kỳ vọng

Toàn bộ spec phải xanh. Nếu gặp lỗi TypeScript trong file spec, đó là lỗi
kiểu dữ liệu chứ không phải lỗi logic — sửa ở file spec, không sửa service.

---

## Lớp 2 — Probe một keyword với GDELT thật

### 2.0 Kiểm chứng tự động dạng dữ liệu GDELT

Chạy trước tiên, không cần API hay database:

```powershell
cd apps/api
$env:GDELT_LIVE="1"; pnpm test -- --testPathPattern=gdelt.live
```

Bài test này gọi thẳng cả ba endpoint GDELT, in ra cấu trúc JSON thật, rồi chạy
`GdeltService` để xác nhận bốn chỉ số đều khác 0.

**Vì sao cần**: mỗi endpoint nuôi một chỉ số qua một hàm parse riêng. Nếu GDELT
đổi dạng dữ liệu, hàm parse trả 0 trong im lặng và keyword bị bỏ qua với lý do
"không có coverage" — trông giống hệt như chủ đề đó thật sự không có tin tức.
Bài test tách riêng từng hàm nên khi đỏ là biết ngay hàm nào hỏng:

| Assertion đỏ | Endpoint hỏng | Chỉ số bị ảnh hưởng |
|---|---|---|
| `searchVolume` | `timelinevolraw` | Volume và trend |
| `marketScore` | `tonechart` | Nhu cầu thương mại |
| `competitionScore` | `artlist` | Mức bão hoà |

Mặc định bài test bị bỏ qua, nên `pnpm test:api` vẫn chạy offline bình thường.

### 2.1 Probe thủ công qua API

Cách nhanh nhất để xác nhận tầng HTTP, cơ chế throttle và cache hoạt động.
Cần `pnpm dev:api` đang chạy.

### 2.1 Keyword có coverage

```bash
curl "http://localhost:3001/api/v1/market/gdelt/probe?keyword=sustainable+packaging"
```

Kết quả mong đợi:

```json
{
  "keyword": "sustainable packaging",
  "usable": true,
  "searchVolume": 47,
  "trendScore": 58.31,
  "marketScore": 78.88,
  "competitionScore": 21.33,
  "articleCount": 486,
  "distinctDomains": 32,
  "fetchedAt": "2026-08-12T09:14:22.113Z",
  "fromCache": false
}
```

> Con số cụ thể sẽ khác mỗi lần chạy — GDELT là luồng tin tức trực tiếp.
> Điều cần đúng là `usable: true` và cả bốn chỉ số đều khác 0.

### 2.2 Keyword không có coverage

```bash
curl "http://localhost:3001/api/v1/market/gdelt/probe?keyword=glassmorphism"
```

```json
{ "keyword": "glassmorphism", "usable": false, "searchVolume": 0, ... }
```

**Đây là hành vi đúng, không phải lỗi.** GDELT lập chỉ mục tin tức thế giới;
từ vựng thiết kế không có bài báo nào viết về nó. Những từ như vậy thuộc về
bảng `Style`, không phải `Category.keywords`.

### 2.3 Xác nhận cache hoạt động

Gọi cùng một keyword hai lần liên tiếp và quan sát log của API:

```
[GDELT] "sustainable packaging" → volume=47 trend=58.31 ...   ← lần 1, ~6 giây
[GDELT] Cache hit for "sustainable packaging" (fetched ...)    ← lần 2, tức thì
```

Response lần hai phải có `"fromCache": true`. Ép lấy lại dữ liệu mới:

```bash
curl "http://localhost:3001/api/v1/market/gdelt/probe?keyword=sustainable+packaging&forceRefresh=true"
```

Kiểm tra trong DB:

```sql
SELECT keyword, "searchVolume", "marketScore", "distinctDomains", "fetchedAt"
FROM "GdeltSnapshot" ORDER BY "fetchedAt" DESC;
```

### 2.4 Xác nhận throttle hoạt động

Probe ba keyword khác nhau liên tiếp và bấm giờ:

```bash
time curl -s ".../gdelt/probe?keyword=electric+vehicles" > /dev/null
time curl -s ".../gdelt/probe?keyword=circular+economy" > /dev/null
time curl -s ".../gdelt/probe?keyword=mental+health" > /dev/null
```

Mỗi keyword tốn 3 request cách nhau `GDELT_THROTTLE_MS` (mặc định 2000ms), nên
kỳ vọng **khoảng 6 giây mỗi keyword**. Nếu nhanh hơn đáng kể, throttle không
hoạt động và bạn sẽ sớm bị rate-limit.

---

## Lớp 3 — Chạy discovery đầy đủ

```bash
curl -X POST "http://localhost:3001/api/v1/market/discover"
```

Với 17 keyword đã seed: ~51 request GDELT, **mất khoảng 100 giây**. Đừng tưởng
nó treo. Quan sát log, mỗi keyword sẽ có một dòng.

Nếu muốn bỏ qua cache và lấy dữ liệu mới hoàn toàn:

```bash
curl -X POST "http://localhost:3001/api/v1/market/discover?forceRefresh=true"
```

### Cấu trúc response

```json
{
  "message": "Commercial topic discovery complete.",
  "count": 14,
  "evaluated": 17,
  "topics": [
    {
      "title": "Sustainable Packaging (Sustainability - Minimalist)",
      "score": 63.1,
      "gdelt": {
        "keyword": "sustainable packaging",
        "articleCount": 486,
        "distinctDomains": 32,
        "fromCache": false
      }
    }
  ],
  "skipped": [
    { "keyword": "quantum computing", "reason": "No news coverage found in the recent window." }
  ]
}
```

### Cách đọc kết quả

| Hiện tượng | Ý nghĩa | Xử lý |
|---|---|---|
| `count` bằng `evaluated` | Mọi keyword đều phân giải được | Lý tưởng, không cần làm gì |
| Vài mục `skipped` với "No news coverage" | Keyword đó không phải chủ đề tin tức | Thay bằng chủ đề khác, dùng probe để thử trước |
| `aborted: true`, message "stopped early" | GDELT trả 429, bộ ngắt mạch đã ngắt sau 3 lần lỗi liên tiếp | Chờ hết cooldown (message ghi rõ bao nhiêu giây) rồi chạy lại. Keyword đã lấy được vẫn nằm trong cache nên lần sau chạy tiếp từ chỗ dở |
| Nhiều mục "no usable response" nhưng `aborted: false` | Lỗi rải rác chứ không phải rate-limit | Kiểm tra kết nối mạng |
| `count: 0`, tất cả skipped "already exists" | Discovery đã chạy trước đó | Đúng thiết kế, chống tạo trùng |
| HTTP 400 "No seed keywords configured" | Chưa seed, hoặc category có `keywords` rỗng | Chạy `pnpm seed:market` |
| HTTP 400 "Please seed categories and styles first" | Bảng Category hoặc Style rỗng | Chạy `pnpm seed:market` |

### Kiểm tra dữ liệu đã vào DB

```sql
SELECT title, "trendScore", "marketScore", "searchVolume", "competitionScore", score
FROM "MarketTopic" ORDER BY score DESC LIMIT 10;
```

**Cách phân biệt số thật với số random cũ.** Generator cũ luôn sinh trong các
khoảng cố định sau:

| Trường | Khoảng random cũ | Đặc trưng GDELT thật |
|---|---|---|
| `trendScore` | 60–100 | Thường 20–90, hay quanh 50 |
| `marketScore` | 70–100 | Rất phân tán, có thể xuống dưới 40 |
| `searchVolume` | 2000–17000 | **Thường chỉ 2–3 chữ số** |
| `competitionScore` | 10–50 | Thường 5–60, tuỳ độ phủ báo chí |

`searchVolume` là dấu hiệu rõ nhất. Nếu vẫn thấy hàng nghìn trên mọi dòng thì
đường random còn đang chạy — kiểm tra lại `market.service.ts` đã được thay chưa.

---

## Lớp 4 — Pipeline end-to-end

### 4.1 Cảnh báo quan trọng về ngưỡng điểm

`AutomationService` chỉ nhặt topic có `score >= 75`. Điểm GDELT thật **thấp hơn
đáng kể** so với điểm random cũ, vì random cũ cố tình thổi phồng (trend 60–100,
market 70–100). Chạy truy vấn này **trước** khi kích pipeline:

```sql
SELECT COUNT(*) FROM "MarketTopic" WHERE score >= 75 AND status = 'DISCOVERED';
```

Nếu trả về `0`, pipeline sẽ discover xong rồi đứng im — không có gì để xử lý.
Hai cách xử lý:

**Cách 1 — hạ ngưỡng** trong `apps/api/src/modules/automation/automation.service.ts`:

```ts
candidates = await this.prisma.marketTopic.findMany({
  where: {
    score: { gte: 75 },   // ← hạ xuống 55 hoặc 60 cho phù hợp thang điểm thật
    status: 'DISCOVERED',
  },
  take: 5,
});
```

**Cách 2 — trigger thẳng một topic**, bỏ qua bộ lọc điểm:

```sql
SELECT id, title, score FROM "MarketTopic" ORDER BY score DESC LIMIT 1;
```

```bash
curl -X POST http://localhost:3001/api/v1/automation/trigger \
  -H "Content-Type: application/json" \
  -d '{"topicId":"<uuid-vừa-lấy>"}'
```

### 4.2 Điều kiện tiên quyết khác

| Thành phần | Kiểm tra | Nếu thiếu |
|---|---|---|
| Redis | `docker-compose ps` | BullMQ không nhận job |
| `session.json` | File tồn tại ở `apps/api/` | Playwright bị Google chặn. Chạy `pnpm save-session` |
| `OPENAI_API_KEY` | Có trong `.env` | Bước trích xuất và QC rơi về **mock, luôn trả điểm 95** — kết quả vô nghĩa |

### 4.3 Theo dõi các mốc trong log

Chạy pipeline rồi lần theo từng bước:

```
[Pipeline] Step 1: Scanning categories and styles...
[Pipeline] Step 3: Triggering AI report generation for "..."
[Pipeline] Step 4: Enqueuing Playwright Google NotebookLM slide worker
[Job 1] Step 1: Navigating to https://notebooklm.google/
[Job 1] Step 6: Initiating file download
[Job 1] Successfully parsed N slides into category folder: ...
[AssetService] Beginning asset extraction for: ...
[QualityService] Quality check completed. Score: 95. Status updated to: COMPLETED
```

### 4.4 Kiểm tra đầu ra

```bash
ls -R apps/api/downloads/categories/
```

Mỗi topic phải có một thư mục chứa `research_report.md`, các file PNG slide, và
các file `*_transparent.png`.

```sql
SELECT title, status, metadata->'qualityAssessment'->>'finalScore' AS qc_score
FROM "Asset" ORDER BY "createdAt" DESC LIMIT 10;
```

> Nếu mọi asset đều có `qc_score = 95`, bạn đang chạy trên mock. Đó là giá trị
> cứng trong `getMockQualityResponse()`. Kiểm tra lại `OPENAI_API_KEY`.

---

## Kiểm thử giao diện

### A. Tự động (Playwright) — nhanh, không cần backend

```bash
cd apps/web
pnpm exec playwright install chromium   # chỉ cần chạy một lần
cd ../..
pnpm test:web
```

File `apps/web/playwright/e2e/market.spec.ts` chặn (intercept) toàn bộ lời gọi
tới API bằng `page.route()`, nên **không cần** NestJS, Postgres hay GDELT chạy.
Chín test chạy trong vài giây:

| Test | Xác nhận điều gì |
|---|---|
| renders the page and its seeded data | Trang `/market` render, có category và style |
| shows seed keywords as chips | Keyword hiện dưới dạng chip cyan |
| warns about a category that discovery will skip | Category không có keyword hiện cảnh báo hổ phách |
| sends keywords as an array | Form tách chuỗi theo dấu phẩy, trim khoảng trắng, bỏ phần tử rỗng, POST đúng mảng |
| reports counts after a successful discovery run | Banner báo `Scored 17 keyword(s) and created 14 topic(s), skipped 3.` |
| surfaces the reason when discovery creates nothing | `count: 0` hiện lý do skip đầu tiên thay vì báo thành công |
| explains the 400 when no category carries seed keywords | Lỗi 400 từ backend hiện đúng thông điệp |
| blocks discovery until a category and a style exist | Chặn ở phía client trước khi gọi API |
| renders real GDELT metrics on the topic row | Trend 58%, Demand 79%, Volume 47, Competition 21%, score 63.1 |

Chạy có giao diện để xem trực tiếp:

```bash
cd apps/web
pnpm exec playwright test --headed --project=chromium
pnpm exec playwright show-report      # xem báo cáo HTML sau khi chạy
```

### B. Test live với backend thật

Có một test riêng, mặc định bị bỏ qua, chạy discovery thật qua giao diện:

```bash
# Cần: docker-compose up -d, pnpm dev:api, pnpm dev:web
MARKET_LIVE=1 pnpm test:web
```

Test này chờ tới 4 phút vì một lượt discovery thật tốn ~100 giây.

### C. Kiểm tra thủ công

```bash
pnpm dev:web
```

Mở `http://localhost:3000/market`, đối chiếu theo danh sách sau:

| Vị trí | Kỳ vọng |
|---|---|
| Thẻ **Categories** | Mỗi category hiện keyword dạng chip cyan. Category chưa có keyword hiện dòng hổ phách "No seed keywords — skipped by discovery" |
| Form tạo category | Có ô "GDELT keywords, comma separated" kèm dòng nhắc không dùng từ vựng thiết kế |
| Nút **Discover New Topics** | Bấm xong hiện `Scored N keyword(s) and created M topic(s)`, **không** phải `found undefined topics` như bản cũ |
| Bảng topic | Cột Volume hiện số hai đến ba chữ số. Nếu thấy hàng nghìn là đường random còn sống |
| Nút recalculate (mũi tên xoay) | Bấm vào topic bất kỳ, điểm phải giữ nguyên vì các chỉ số đầu vào không đổi |

Mẹo khi kiểm tra thủ công: mở DevTools → tab Network, lọc `discover`. Response
phải có đủ bốn trường `count`, `evaluated`, `topics`, `skipped`. Mảng `skipped`
cho biết chính xác keyword nào bị loại và vì sao — đây là chỗ hữu ích nhất khi
kết quả không như mong đợi.

---

## Xử lý sự cố

**Mọi probe đều trả `usable: false`**
GDELT đang rate-limit. Nó báo bằng HTTP 200 với body rỗng chứ không phải 429,
nên trông giống như "không có dữ liệu". Chờ một phút, rồi tăng
`GDELT_THROTTLE_MS` lên 3000–4000.

**`Prisma model "GdeltSnapshot" is missing from the generated client`**
Chạy `pnpm db:generate` trong `apps/api`.

**Discovery chạy chậm**
Đúng như thiết kế. 3 request có throttle cho mỗi keyword là cái giá để không bị
chặn. Các keyword đã cache sẽ tức thì ở lần chạy sau.

**Chỉ số trông vô lý**
Đối chiếu trực tiếp với GDELT:

```
https://api.gdeltproject.org/api/v2/doc/doc?query=%22your+phrase%22&mode=timelinevolraw&format=json&timespan=3m
https://api.gdeltproject.org/api/v2/doc/doc?query=%22your+phrase%22&mode=tonechart&format=json&timespan=1w
```

**Muốn xoá cache để test lại từ đầu**

```sql
TRUNCATE TABLE "GdeltSnapshot";
DELETE FROM "MarketTopic";
```

---

## Biến môi trường liên quan

Xem `apps/api/.env.example` để biết mô tả đầy đủ.

| Biến | Mặc định | Dùng khi test |
|---|---|---|
| `GDELT_ENABLED` | `true` | Đặt `false` để chạy offline hoàn toàn |
| `GDELT_THROTTLE_MS` | `5000` | Tăng lên nếu vẫn bị 429 |
| `GDELT_COOLDOWN_MS` | `60000` | Thời gian ngừng hoàn toàn sau khi gặp 429 |
| `GDELT_MAX_CONSECUTIVE_FAILURES` | `3` | Số lỗi liên tiếp thì dừng cả lượt discovery |
| `GDELT_CACHE_TTL_HOURS` | `12` | Giảm xuống `0` để luôn lấy dữ liệu mới |
| `GDELT_MAX_RETRIES` | `3` | Giảm xuống `1` để test nhanh hơn |
| `GDELT_SATURATION_CEILING` | `150` | Số outlet coi là bão hoà hoàn toàn |

### Về giới hạn tốc độ của GDELT

GDELT báo quá tải bằng **hai cách khác nhau**, và cả hai đều đã được xử lý:

- **HTTP 429** — có thể kèm header `Retry-After`. Toàn bộ request tạm dừng theo
  `GDELT_COOLDOWN_MS` (hoặc theo `Retry-After` nếu server gửi).
- **HTTP 200 với body rỗng** — coi như không có dữ liệu sau khi đã retry hết.

Sau 3 keyword lỗi liên tiếp, cả lượt discovery dừng lại thay vì cố chạy tiếp.
Điều này quan trọng: mỗi keyword lỗi tốn khoảng 40 giây, nên nếu không dừng,
một danh sách 17 keyword sẽ mất hơn 10 phút để thất bại toàn bộ và càng khiến
rate-limit nặng thêm.

Vì cache lưu theo từng keyword, chạy lại nhiều lần là an toàn — mỗi lượt sẽ
tiếp tục từ chỗ dở và bỏ qua những keyword đã có dữ liệu.
