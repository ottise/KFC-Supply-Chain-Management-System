USE [OJTSP26_identity]
GO

SET NOCOUNT ON;

/* Reset du lieu truoc khi seed */
DELETE FROM [dbo].[Users];
DBCC CHECKIDENT ('[dbo].[Users]', RESEED, 0);

DELETE FROM [dbo].[Roles];
DBCC CHECKIDENT ('[dbo].[Roles]', RESEED, 0);

SET IDENTITY_INSERT [dbo].[Roles] ON

INSERT [dbo].[Roles]
    ([id], [name])
VALUES
    (1, N'Admin')
INSERT [dbo].[Roles]
    ([id], [name])
VALUES
    (2, N'Manager')
INSERT [dbo].[Roles]
    ([id], [name])
VALUES
    (3, N'Staff')
SET IDENTITY_INSERT [dbo].[Roles] OFF
GO
SET IDENTITY_INSERT [dbo].[Users] ON

INSERT [dbo].[Users]
    ([id], [username], [email], [password_hash], [role_id], [status], [created_at], [fullname], [phone], [manager_id], [is_active_mail])
VALUES
    (1, N'Admin',            N'admin@warehouse-dev.com',         N'FaiaXCU0/AcluTvYEjSkOu9xibAGLcV9h7sXU3ZPmng=', 1, N'Active', CAST(N'2026-03-11T11:13:29.760' AS DateTime), N'Nguyen Tran Gia Bao', N'0888109330', NULL, 1)
INSERT [dbo].[Users]
    ([id], [username], [email], [password_hash], [role_id], [status], [created_at], [fullname], [phone], [manager_id], [is_active_mail])
VALUES
    (2, N'nguyenlinh',       N'linh.nguyen@logisticsvn.com',     N'KUeOyCLaeyI3T6jAI1nxMK3u9ccJVMJ7onoXhSitRfE=', 2, N'Active', CAST(N'2026-03-11T11:16:33.777' AS DateTime), N'Nguyen Thi Linh', N'0915588775', NULL, 1)
INSERT [dbo].[Users]
    ([id], [username], [email], [password_hash], [role_id], [status], [created_at], [fullname], [phone], [manager_id], [is_active_mail])
VALUES
    (3, N'lethithao',        N'thao.le@storagecenter.vn',        N'krldZpcY4DFmA2wCRCn9NAxvQ+BnvEZO2nx/zhNGxQw=', 2, N'Active', CAST(N'2026-03-11T11:17:16.387' AS DateTime), N'Le Thi Thao', N'0947755577', NULL, 1)
INSERT [dbo].[Users]
    ([id], [username], [email], [password_hash], [role_id], [status], [created_at], [fullname], [phone], [manager_id], [is_active_mail])
VALUES
    (4, N'dangthuyhang',     N'hang.dang@warehousehub.vn',       N'eUr4Y5T+oHkqfgiiQoFwppuQ6tBF6whUU4daXW4swIo=', 2, N'Active', CAST(N'2026-03-11T11:18:24.180' AS DateTime), N'Dang Thuy Hang', N'0926688662', NULL, 1)
INSERT [dbo].[Users]
    ([id], [username], [email], [password_hash], [role_id], [status], [created_at], [fullname], [phone], [manager_id], [is_active_mail])
VALUES
    (5, N'tranquangminh',    N'minh.tran@warehousehub.vn',       N'tWWNTWEdJyvxL1FSLSamG+FhMUOWrvg6n/n912wQLek=', 3, N'Active', CAST(N'2026-03-11T11:16:23.033' AS DateTime), N'Tran Quang Minh', N'0906688668', 2, 1)
INSERT [dbo].[Users]
    ([id], [username], [email], [password_hash], [role_id], [status], [created_at], [fullname], [phone], [manager_id], [is_active_mail])
VALUES
    (6, N'phamvanhung',      N'hung.pham@distributionhub.vn',    N'wlYf4LyGkr87hhkyvQ7/zugXDczWiqb1L3TAR5C7h2s=', 3, N'Active', CAST(N'2026-03-11T11:16:39.127' AS DateTime), N'Pham Van Hung', N'0938866688', 2, 1)
INSERT [dbo].[Users]
    ([id], [username], [email], [password_hash], [role_id], [status], [created_at], [fullname], [phone], [manager_id], [is_active_mail])
VALUES
    (7, N'phamthuytrang',    N'trang.pham@warehousehub.vn',      N'821AexmljN+bd/LPqhStmOvMLJ6MSK7argWNRHVnmVI=', 1, N'Active', CAST(N'2026-03-11T11:20:12.870' AS DateTime), N'Pham Thuy Trang', N'0908866558', NULL, 1)
INSERT [dbo].[Users]
    ([id], [username], [email], [password_hash], [role_id], [status], [created_at], [fullname], [phone], [manager_id], [is_active_mail])
VALUES
    (8, N'lebaotran',        N'tran.le@distributionhub.vn',      N'd4DfAZiTB/HFcmxMcIRO9nC7EpZ8gP4BeyyYHZW5D4A=', 1, N'Active', CAST(N'2026-03-11T11:23:06.083' AS DateTime), N'Le Bao Tran', N'0978866552', NULL, 1)
INSERT [dbo].[Users]
    ([id], [username], [email], [password_hash], [role_id], [status], [created_at], [fullname], [phone], [manager_id], [is_active_mail])
VALUES
    (9, N'hoangminhduc',     N'duc.hoang@warehousehub.vn',       N'45iBE+mzSG3EzqedoNrF0m/I9w0pEzFWJolmm5MYs4A=', 3, N'Active', CAST(N'2026-03-11T11:17:27.357' AS DateTime), N'Hoang Minh Duc', N'0978866558', 3, 1)
INSERT [dbo].[Users]
    ([id], [username], [email], [password_hash], [role_id], [status], [created_at], [fullname], [phone], [manager_id], [is_active_mail])
VALUES
    (10, N'dangngoctram',    N'tram.dang@storagecenter.vn',      N'YcpvMgP8OYVvQcmq0ImjKn+Gt/Pcn8js356pc48Bw08=', 3, N'Active', CAST(N'2026-03-11T11:20:26.923' AS DateTime), N'Dang Ngoc Tram', N'0947755668', 3, 1)
INSERT [dbo].[Users]
    ([id], [username], [email], [password_hash], [role_id], [status], [created_at], [fullname], [phone], [manager_id], [is_active_mail])
VALUES
    (11, N'vuminhtri',       N'tri.vu@logisticscenter.vn',       N'IZtFbgLd1WVoDfCN1NiITqV1RWWEhoHV9apAsHJYmTU=', 3, N'Active', CAST(N'2026-03-11T11:17:57.527' AS DateTime), N'Vu Minh Tri', N'0985577558', 4, 1)
INSERT [dbo].[Users]
    ([id], [username], [email], [password_hash], [role_id], [status], [created_at], [fullname], [phone], [manager_id], [is_active_mail])
VALUES
    (12, N'tranthanhhuyen',  N'huyen.tran@inventory.vn',         N'j8CTIvVm9N9JQRwm5+44LHVTymTPbFkQTugf3JtkY9U=', 3, N'Active', CAST(N'2026-03-11T11:20:35.317' AS DateTime), N'Tran Thanh Huyen', N'0966688558', 4, 1)
SET IDENTITY_INSERT [dbo].[Users] OFF
GO
