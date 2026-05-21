USE [OJTSP26_system]
GO

INSERT INTO [dbo].[SystemMaintenance] ([Id], [Status], [Reason], [StartTime], [EndTime], [CreatedAt], [CreatedBy])
VALUES 
('TICK-00001', 'Done', N'Bảo trì hệ thống định kỳ tháng 1', '2026-01-20 02:00:00', '2026-01-20 04:00:00', '2026-01-15 08:00:00', 'admin'),
('TICK-00002', 'Done', N'Nâng cấp bảo mật Gateway', '2026-02-15 01:00:00', '2026-02-15 02:30:00', '2026-02-10 10:00:00', 'superadmin'),
('TICK-00003', 'Done', N'Tối ưu hóa Database Inventory', '2026-03-10 03:00:00', '2026-03-10 06:00:00', '2026-03-05 14:00:00', 'tech_lead');
GO
