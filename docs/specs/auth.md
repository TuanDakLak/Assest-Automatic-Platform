# Auth Module

> Đăng nhập và phân quyền. Hiện chưa có gì.

**Vị trí**: Hỗ trợ · `apps/api/src/modules/auth/`

---

## Mục đích

Xác thực người dùng và bảo vệ các endpoint. Đây là lỗ hổng lớn nhất của hệ thống
hiện tại: **mọi endpoint đều mở, không cần đăng nhập**.

## Model User

Đã có sẵn trong Prisma schema:

| Trường | Ghi chú |
|---|---|
| `email` | Unique |
| `password` | Đang lưu **chữ thường**, chưa hash |
| `name` | Tuỳ chọn |
| `role` | Mặc định `"user"` |

## Việc cần làm

| Nhiệm vụ | Chi tiết |
|---|---|
| Hash mật khẩu | bcrypt hoặc argon2. `JWT_SECRET` đã có trong `.env` nhưng chưa dùng |
| `POST /auth/register` | Tạo tài khoản |
| `POST /auth/login` | Trả access token |
| `POST /auth/refresh` | Làm mới token |
| `JwtAuthGuard` | Chặn endpoint chưa xác thực |
| `RolesGuard` | Phân biệt `user` và `admin` |

## Ảnh hưởng tới các module khác

Khi có Auth thật, cần sửa theo:

- `AssetService.create()` đang lấy `userId` bằng `findFirst()` — phải lấy từ token
- `AssetService.extractAsset()` tự tạo user hệ thống với mật khẩu để nguyên dạng
  chữ thường khi DB rỗng — phải bỏ, thay bằng một service account có sẵn
- Mọi controller cần gắn guard

## API hiện tại

| Method | Đường dẫn | Việc |
|---|---|---|
| `POST/GET/PUT/DELETE` | `/auth[/:id]` | CRUD sinh tự động, không phải auth thật |

## Trạng thái

**Khung rỗng.** Service chỉ chuyển tiếp sang repository, mà repository trả dữ liệu
cứng. Không có JWT, không hash, không guard.
