USE [OJTSP26_inventory]
GO

-- 1. Tắt tất cả các ràng buộc khoá ngoại
EXEC sp_MSforeachtable 'ALTER TABLE ? NOCHECK CONSTRAINT ALL'
GO

-- 2. Xoá dữ liệu và reset identity cho toàn bộ các bảng
-- Sử dụng DELETE + DBCC CHECKIDENT để reset identity về 0 (để bản ghi tiếp theo là 1)
EXEC sp_MSforeachtable '
    DELETE FROM ?;
    IF OBJECTPROPERTY(OBJECT_ID(''?''), ''TableHasIdentity'') = 1
        DBCC CHECKIDENT (''?'', RESEED, 0);
'
GO

-- 3. Bật lại tất cả các ràng buộc khoá ngoại
EXEC sp_MSforeachtable 'ALTER TABLE ? WITH CHECK CHECK CONSTRAINT ALL'
GO

PRINT 'Đã xoá sạch dữ liệu và reset Identity thành công!'
