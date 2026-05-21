# KFC Franchise Supply Chain - Backend

Backend microservices cho hệ thống quản lý chuỗi cung ứng nhượng quyền KFC (OJT 2026), xây dựng bằng .NET 8.

## 1) Kiến trúc tổng quan

Project được tách theo hướng microservices, gồm **7 services** + Gateway:

| # | Service | Database | Mục đích | Dev Port | Docker Port |
|---|---------|----------|----------|----------|-------------|
| 1 | **Authentication** | OJTSP26_identity | Đăng nhập, phân quyền (Permission-based) | 5001 | 8081 |
| 2 | **System** | OJTSP26_system | Bảo trì hệ thống, maintenance mode, notification logs | 5008 | 8082 |
| 3 | **Purchase** | OJTSP26_purchase | Đặt hàng từ nhà cung cấp, PO, credit check, duyệt đơn | 5003 | 8083 |
| 4 | **Inventory** | OJTSP26_inventory | Kho hàng, batches, nhập/xuất kho, điều chỉnh tồn kho | 5004 | 8084 |
| 5 | **Finance** | OJTSP26_finance | Tài chính, credit, thanh toán, đánh giá rủi ro tín dụng | 5005 | 8085 |
| 6 | **Logistics** | OJTSP26_logistics | Vận chuyển, shipment, tracking, so sánh giá vận chuyển | 5006 | 8086 |
| 7 | **Notification** | OJTSP26_notification | Thông báo (InApp/Email), template, log gửi thành công/thất bại | 5007 | 8087 |

Các thành phần khác:

- `GatewayAPI` — API Gateway (port 8080)
- `BuildingBlocks` — thư viện dùng chung (CORS, Swagger, JWT, HealthCheck)
- `Databases` — scripts schema + sample data

## 2) Cấu trúc Clean Architecture

Mỗi service có 4 layer:

```
Services/<ServiceName>/
├── <ServiceName>.Domain/           # Entities, Constants
├── <ServiceName>.Application/      # DTOs, IRepositories, IServices, Services (MediatR)
├── <ServiceName>.Infrastructure/   # DbContext, EF Core Configurations, UnitOfWork
└── <ServiceName>.Presentation/     # Program.cs, Controllers, Authorization, Dockerfile
```

## 3) Yêu cầu môi trường

- .NET SDK 8.x
- SQL Server
- (Tuỳ chọn) Docker Desktop nếu muốn chạy bằng container

```bash
dotnet --version
```

## 4) Chạy project

### Cách A — Chạy từng service (không Docker)

```bash
# Gateway (port 5000)
dotnet run --project .\GatewayAPI\GatewayAPI.csproj

# 1. Authentication (port 5001)
dotnet run --project .\Services\Authentication\Authentication.Presentation\Authentication.Presentation.csproj

# 2. System (port 5008)
dotnet run --project .\Services\System\System.Presentation\System.Presentation.csproj

# 3. Purchase (port 5003)
dotnet run --project .\Services\Purchase\Purchase.Presentation\Purchase.Presentation.csproj

# 4. Inventory (port 5004)
dotnet run --project .\Services\Inventory\Inventory.Presentation\Inventory.Presentation.csproj

# 5. Finance (port 5005)
dotnet run --project .\Services\Finance\Finance.Presentation\Finance.Presentation.csproj

# 6. Logistics (port 5006)
dotnet run --project .\Services\Logistics\Logistics.Presentation\Logistics.Presentation.csproj

# 7. Notification (port 5007)
dotnet run --project .\Services\Notification\Notification.Presentation\Notification.Presentation.csproj
```

### Cách B — Chạy từng service với Hot Reload (Watch mode)
Sử dụng lệnh `dotnet watch run` để tự động build và reload lại app mỗi khi lưu file (Ctrl+S) mà không cần tắt đi bật lại.

```bash
# Gateway (port 5000)
dotnet watch run --project .\GatewayAPI\GatewayAPI.csproj

# 1. Authentication (port 5001)
dotnet watch run --project .\Services\Authentication\Authentication.Presentation\Authentication.Presentation.csproj

# 2. System (port 5008)
dotnet watch run --project .\Services\System\System.Presentation\System.Presentation.csproj

# 3. Purchase (port 5003)
dotnet watch run --project .\Services\Purchase\Purchase.Presentation\Purchase.Presentation.csproj

# 4. Inventory (port 5004)
dotnet watch run --project .\Services\Inventory\Inventory.Presentation\Inventory.Presentation.csproj

# 5. Finance (port 5005)
dotnet watch run --project .\Services\Finance\Finance.Presentation\Finance.Presentation.csproj

# 6. Logistics (port 5006)
dotnet watch run --project .\Services\Logistics\Logistics.Presentation\Logistics.Presentation.csproj

# 7. Notification (port 5007)
dotnet watch run --project .\Services\Notification\Notification.Presentation\Notification.Presentation.csproj
```

### Cách C — Chạy bằng Docker Compose (Khuyên dùng khi chạy tất cả)

```bash
# Chạy tất cả
docker compose up --build

# Chạy nền
docker compose up -d --build

# Dừng
docker compose down
```

## 5) Build và kiểm tra lỗi

### Build toàn bộ Solution (Khuyên dùng)
```bash
dotnet restore
dotnet clean
dotnet build .\KFCFranchiseSupplyChain.sln
```

### Build từng Service riêng lẻ
```bash
# Gateway
dotnet build .\GatewayAPI\GatewayAPI.csproj

# 1. Authentication
dotnet build .\Services\Authentication\Authentication.Presentation\Authentication.Presentation.csproj

# 2. System
dotnet build .\Services\System\System.Presentation\System.Presentation.csproj

# 3. Purchase
dotnet build .\Services\Purchase\Purchase.Presentation\Purchase.Presentation.csproj

# 4. Inventory
dotnet build .\Services\Inventory\Inventory.Presentation\Inventory.Presentation.csproj

# 5. Finance
dotnet build .\Services\Finance\Finance.Presentation\Finance.Presentation.csproj

# 6. Logistics
dotnet build .\Services\Logistics\Logistics.Presentation\Logistics.Presentation.csproj

# 7. Notification
dotnet build .\Services\Notification\Notification.Presentation\Notification.Presentation.csproj
```

## 6) Ocelot Gateway & JWT (Chuẩn hóa)

### 6.1 Ocelot theo môi trường

`GatewayAPI` sử dụng file Ocelot theo đúng `ASPNETCORE_ENVIRONMENT`:

- `Development` → `GatewayAPI/ocelot.Development.json`
- `Docker` → `GatewayAPI/ocelot.Docker.json`
- `Production` → `GatewayAPI/ocelot.Production.json`

> Gateway sẽ fail startup nếu thiếu file Ocelot tương ứng môi trường để tránh chạy sai route.

Các upstream route business đang theo chuẩn:

- `/api/v1/auth/{everything}`
- `/api/v1/system/{everything}`
- `/api/v1/purchase/{everything}`
- `/api/v1/inventory/{everything}`
- `/api/v1/finance/{everything}`
- `/api/v1/logistics/{everything}`
- `/api/v1/notification/{everything}`

Ví dụ gọi qua Gateway (Development):

```bash
GET http://localhost:5000/api/v1/inventory/products
Authorization: Bearer <access_token>
```

---

### 6.2 JWT chuẩn toàn hệ thống

Token được phát hành bởi `Authentication` service và validate tại Gateway + các service protected thông qua `BuildingBlocks/Security/JwtExtensions.cs`.

Thứ tự validate:

1. **Ưu tiên Key-based validation** (khuyến nghị hiện tại):
   - `Jwt:Key`
   - `Jwt:Issuer`
   - `Jwt:Audience`
2. Nếu không có `Jwt:Key` mới fallback sang:
   - `Jwt:Authority`
   - `Jwt:Audience`

Cấu hình JWT nên có trong `appsettings.*.json` (hoặc env vars):

| Key | Bắt buộc | Ý nghĩa |
|-----|----------|--------|
| `Jwt:Key` | Có (khuyến nghị) | Secret key để verify token HMAC |
| `Jwt:Issuer` | Có (khuyến nghị) | Issuer đã dùng khi phát hành token |
| `Jwt:Audience` | Có | Audience của access token (mặc định: `kfc-api`) |
| `Jwt:RequireHttpsMetadata` | Có | `false` cho Development/Docker |
| `Jwt:Authority` | Tùy chọn | Chỉ dùng khi chạy authority-based/OIDC |

---

### 6.3 Swagger, Healthcheck, và test đúng cách

- Swagger UI mỗi service: `/swagger`
- Healthcheck mỗi service: `/health`
- Gateway Swagger (`:5000/swagger`) chủ yếu hiển thị endpoint nội bộ của gateway/Ocelot, không phải toàn bộ downstream API business.

Để test business API đúng:

1. Login tại `Authentication` để lấy token.
2. Gọi trực tiếp service (ví dụ Inventory `:5004`) hoặc gọi qua Gateway (`:5000/api/v1/...`).
3. Luôn gửi header:

```bash
Authorization: Bearer <access_token>
```

---

### 6.4 Friendly error response

Hệ thống đã chuẩn hóa response lỗi tại `BuildingBlocks`:

- Exception-based: `GlobalExceptionMiddleware`
- Status-code-based (401/403/404): `MiddlewareExtensions` + JWT Events
- Error mapping trung tâm: `BuildingBlocks/Web/Errors/ErrorCatalog.cs`

Format trả về thống nhất theo `ApiResponse`.

## 7) Database scripts

Thư mục `Databases` bao gồm:

- `Databases/Database` — script tạo schema theo từng domain
- `Databases/Samples` — script dữ liệu mẫu

## 8) Quy trình Git & Husky (Pre-commit Hook)

Project đã được cấu hình **Husky.Net** để tự động kiểm soát chất lượng code trước khi đẩy lên server.

### Cách thức hoạt động
Mỗi khi bạn chạy lệnh `git commit` hoặc `git push`, Husky sẽ **tự động chèn ngang** và chạy lệnh: 
`dotnet build KFCFranchiseSupplyChain.sln --nologo --verbosity quiet`

Husky sẽ quét các file code C# (`**/*.cs`) và file Project (`**/*.csproj`) mà bạn vừa sửa. Nếu code bị lỗi cú pháp (Build Failed), lệnh commit sẽ tự động bị huỷ (abort) ngay lập tức để bảo vệ server.

### Các lệnh làm việc với Git & Husky

**1. Commit code như bình thường (Husky tự động chạy ngầm):**
```bash
git checkout -b feature/ten-nhanh
git add .
git commit -m "Mô tả thay đổi"
git push -u origin feature/ten-nhanh
```

**2. Tự chạy kiểm tra bằng tay (Test trước khi commit):**
Nếu bạn muốn tự kích hoạt để xem code mình có pass không trước khi gõ lệnh git:
```bash
dotnet husky run
```

**3. Bỏ qua kiểm tra (Bypass Hook):**
Nếu bạn đang code dở dang, Build đang báo lỗi tanh bành nhưng bạn VẪN MUỐN lưu tạm (commit) lên nhánh cá nhân để chuyển máy khác làm tiếp, hãy thêm cờ `--no-verify`:
```bash
git commit -m "Lưu tạm code chưa xong" --no-verify
```
