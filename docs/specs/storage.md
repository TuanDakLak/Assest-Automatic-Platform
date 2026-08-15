# Storage Module

> Quản lý file asset trên đĩa.

**Vị trí**: Hỗ trợ · `apps/api/src/modules/storage/`

---

## Mục đích

Hiện tại file được ghi rải rác bởi nhiều module: Research ghi Markdown, NotebookLM
ghi .pptx, Slides ghi PNG, Figma ghi PNG trong suốt. Module này ra đời để gom việc
đó về một chỗ.

## Cấu trúc thư mục

```
downloads/
├── temp_research_<jobId>.md          (tạm, xoá sau khi xong)
└── categories/
    └── <category>/
        └── <topic>/
            ├── research_report.md
            ├── <file>_slide_1.png
            └── <file>_slide_1_transparent.png
```

Tên thư mục chuẩn hoá: viết thường, thay ký tự không phải chữ số bằng gạch dưới.

## Việc cần làm

| Nhiệm vụ | Mô tả |
|---|---|
| Đọc/ghi tập trung | Mọi module gọi qua đây thay vì tự dùng `fs` |
| Dọn file tạm | Xoá `temp_research_*.md` cũ, hiện chỉ xoá khi job chạy xong bình thường |
| Thống kê dung lượng | Cho Dashboard biết đang chiếm bao nhiêu đĩa |
| Trừu tượng hoá backend | Sau này chuyển sang S3 mà không sửa các module khác |

## API

| Method | Đường dẫn | Việc |
|---|---|---|
| `POST/GET/PUT/DELETE` | `/storage[/:id]` | CRUD |

## Trạng thái

**Khung rỗng.** Repository trả `{ id: 'mock-id' }`, `findAll()` trả mảng rỗng.
Chưa module nào gọi tới. Việc ghi file hiện do từng module tự làm bằng `fs`.
