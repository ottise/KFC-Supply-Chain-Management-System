/*
  KFC Inventory — seed 9 nhóm ngành (đúng tên), 11 đơn vị UOM, 21 sản phẩm.

  Điều kiện: chạy sau script schema, các bảng [uom], [categories], [products] CHƯA có dòng
  (hoặc bạn đã xóa an toàn theo thứ tự FK: các bảng con của products -> products -> ...).

  Thứ tự: uom -> categories -> products (khớp FK trong schema).
*/

USE [OJTSP26_inventory];
GO

SET NOCOUNT ON;

/* Safety: tat het IDENTITY_INSERT neu lan truoc bi dung giua chung (SSMS cung session) */
BEGIN TRY SET IDENTITY_INSERT [dbo].[locations] OFF; END TRY BEGIN CATCH END CATCH;
BEGIN TRY SET IDENTITY_INSERT [dbo].[warehouses] OFF; END TRY BEGIN CATCH END CATCH;
BEGIN TRY SET IDENTITY_INSERT [dbo].[products] OFF; END TRY BEGIN CATCH END CATCH;
BEGIN TRY SET IDENTITY_INSERT [dbo].[categories] OFF; END TRY BEGIN CATCH END CATCH;
BEGIN TRY SET IDENTITY_INSERT [dbo].[uom] OFF; END TRY BEGIN CATCH END CATCH;
BEGIN TRY SET IDENTITY_INSERT [dbo].[customers] OFF; END TRY BEGIN CATCH END CATCH;
BEGIN TRY SET IDENTITY_INSERT [dbo].[suppliers] OFF; END TRY BEGIN CATCH END CATCH;

/* Reset data de chay lai 1 lan khong loi */
EXEC sp_MSforeachtable 'ALTER TABLE ? NOCHECK CONSTRAINT ALL';
EXEC sp_MSforeachtable 'DELETE FROM ?';

DECLARE @sqlReset NVARCHAR(MAX) = N'';
SELECT @sqlReset = @sqlReset + N'DBCC CHECKIDENT (''' 
    + QUOTENAME(OBJECT_SCHEMA_NAME(object_id)) + N'.' + QUOTENAME(name) 
    + N''', RESEED, 0);'
FROM sys.tables
WHERE OBJECTPROPERTY(object_id, 'TableHasIdentity') = 1;
EXEC sp_executesql @sqlReset;

EXEC sp_MSforeachtable 'ALTER TABLE ? WITH CHECK CHECK CONSTRAINT ALL';

SET IDENTITY_INSERT [dbo].[uom] ON;
INSERT INTO [dbo].[uom] (id, name, category, conversion_ratio, is_base_unit) VALUES
(1,  N'Kg',     N'Weight', 1,     1),
(2,  N'G',      N'Weight', 0.001, 0),
(3,  N'L',      N'Volume', 1,     1),
(4,  N'ML',     N'Volume', 0.001, 0),
(5,  N'Can 5L',  N'Volume', 5,     0),
(6,  N'Can 18L', N'Volume', 18,    0),
(7,  N'Cái',    N'Count',  1,     1),
(8,  N'Gói',    N'Count',  1,     0),
(9,  N'Thùng',  N'Count',  1,     0),
(10, N'Cuộn',   N'Count',  1,     0),
(11, N'Bộ',     N'Count',  1,     0);
SET IDENTITY_INSERT [dbo].[uom] OFF;

SET IDENTITY_INSERT [dbo].[categories] ON;
INSERT INTO [dbo].[categories] (id, name, parent_id, is_active) VALUES
 (1, N'Thịt & Gia Cầm',   NULL, 1),
 (2, N'Hải Sản',         NULL, 1),
 (3, N'Rau Củ Quả',      NULL, 1),
 (4, N'Gia Vị & Sốt',    NULL, 1),
 (5, N'Đồ Uống',         NULL, 1),
 (6, N'Bánh & Đồ Ngọt',  NULL, 1),
 (7, N'Vật Tư Vệ Sinh',  NULL, 1),
 (8, N'Đồ Dùng Một Lần', NULL, 1),
 (9, N'Công Cụ Dụng Cụ', NULL, 1);
SET IDENTITY_INSERT [dbo].[categories] OFF;

SET IDENTITY_INSERT [dbo].[products] ON;
INSERT INTO [dbo].[products]
    (id, name, code, product_type, base_uom_id, purchase_uom_id, category_id, sale_price, stock_price, is_active, created_at, updated_at)
VALUES
    /* Thit & Gia Cam — 3 */
    (1,  N'Gà Miếng Original',           N'KFC-RAW-MEA-GMO-0001', N'Nguyên Liệu Thô', 1, 2,  1, 120000.00,  90000.00,  1, SYSDATETIME(), SYSDATETIME()),
    (2,  N'Gà Miếng Cay',                N'KFC-RAW-MEA-GMC-0001', N'Nguyên Liệu Thô', 1, 2,  1, 125000.00,  95000.00,  1, SYSDATETIME(), SYSDATETIME()),
    (3,  N'Gà Viên Popcorn',             N'KFC-RAW-MEA-GVP-0001', N'Nguyên Liệu Thô', 1, 2,  1, 110000.00,  82000.00,  1, SYSDATETIME(), SYSDATETIME()),
    /* Hai San — 2 */
    (4,  N'Cá Miếng Giòn',               N'KFC-RAW-SEA-CMG-0001', N'Nguyên Liệu Thô', 1, 2,  2, 190000.00, 150000.00, 1, SYSDATETIME(), SYSDATETIME()),
    (5,  N'Tôm Viên Giòn',               N'KFC-RAW-SEA-TVG-0001', N'Nguyên Liệu Thô', 1, 2,  2, 230000.00, 185000.00, 1, SYSDATETIME(), SYSDATETIME()),
    /* Rau Cu Qua — 3 */
    (6,  N'Salad Bắp Cải',               N'KFC-RAW-VEG-SBC-0001', N'Nguyên Liệu Thô', 1, 2,  3,  35000.00,  26000.00, 1, SYSDATETIME(), SYSDATETIME()),
    (7,  N'Cà Chua Lát Tươi',           N'KFC-RAW-VEG-CCLT-0001', N'Nguyên Liệu Thô', 1, 2,  3,  30000.00,  22000.00, 1, SYSDATETIME(), SYSDATETIME()),
    (8,  N'Dưa Leo Thái',                N'KFC-RAW-VEG-DLT-0001', N'Nguyên Liệu Thô', 1, 2,  3,  32000.00,  24000.00, 1, SYSDATETIME(), SYSDATETIME()),
    /* Gia Vi & Sot — 3 */
    (9,  N'Bột Tẩm Gà Original',         N'KFC-RAW-SPI-BTGO-0001', N'Nguyên Liệu Thô', 1, 8,  4, 150000.00, 110000.00, 1, SYSDATETIME(), SYSDATETIME()),
    (10, N'Sốt Cay Hot Spicy',           N'KFC-RAW-SPI-SCHS-0001', N'Nguyên Liệu Thô', 3, 5,  4, 180000.00, 135000.00, 1, SYSDATETIME(), SYSDATETIME()),
    (11, N'Dầu Chiên Chuyên Dụng',       N'KFC-RAW-SPI-DCCD-0001', N'Nguyên Liệu Thô', 3, 6,  4,  90000.00,  70000.00, 1, SYSDATETIME(), SYSDATETIME()),
    /* Do Uong — 2 */
    (12, N'Siro Pepsi Gốc',             N'KFC-RAW-BEV-SPG-0001', N'Nguyên Liệu Thô', 3, 6,  5, 160000.00, 120000.00, 1, SYSDATETIME(), SYSDATETIME()),
    (13, N'Siro 7Up Gốc',               N'KFC-RAW-BEV-S7G-0001', N'Nguyên Liệu Thô', 3, 6,  5, 155000.00, 116000.00, 1, SYSDATETIME(), SYSDATETIME()),
    /* Banh & Do Ngot — 2 */
    (14, N'Bánh Burger Mè',             N'KFC-PKG-BAK-BBM-0001', N'Bao Bì', 7, 9,  6,   6000.00,   4500.00, 1, SYSDATETIME(), SYSDATETIME()),
    (15, N'Bánh Quy Socola',            N'KFC-PKG-BAK-BQS-0001', N'Bao Bì', 7, 8,  6,   7000.00,   5200.00, 1, SYSDATETIME(), SYSDATETIME()),
    /* Vat Tu Ve Sinh — 2 */
    (16, N'Nước Rửa Tay Bếp',          N'KFC-RAW-CLN-NRTB-0001', N'Nguyên Liệu Thô', 3, 5,  7, 250000.00, 190000.00, 1, SYSDATETIME(), SYSDATETIME()),
    (17, N'Nước Lau Sàn Bếp',          N'KFC-RAW-CLN-NLSB-0001', N'Nguyên Liệu Thô', 3, 5,  7, 180000.00, 135000.00, 1, SYSDATETIME(), SYSDATETIME()),
    /* Do Dung Mot Lan — 2 */
    (18, N'Hộp Giấy Mang Về',          N'KFC-PKG-DIS-HGMV-0001', N'Bao Bì', 7, 9,  8,   3000.00,   2200.00, 1, SYSDATETIME(), SYSDATETIME()),
    (19, N'Khăn Giấy Cuộn Lớn',        N'KFC-PKG-DIS-KGCL-0001', N'Bao Bì', 7, 10, 8,  25000.00, 19000.00, 1, SYSDATETIME(), SYSDATETIME()),
    /* Cong Cu Dung Cu — 2 */
    (20, N'Khay Chiên Áp Suất',        N'KFC-EQP-EQU-KCAS-0001', N'Thiết Bị', 11, 11, 9, 1500000.00, 1200000.00, 1, SYSDATETIME(), SYSDATETIME()),
    (21, N'Kẹp Gà Inox',               N'KFC-EQP-EQU-KGI-0001', N'Thiết Bị', 11, 11, 9,  220000.00, 160000.00, 1, SYSDATETIME(), SYSDATETIME());
SET IDENTITY_INSERT [dbo].[products] OFF;

/* --- Warehouses (6 kho) --- */
SET IDENTITY_INSERT [dbo].[warehouses] ON;
INSERT INTO [dbo].[warehouses]
    (id, warehouse_code, name, address, phone, email, warehouse_type, area_sqm, is_active, notes, manager_id)
VALUES
    (1, N'KFC_WH01', N'Kho KFC Hồ Chí Minh',             N'Số 12, Đường Số 7, Phường Bình Trị Đông B, Quận Bình Tân, Hồ Chí Minh', N'0900000001', N'wh01@kfc.local', N'Kho Tổng',     5200, 1, N'', 2),
    (2, N'KFC_WH02', N'Kho KFC Hà Nội',                  N'Số 88, Đường Tam Trinh, Phường Mai Động, Quận Hoàng Mai, Hà Nội',          N'0900000002', N'wh02@kfc.local', N'Kho Tổng',     4100, 1, N'', 3),
    (3, N'KFC_WH03', N'Kho KFC Đà Nẵng',                 N'Lô A2, Đường Số 3, Khu Công Nghiệp Hòa Khánh, Quận Liên Chiểu, Đà Nẵng',   N'0900000003', N'wh03@kfc.local', N'Kho Tổng',     2800, 1, N'', 4),
    (4, N'KFC_WH04', N'Kho KFC Bình Dương',              N'Số 25, Đường DT743, Phường Tân Đông Hiệp, Thành Phố Dĩ An, Bình Dương',    N'0900000004', N'wh04@kfc.local', N'Kho Tổng',     3000, 1, N'', 2),
    (5, N'KFC_WH05', N'Kho KFC Đồng Nai',                N'Số 11, Đường Đồng Khởi, Phường Trảng Dài, Thành Phố Biên Hòa, Đồng Nai',   N'0900000005', N'wh05@kfc.local', N'Kho Tổng',     2600, 1, N'', 3),
    (6, N'KFC_WH06', N'Kho KFC Cần Thơ',                 N'Số 09, Đường 30 Tháng 4, Phường Xuân Khánh, Quận Ninh Kiều, Cần Thơ',      N'0900000006', N'wh06@kfc.local', N'Kho Tổng',     2400, 1, N'', 4),
    (7, N'VWH_PURCHASE', N'Kho Ảo Mua Hàng',             N'', N'', N'', N'Kho Ảo', 0, 1, N'Kho hệ thống cho mua hàng', 0),
    (8, N'VWH_SALE',     N'Kho Ảo Bán Hàng',             N'', N'', N'', N'Kho Ảo', 0, 1, N'Kho hệ thống cho bán hàng', 0),
    (9, N'VWH_SCRAP',    N'Kho Ảo Hao Hụt',              N'', N'', N'', N'Kho Ảo', 0, 1, N'Kho hệ thống cho hao hụt', 0);
SET IDENTITY_INSERT [dbo].[warehouses] OFF;

/* --- Locations (mỗi kho 3–4 location) --- */
SET IDENTITY_INSERT [dbo].[locations] ON;
INSERT INTO [dbo].[locations]
    (id, name, type, parent_id, is_active, warehouse_id)
VALUES
    -- WH01
    (1,  N'Khu Nhận Hàng Hồ Chí Minh A1',          N'Nhận Hàng',  NULL, 1, 1),
    (2,  N'Khu Lưu Kho Hồ Chí Minh A2',            N'Lưu Kho',    NULL, 1, 1),
    (3,  N'Khu Xuất Hàng Hồ Chí Minh A3',          N'Xuất Hàng',  NULL, 1, 1),
    -- WH02
    (4,  N'Khu Nhận Hàng Hà Nội B1',               N'Nhận Hàng',  NULL, 1, 2),
    (5,  N'Khu Lưu Kho Hà Nội B2',                 N'Lưu Kho',    NULL, 1, 2),
    (6,  N'Khu Xuất Hàng Hà Nội B3',               N'Xuất Hàng',  NULL, 1, 2),
    -- WH03
    (7,  N'Khu Nhận Hàng Đà Nẵng C1',              N'Nhận Hàng',  NULL, 1, 3),
    (8,  N'Khu Lưu Kho Đà Nẵng C2',                N'Lưu Kho',    NULL, 1, 3),
    (9,  N'Khu Xuất Hàng Đà Nẵng C3',              N'Xuất Hàng',  NULL, 1, 3),
    -- WH04
    (10, N'Khu Nhận Hàng Bình Dương D1',           N'Nhận Hàng',  NULL, 1, 4),
    (11, N'Khu Lưu Kho Bình Dương D2',             N'Lưu Kho',    NULL, 1, 4),
    (12, N'Khu Xuất Hàng Bình Dương D3',           N'Xuất Hàng',  NULL, 1, 4),
    -- WH05
    (13, N'Khu Nhận Hàng Đồng Nai E1',             N'Nhận Hàng',  NULL, 1, 5),
    (14, N'Khu Lưu Kho Đồng Nai E2',               N'Lưu Kho',    NULL, 1, 5),
    (15, N'Khu Xuất Hàng Đồng Nai E3',             N'Xuất Hàng',  NULL, 1, 5),
    -- WH06
    (16, N'Khu Nhận Hàng Cần Thơ F1',              N'Nhận Hàng',  NULL, 1, 6),
    (17, N'Khu Lưu Kho Cần Thơ F2',                N'Lưu Kho',    NULL, 1, 6),
    (18, N'Khu Xuất Hàng Cần Thơ F3',              N'Xuất Hàng',  NULL, 1, 6),
    (19, N'Khu Nguồn Mua Hàng Ảo',                 N'Ảo Mua Hàng',NULL, 1, 7),
    (20, N'Khu Khách Hàng Ảo',                     N'Ảo Bán Hàng',NULL, 1, 8),
    (21, N'Khu Hao Hụt Ảo',                        N'Ảo Hao Hụt', NULL, 1, 9);
SET IDENTITY_INSERT [dbo].[locations] OFF;

/* --- Customers (8) --- */
SET IDENTITY_INSERT [dbo].[customers] ON;
INSERT INTO [dbo].[customers]
    (id, customer_name, phone, email, address, is_active, created_at, updated_at)
VALUES
    (1,  N'KêFC Đức Tuấn',         N'0901110001', N'vuductuan@customer.vn',         N'Quận Bình Thạnh TP Hồ Chí Minh',                1, SYSDATETIME(), SYSDATETIME()),
    (2,  N'KêFC Quốc Thái',        N'0901110002', N'duongquocthai@customer.vn',     N'Quận Gò Vấp TP Hồ Chí Minh',                    1, SYSDATETIME(), SYSDATETIME()),
    (3,  N'KêFC Diệu Vinh',        N'0901110003', N'luongdieuvinh@customer.vn',     N'Quận 7 TP Hồ Chí Minh',                         1, SYSDATETIME(), SYSDATETIME()),
    (4,  N'KêFC Gia Bảo',          N'0901110004', N'nguyentrangiabao@customer.vn',  N'Thành Phố Thủ Đức TP Hồ Chí Minh',              1, SYSDATETIME(), SYSDATETIME()),
    (5,  N'KêFC Quỳnh Chi',        N'0901110005', N'nguyenlequynhchi@customer.vn',  N'Quận Thanh Xuân Hà Nội',                        1, SYSDATETIME(), SYSDATETIME()),
    (6,  N'KêFC Huỳnh Đạt',        N'0901110006', N'nguyenhuynhdat@customer.vn',    N'Quận Hải Châu Đà Nẵng',                         1, SYSDATETIME(), SYSDATETIME()),
    (7,  N'KêFC Thượng Hào',       N'0901110007', N'nguyenthuonghao@customer.vn',   N'Thành Phố Biên Hòa Đồng Nai',                   1, SYSDATETIME(), SYSDATETIME()),
    (8,  N'KêFC Xuân Sơn',         N'0901110008', N'nguyenphamxuanson@customer.vn', N'Quận Ninh Kiều Cần Thơ',                        1, SYSDATETIME(), SYSDATETIME());
SET IDENTITY_INSERT [dbo].[customers] OFF;

/* --- Suppliers (10) --- */
SET IDENTITY_INSERT [dbo].[suppliers] ON;
INSERT INTO [dbo].[suppliers]
    (id, name, contact_person, phone, email, address, is_active, created_at)
VALUES
    (1,  N'CP Foods',           N'Nguyễn Anh Tuấn',  N'0912001001', N'cpfoods@supplier.vn',        N'KCN Sóng Thần Bình Dương',                     1, SYSDATETIME()),
    (2,  N'Biển Đông',          N'Trần Quốc Huy',    N'0912001002', N'biendong@supplier.vn',       N'KCN Dịch Vụ Thủy Sản Nhà Bè TP Hồ Chí Minh',   1, SYSDATETIME()),
    (3,  N'Rau Sạch Việt',      N'Phạm Minh Khoa',   N'0912001003', N'rausachviet@supplier.vn',    N'Thành Phố Đà Lạt Lâm Đồng',                    1, SYSDATETIME()),
    (4,  N'Gia Vị Nam Á',       N'Lê Hoàng Nam',     N'0912001004', N'giavinama@supplier.vn',      N'KCN Tân Tạo Bình Tân TP Hồ Chí Minh',          1, SYSDATETIME()),
    (5,  N'Đồ Uống Sài Gòn',    N'Võ Thanh Bình',    N'0912001005', N'douongsaigon@supplier.vn',   N'KCN Vĩnh Lộc Bình Chánh TP Hồ Chí Minh',       1, SYSDATETIME()),
    (6,  N'Bánh Việt Phát',     N'Ngô Đức Long',     N'0912001006', N'banhvietphat@supplier.vn',   N'Thành Phố Dĩ An Bình Dương',                   1, SYSDATETIME()),
    (7,  N'Vệ Sinh An Phúc',    N'Đặng Thành Công',  N'0912001007', N'vesinhanphuc@supplier.vn',   N'Quận 12 TP Hồ Chí Minh',                       1, SYSDATETIME()),
    (8,  N'Bao Bì Đại Thành',   N'Phan Nhật Quang',  N'0912001008', N'baobidaithanh@supplier.vn',  N'Thành Phố Biên Hòa Đồng Nai',                  1, SYSDATETIME()),
    (9,  N'Inox Minh Tâm',      N'Bùi Quốc Đạt',     N'0912001009', N'inoxminhtam@supplier.vn',    N'Quận Bình Tân TP Hồ Chí Minh',                 1, SYSDATETIME()),
    (10, N'Logistics Miền Nam', N'Hoàng Văn Sơn',    N'0912001010', N'logisticsmn@supplier.vn',    N'Quận 7 TP Hồ Chí Minh',                        1, SYSDATETIME());
SET IDENTITY_INSERT [dbo].[suppliers] OFF;

PRINT N'Hoan tat: 9 categories, 11 UOM, 21 products, 9 warehouses, 21 locations, 8 customers, 10 suppliers.';
GO


SET NOCOUNT ON;
/* Thêm sub-locations (khu nhỏ) - KHÔNG chỉ định id */
INSERT INTO [dbo].[locations]
    ([name], [type], [parent_id], [is_active], [warehouse_id])
VALUES
    -- WH01 con của Lưu Kho A2 (id=2)
    (N'Ô Kệ Hồ Chí Minh A2-01', N'Kệ Nhỏ', 2, 1, 1),
    (N'Ô Kệ Hồ Chí Minh A2-02', N'Kệ Nhỏ', 2, 1, 1),
    -- WH02 con của Lưu Kho B2 (id=5)
    (N'Ô Kệ Hà Nội B2-01', N'Kệ Nhỏ', 5, 1, 2),
    (N'Ô Kệ Hà Nội B2-02', N'Kệ Nhỏ', 5, 1, 2),
    -- WH03 con của Lưu Kho C2 (id=8)
    (N'Ô Kệ Đà Nẵng C2-01', N'Kệ Nhỏ', 8, 1, 3),
    (N'Ô Kệ Đà Nẵng C2-02', N'Kệ Nhỏ', 8, 1, 3),
    -- WH04 con của Lưu Kho D2 (id=11)
    (N'Ô Kệ Bình Dương D2-01', N'Kệ Nhỏ', 11, 1, 4),
    (N'Ô Kệ Bình Dương D2-02', N'Kệ Nhỏ', 11, 1, 4),
    -- WH05 con của Lưu Kho E2 (id=14)
    (N'Ô Kệ Đồng Nai E2-01', N'Kệ Nhỏ', 14, 1, 5),
    (N'Ô Kệ Đồng Nai E2-02', N'Kệ Nhỏ', 14, 1, 5),
    -- WH06 con của Lưu Kho F2 (id=17)
    (N'Ô Kệ Cần Thơ F2-01', N'Kệ Nhỏ', 17, 1, 6),
    (N'Ô Kệ Cần Thơ F2-02', N'Kệ Nhỏ', 17, 1, 6);
GO