USE [master]
GO

IF DB_ID('OJTSP26_system') IS NOT NULL
    DROP DATABASE [OJTSP26_system]
GO

CREATE DATABASE [OJTSP26_system]
GO

USE [OJTSP26_system]
GO

CREATE TABLE [dbo].[SystemMaintenance] (
    [Id] NVARCHAR(20) NOT NULL PRIMARY KEY, -- TICK-001, TICK-002...
    [Status] NVARCHAR(20) NOT NULL DEFAULT 'Scheduled', -- Scheduled, Ongoing, Done, Cancelled
    [Reason] NVARCHAR(MAX) NOT NULL,
    [StartTime] DATETIME2(7) NOT NULL,
    [EndTime] DATETIME2(7) NOT NULL,
    [CreatedAt] DATETIME2(7) NOT NULL DEFAULT GETDATE(),
    [CreatedBy] NVARCHAR(255) NOT NULL
);
GO
