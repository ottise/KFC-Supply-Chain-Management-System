USE [master]
GO

IF DB_ID('OJTSP26_identity') IS NOT NULL
    DROP DATABASE [OJTSP26_identity]
GO

CREATE DATABASE [OJTSP26_identity]
GO

USE [OJTSP26_identity]
GO

CREATE TABLE [dbo].[Roles]
(
    [id] INT IDENTITY(1,1) PRIMARY KEY,
    [name] NVARCHAR(30) NOT NULL UNIQUE
)
GO

CREATE TABLE [dbo].[Users]
(
    [id] INT IDENTITY(1,1) PRIMARY KEY,
    [username] NVARCHAR(50) NOT NULL UNIQUE,
    [email] NVARCHAR(100) NOT NULL UNIQUE,
    [password_hash] NVARCHAR(255) NOT NULL,
    [role_id] INT NOT NULL,
    [status] NVARCHAR(20) NOT NULL DEFAULT 'Active',
    [created_at] DATETIME NULL,
    [fullname] NVARCHAR(50) NULL,
    [phone] NVARCHAR(12) NULL,
    [manager_id] INT NULL,
    [is_active_mail] BIT NOT NULL DEFAULT 0
)
GO

CREATE TABLE [dbo].[EmailVerificationTokens]
(
    [id] INT IDENTITY(1,1) PRIMARY KEY,
    [user_id] INT NOT NULL,
    [otp_code] NVARCHAR(10) NOT NULL,
    [expiration_time] DATETIME2 NOT NULL,
    [is_used] BIT NOT NULL DEFAULT 0,
    [created_at] DATETIME2 NOT NULL DEFAULT GETDATE()
)
GO

CREATE TABLE [dbo].[PasswordResetTokens]
(
    [id] INT IDENTITY(1,1) PRIMARY KEY,
    [user_id] INT NOT NULL,
    [otp_code] NVARCHAR(10) NOT NULL,
    [expiration_time] DATETIME NOT NULL,
    [is_used] BIT NOT NULL DEFAULT 0,
    [created_at] DATETIME NOT NULL DEFAULT GETDATE()
)
GO

ALTER TABLE [dbo].[Users]
ADD CONSTRAINT FK_Users_Roles
FOREIGN KEY (role_id) REFERENCES [dbo].[Roles](id)
GO

ALTER TABLE [dbo].[EmailVerificationTokens]
ADD CONSTRAINT FK_EmailVerificationTokens_Users
FOREIGN KEY (user_id) REFERENCES [dbo].[Users](id)
ON DELETE CASCADE
GO

ALTER TABLE [dbo].[PasswordResetTokens]
ADD CONSTRAINT FK_PasswordResetTokens_Users
FOREIGN KEY (user_id) REFERENCES [dbo].[Users](id)
ON DELETE CASCADE
GO