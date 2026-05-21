# Database Management - KFC Franchise Supply Chain

Hệ thống quản lý cơ sở dữ liệu cho dự án KFC Franchise Supply Chain Management System.

## 📂 Cấu trúc thư mục (Directory Structure)

Thư mục `Databases` được tổ chức theo các nhóm chức năng để thuận tiện cho quá trình cài đặt và bảo trì:

```text
Databases/
├── Schema/               # Định nghĩa cấu trúc bảng (Table Schemas)
│   ├── 01_identity.sql   # Schema cho database Identity (Auth & Phân quyền)
│   └── 02_inventory.sql  # Schema cho database Inventory (Kho & Sản phẩm)
├── Seed/                 # Dữ liệu mẫu ban đầu (Sample/Seed Data)
│   ├── 01_identity-data.sql    # Dữ liệu tài khoản, phân quyền mẫu
│   └── 02_inventory-data.sql   # Dữ liệu kho, sản phẩm, địa điểm mẫu
├── Utils/                # Công cụ hỗ trợ (Utilities)
│   ├── 01-reset-identity       # Script reset toàn bộ dữ liệu database Identity
│   └── 02_reset-inventory.sql  # Script reset toàn bộ dữ liệu database Inventory
└── README.md             # Hướng dẫn này
```

---

## 🚀 Hướng dẫn thiết lập (Setup Guide)

Để khởi tạo hệ thống cơ sở dữ liệu từ đầu, vui lòng thực hiện theo đúng thứ tự các bước sau:

### Bước 1: Khởi tạo cấu trúc Database (Schemas)

Mở SQL Server Management Studio (SSMS) và chạy các file trong thư mục `Schema/`:

1. Chạy `01_identity.sql` để tạo database `OJTSP26_identity`.
2. Chạy `02_inventory.sql` để tạo database `OJTSP26_inventory`.

### Bước 2: Nạp dữ liệu mẫu (Seed Data)

Sau khi đã có cấu trúc database, hãy chạy các file trong thư mục `Seed/`:

1. Chạy `01_identity-data.sql` để nạp danh sách tài khoản, vai trò mặc định.
2. Chạy `02_inventory-data.sql` để nạp dữ liệu kho bãi, sản phẩm mẫu (đã bao gồm phân loại `Thiết Bị`, `Nguyên Liệu Thô`, `Bao Bì`).

---

## 🛠️ Công cụ hỗ trợ (Database Utilities)

Nếu muốn làm sạch dữ liệu trong quá trình phát triển (reset database về trạng thái trắng), hãy sử dụng các script trong thư mục `Utils/`:

- **Reset Identity**: Chạy file `01-reset-identity` để xoá sạch Users, Roles và reset `IDENTITY` về 0 cho database `OJTSP26_identity`.
- **Reset Inventory**: Chạy file `02_reset-inventory.sql` để xoá sạch Products, Warehouses, Logs và reset `IDENTITY` về 0 cho database `OJTSP26_inventory`.

---

## ⚠️ Lưu ý quan trọng (Important Notes)

1. **Thứ tự thực hiện**: Luôn tuân thủ thứ tự `Schema` -> `Seed`.
2. **Database Names**: Đảm bảo các database được đặt tên chính xác là `OJTSP26_identity` và `OJTSP26_inventory` (Scripts đã có sẵn lệnh `USE [DatabaseName]`).
3. **Unicode**: Các dữ liệu mẫu sử dụng tiếng Việt có dấu, vui lòng đảm bảo file được lưu với encoding phù hợp (thường là UTF-8 with BOM) để tránh lỗi hiển thị.
4. **Foreign Keys**: Các script reset trong `Utils/` đã bao gồm lệnh tắt/bật Ràng buộc khoá ngoại để tránh lỗi khi xoá dữ liệu có quan hệ.

---

_Cập nhật lần cuối: 27/03/2026_
