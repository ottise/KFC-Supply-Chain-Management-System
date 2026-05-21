USE [master]
GO

IF DB_ID('OJTSP26_inventory') IS NOT NULL
    DROP DATABASE [OJTSP26_inventory]
GO

CREATE DATABASE [OJTSP26_inventory]
GO

USE [OJTSP26_inventory]
GO
/****** Object:  Table [dbo].[categories]    Script Date: 3/24/2026 1:26:39 PM ******/
SET ANSI_NULLS ON
GO
SET QUOTED_IDENTIFIER ON
GO
CREATE TABLE [dbo].[categories]
(
    [id] [int] IDENTITY(1,1) NOT NULL,
    [name] [nvarchar](255) NOT NULL,
    [parent_id] [int] NULL,
    [is_active] [bit] NULL,
    PRIMARY KEY CLUSTERED 
(
	[id] ASC
)WITH (PAD_INDEX = OFF, STATISTICS_NORECOMPUTE = OFF, IGNORE_DUP_KEY = OFF, ALLOW_ROW_LOCKS = ON, ALLOW_PAGE_LOCKS = ON, OPTIMIZE_FOR_SEQUENTIAL_KEY = OFF) ON [PRIMARY]
) ON [PRIMARY]
GO
/****** Object:  Table [dbo].[current_inventory]    Script Date: 3/24/2026 1:26:39 PM ******/
SET ANSI_NULLS ON
GO
SET QUOTED_IDENTIFIER ON
GO
CREATE TABLE [dbo].[current_inventory]
(
    [id] [int] IDENTITY(1,1) NOT NULL,
    [product_id] [int] NULL,
    [location_id] [int] NULL,
    [lot_id] [int] NULL,
    [quantity] [decimal](18, 3) NULL,
    [reserved_quantity] [decimal](18, 3) NULL,
    PRIMARY KEY CLUSTERED 
(
	[id] ASC
)WITH (PAD_INDEX = OFF, STATISTICS_NORECOMPUTE = OFF, IGNORE_DUP_KEY = OFF, ALLOW_ROW_LOCKS = ON, ALLOW_PAGE_LOCKS = ON, OPTIMIZE_FOR_SEQUENTIAL_KEY = OFF) ON [PRIMARY]
) ON [PRIMARY]
GO
/****** Object:  Table [dbo].[customers]    Script Date: 3/24/2026 1:26:39 PM ******/
SET ANSI_NULLS ON
GO
SET QUOTED_IDENTIFIER ON
GO
CREATE TABLE [dbo].[customers]
(
    [id] [int] IDENTITY(1,1) NOT NULL,
    [customer_name] [nvarchar](255) NOT NULL,
    [phone] [nvarchar](50) NULL,
    [email] [nvarchar](255) NULL,
    [address] [nvarchar](255) NULL,
    [is_active] [bit] NULL,
    [created_at] [datetime2](7) NULL,
    [updated_at] [datetime2](7) NULL,
    PRIMARY KEY CLUSTERED 
(
	[id] ASC
)WITH (PAD_INDEX = OFF, STATISTICS_NORECOMPUTE = OFF, IGNORE_DUP_KEY = OFF, ALLOW_ROW_LOCKS = ON, ALLOW_PAGE_LOCKS = ON, OPTIMIZE_FOR_SEQUENTIAL_KEY = OFF) ON [PRIMARY]
) ON [PRIMARY]
GO
/****** Object:  Table [dbo].[inventory_adjustment_items]    Script Date: 3/24/2026 1:26:39 PM ******/
SET ANSI_NULLS ON
GO
SET QUOTED_IDENTIFIER ON
GO
CREATE TABLE [dbo].[inventory_adjustment_items]
(
    [id] [int] IDENTITY(1,1) NOT NULL,
    [adjustment_id] [int] NULL,
    [product_id] [int] NULL,
    [location_id] [int] NULL,
    [lot_id] [int] NULL,
    [system_qty] [decimal](18, 3) NULL,
    [counted_qty] [decimal](18, 3) NULL,
    [difference_qty] [decimal](18, 3) NULL,
    PRIMARY KEY CLUSTERED 
(
	[id] ASC
)WITH (PAD_INDEX = OFF, STATISTICS_NORECOMPUTE = OFF, IGNORE_DUP_KEY = OFF, ALLOW_ROW_LOCKS = ON, ALLOW_PAGE_LOCKS = ON, OPTIMIZE_FOR_SEQUENTIAL_KEY = OFF) ON [PRIMARY]
) ON [PRIMARY]
GO
/****** Object:  Table [dbo].[inventory_adjustments]    Script Date: 3/24/2026 1:26:39 PM ******/
SET ANSI_NULLS ON
GO
SET QUOTED_IDENTIFIER ON
GO
CREATE TABLE [dbo].[inventory_adjustments]
(
    [id] [int] IDENTITY(1,1) NOT NULL,
    [adjustment_no] [nvarchar](255) NULL,
    [status] [nvarchar](255) NULL,
    [created_at] [datetime2](7) NULL,
    [completed_at] [datetime2](7) NULL,
    [assignee_id] [int] NULL,
    PRIMARY KEY CLUSTERED 
(
	[id] ASC
)WITH (PAD_INDEX = OFF, STATISTICS_NORECOMPUTE = OFF, IGNORE_DUP_KEY = OFF, ALLOW_ROW_LOCKS = ON, ALLOW_PAGE_LOCKS = ON, OPTIMIZE_FOR_SEQUENTIAL_KEY = OFF) ON [PRIMARY]
) ON [PRIMARY]
GO
/****** Object:  Table [dbo].[locations]    Script Date: 3/24/2026 1:26:39 PM ******/
SET ANSI_NULLS ON
GO
SET QUOTED_IDENTIFIER ON
GO
CREATE TABLE [dbo].[locations]
(
    [id] [int] IDENTITY(1,1) NOT NULL,
    [name] [nvarchar](255) NULL,
    [type] [nvarchar](255) NULL,
    [parent_id] [int] NULL,
    [is_active] [bit] NULL,
    [warehouse_id] [int] NULL,
    PRIMARY KEY CLUSTERED 
(
	[id] ASC
)WITH (PAD_INDEX = OFF, STATISTICS_NORECOMPUTE = OFF, IGNORE_DUP_KEY = OFF, ALLOW_ROW_LOCKS = ON, ALLOW_PAGE_LOCKS = ON, OPTIMIZE_FOR_SEQUENTIAL_KEY = OFF) ON [PRIMARY]
) ON [PRIMARY]
GO
/****** Object:  Table [dbo].[product_lots]    Script Date: 3/24/2026 1:26:39 PM ******/
SET ANSI_NULLS ON
GO
SET QUOTED_IDENTIFIER ON
GO
CREATE TABLE [dbo].[product_lots]
(
    [id] [int] IDENTITY(1,1) NOT NULL,
    [product_id] [int] NULL,
    [lot_number] [nvarchar](255) NULL,
    [expiration_date] [datetime2](7) NULL,
    PRIMARY KEY CLUSTERED 
(
	[id] ASC
)WITH (PAD_INDEX = OFF, STATISTICS_NORECOMPUTE = OFF, IGNORE_DUP_KEY = OFF, ALLOW_ROW_LOCKS = ON, ALLOW_PAGE_LOCKS = ON, OPTIMIZE_FOR_SEQUENTIAL_KEY = OFF) ON [PRIMARY]
) ON [PRIMARY]
GO
/****** Object:  Table [dbo].[products]    Script Date: 3/24/2026 1:26:39 PM ******/
SET ANSI_NULLS ON
GO
SET QUOTED_IDENTIFIER ON
GO
CREATE TABLE [dbo].[products]
(
    [id] [int] IDENTITY(1,1) NOT NULL,
    [name] [nvarchar](255) NOT NULL,
    [code] [nvarchar](255) NOT NULL,
    [product_type] [nvarchar](255) NULL,
    [base_uom_id] [int] NOT NULL,
    [purchase_uom_id] [int] NULL,
    [category_id] [int] NULL,
    [sale_price] [decimal](18, 2) NULL,
    [stock_price] [decimal](18, 2) NULL,
    [is_active] [bit] NULL,
    [created_at] [datetime2](7) NULL,
    [updated_at] [datetime2](7) NULL,
    PRIMARY KEY CLUSTERED 
(
	[id] ASC
)WITH (PAD_INDEX = OFF, STATISTICS_NORECOMPUTE = OFF, IGNORE_DUP_KEY = OFF, ALLOW_ROW_LOCKS = ON, ALLOW_PAGE_LOCKS = ON, OPTIMIZE_FOR_SEQUENTIAL_KEY = OFF) ON [PRIMARY],
    UNIQUE NONCLUSTERED 
(
	[code] ASC
)WITH (PAD_INDEX = OFF, STATISTICS_NORECOMPUTE = OFF, IGNORE_DUP_KEY = OFF, ALLOW_ROW_LOCKS = ON, ALLOW_PAGE_LOCKS = ON, OPTIMIZE_FOR_SEQUENTIAL_KEY = OFF) ON [PRIMARY]
) ON [PRIMARY]
GO
/****** Object:  Table [dbo].[purchase_order_items]    Script Date: 3/24/2026 1:26:39 PM ******/
SET ANSI_NULLS ON
GO
SET QUOTED_IDENTIFIER ON
GO
CREATE TABLE [dbo].[purchase_order_items]
(
    [id] [int] IDENTITY(1,1) NOT NULL,
    [purchase_order_id] [int] NULL,
    [product_id] [int] NULL,
    [ordered_qty] [decimal](18, 3) NULL,
    [received_qty] [decimal](18, 3) NULL,
    [unit_price] [decimal](18, 2) NULL,
    [subtotal] [decimal](18, 2) NULL,
    [lot_id] [int] NULL,
    PRIMARY KEY CLUSTERED 
(
	[id] ASC
)WITH (PAD_INDEX = OFF, STATISTICS_NORECOMPUTE = OFF, IGNORE_DUP_KEY = OFF, ALLOW_ROW_LOCKS = ON, ALLOW_PAGE_LOCKS = ON, OPTIMIZE_FOR_SEQUENTIAL_KEY = OFF) ON [PRIMARY]
) ON [PRIMARY]
GO
/****** Object:  Table [dbo].[purchase_orders]    Script Date: 3/24/2026 1:26:39 PM ******/
SET ANSI_NULLS ON
GO
SET QUOTED_IDENTIFIER ON
GO
CREATE TABLE [dbo].[purchase_orders]
(
    [id] [int] IDENTITY(1,1) NOT NULL,
    [supplier_id] [int] NOT NULL,
    [status] [nvarchar](255) NULL,
    [created_at] [datetime2](7) NULL,
    [confirmed_at] [datetime2](7) NULL,
    [completed_at] [datetime2](7) NULL,
    [to_location_id] [int] NULL,
    [planned_date] [datetime2](7) NULL,
    [created_by_id] [int] NULL,
    PRIMARY KEY CLUSTERED 
(
	[id] ASC
)WITH (PAD_INDEX = OFF, STATISTICS_NORECOMPUTE = OFF, IGNORE_DUP_KEY = OFF, ALLOW_ROW_LOCKS = ON, ALLOW_PAGE_LOCKS = ON, OPTIMIZE_FOR_SEQUENTIAL_KEY = OFF) ON [PRIMARY]
) ON [PRIMARY]
GO
/****** Object:  Table [dbo].[reordering_rules]    Script Date: 3/24/2026 1:26:39 PM ******/
SET ANSI_NULLS ON
GO
SET QUOTED_IDENTIFIER ON
GO
CREATE TABLE [dbo].[reordering_rules]
(
    [id] [int] IDENTITY(1,1) NOT NULL,
    [product_warehouse_id] [int] NULL,
    [min_qty] [decimal](18, 3) NULL,
    [max_qty] [decimal](18, 3) NULL,
    [trigger_type] [nvarchar](255) NULL,
    [is_active] [bit] NULL,
    [created_at] [datetime2](7) NULL,
    PRIMARY KEY CLUSTERED 
(
	[id] ASC
)WITH (PAD_INDEX = OFF, STATISTICS_NORECOMPUTE = OFF, IGNORE_DUP_KEY = OFF, ALLOW_ROW_LOCKS = ON, ALLOW_PAGE_LOCKS = ON, OPTIMIZE_FOR_SEQUENTIAL_KEY = OFF) ON [PRIMARY]
) ON [PRIMARY]
GO

/****** Object:  Table [dbo].[product_warehouses] ******/
SET ANSI_NULLS ON
GO
SET QUOTED_IDENTIFIER ON
GO
CREATE TABLE [dbo].[product_warehouses] (
    [id] [int] IDENTITY(1,1) NOT NULL,
    [product_id] [int] NOT NULL,
    [warehouse_id] [int] NOT NULL,
    [is_active] [bit] NULL DEFAULT ((1)),
    [created_at] [datetime2](7) NULL DEFAULT (SYSDATETIME()),
    [created_by_id] [int] NULL,
    PRIMARY KEY CLUSTERED ([id] ASC)
) ON [PRIMARY];
GO
/****** Object:  Table [dbo].[sale_order_items]    Script Date: 3/24/2026 1:26:39 PM ******/
SET ANSI_NULLS ON
GO
SET QUOTED_IDENTIFIER ON
GO
CREATE TABLE [dbo].[sale_order_items]
(
    [id] [int] IDENTITY(1,1) NOT NULL,
    [sale_order_id] [int] NOT NULL,
    [product_id] [int] NOT NULL,
    [ordered_qty] [decimal](18, 3) NOT NULL,
    [shipped_qty] [decimal](18, 3) NULL,
    [unit_price] [decimal](18, 2) NOT NULL,
    [subtotal] [decimal](18, 2) NOT NULL,
    PRIMARY KEY CLUSTERED 
(
	[id] ASC
)WITH (PAD_INDEX = OFF, STATISTICS_NORECOMPUTE = OFF, IGNORE_DUP_KEY = OFF, ALLOW_ROW_LOCKS = ON, ALLOW_PAGE_LOCKS = ON, OPTIMIZE_FOR_SEQUENTIAL_KEY = OFF) ON [PRIMARY]
) ON [PRIMARY]
GO
/****** Object:  Table [dbo].[sale_orders]    Script Date: 3/24/2026 1:26:39 PM ******/
SET ANSI_NULLS ON
GO
SET QUOTED_IDENTIFIER ON
GO
CREATE TABLE [dbo].[sale_orders]
(
    [id] [int] IDENTITY(1,1) NOT NULL,
    [order_no] [varchar](50) NOT NULL,
    [customer_id] [int] NOT NULL,
    [status] [varchar](30) NULL,
    [total_amount] [decimal](18, 2) NULL,
    [created_at] [datetime2](7) NULL,
    [confirmed_at] [datetime2](7) NULL,
    [completed_at] [datetime2](7) NULL,
    [note] [nvarchar](500) NULL,
    [created_by_id] [int] NULL,
    [created_by_name] [nvarchar](255) NULL,
    PRIMARY KEY CLUSTERED 
(
	[id] ASC
)WITH (PAD_INDEX = OFF, STATISTICS_NORECOMPUTE = OFF, IGNORE_DUP_KEY = OFF, ALLOW_ROW_LOCKS = ON, ALLOW_PAGE_LOCKS = ON, OPTIMIZE_FOR_SEQUENTIAL_KEY = OFF) ON [PRIMARY],
    UNIQUE NONCLUSTERED 
(
	[order_no] ASC
)WITH (PAD_INDEX = OFF, STATISTICS_NORECOMPUTE = OFF, IGNORE_DUP_KEY = OFF, ALLOW_ROW_LOCKS = ON, ALLOW_PAGE_LOCKS = ON, OPTIMIZE_FOR_SEQUENTIAL_KEY = OFF) ON [PRIMARY]
) ON [PRIMARY]
GO
/****** Object:  Table [dbo].[scrap_order_items]    Script Date: 3/24/2026 1:26:39 PM ******/
SET ANSI_NULLS ON
GO
SET QUOTED_IDENTIFIER ON
GO
CREATE TABLE [dbo].[scrap_order_items]
(
    [id] [int] IDENTITY(1,1) NOT NULL,
    [scrap_order_id] [int] NULL,
    [product_id] [int] NULL,
    [quantity] [decimal](18, 3) NULL,
    [uom_id] [int] NULL,
    [lot_id] [int] NULL,
    [reason] [nvarchar](255) NULL,
    PRIMARY KEY CLUSTERED 
(
	[id] ASC
)WITH (PAD_INDEX = OFF, STATISTICS_NORECOMPUTE = OFF, IGNORE_DUP_KEY = OFF, ALLOW_ROW_LOCKS = ON, ALLOW_PAGE_LOCKS = ON, OPTIMIZE_FOR_SEQUENTIAL_KEY = OFF) ON [PRIMARY]
) ON [PRIMARY]
GO
/****** Object:  Table [dbo].[scrap_orders]    Script Date: 3/24/2026 1:26:39 PM ******/
SET ANSI_NULLS ON
GO
SET QUOTED_IDENTIFIER ON
GO
CREATE TABLE [dbo].[scrap_orders]
(
    [id] [int] IDENTITY(1,1) NOT NULL,
    [scrap_no] [nvarchar](50) NOT NULL,
    [warehouse_id] [int] NOT NULL,
    [location_id] [int] NOT NULL,
    [status] [nvarchar](255) NULL,
    [created_at] [datetime2](7) NULL,
    [confirmed_at] [datetime2](7) NULL,
    [completed_at] [datetime2](7) NULL,
    [created_by_id] [int] NULL,
    [created_by_name] [nvarchar](255) NULL,
    [to_location_id] [int] NULL,
    PRIMARY KEY CLUSTERED 
(
	[id] ASC
)WITH (PAD_INDEX = OFF, STATISTICS_NORECOMPUTE = OFF, IGNORE_DUP_KEY = OFF, ALLOW_ROW_LOCKS = ON, ALLOW_PAGE_LOCKS = ON, OPTIMIZE_FOR_SEQUENTIAL_KEY = OFF) ON [PRIMARY],
    UNIQUE NONCLUSTERED 
(
	[scrap_no] ASC
)WITH (PAD_INDEX = OFF, STATISTICS_NORECOMPUTE = OFF, IGNORE_DUP_KEY = OFF, ALLOW_ROW_LOCKS = ON, ALLOW_PAGE_LOCKS = ON, OPTIMIZE_FOR_SEQUENTIAL_KEY = OFF) ON [PRIMARY]
) ON [PRIMARY]
GO
/****** Object:  Table [dbo].[stock_documents]    Script Date: 3/24/2026 1:26:39 PM ******/
SET ANSI_NULLS ON
GO
SET QUOTED_IDENTIFIER ON
GO
CREATE TABLE [dbo].[stock_documents]
(
    [id] [int] IDENTITY(1,1) NOT NULL,
    [document_no] [nvarchar](255) NULL,
    [document_type] [nvarchar](255) NULL,
    [reference_type] [nvarchar](255) NULL,
    [reference_id] [int] NULL,
    [origin] [nvarchar](255) NULL,
    [from_location_id] [int] NULL,
    [to_location_id] [int] NULL,
    [status] [nvarchar](255) NULL,
    [created_at] [datetime2](7) NULL,
    [completed_at] [datetime2](7) NULL,
    PRIMARY KEY CLUSTERED 
(
	[id] ASC
)WITH (PAD_INDEX = OFF, STATISTICS_NORECOMPUTE = OFF, IGNORE_DUP_KEY = OFF, ALLOW_ROW_LOCKS = ON, ALLOW_PAGE_LOCKS = ON, OPTIMIZE_FOR_SEQUENTIAL_KEY = OFF) ON [PRIMARY]
) ON [PRIMARY]
GO
/****** Object:  Table [dbo].[stock_transactions]    Script Date: 3/24/2026 1:26:39 PM ******/
SET ANSI_NULLS ON
GO
SET QUOTED_IDENTIFIER ON
GO
CREATE TABLE [dbo].[stock_transactions]
(
    [id] [int] IDENTITY(1,1) NOT NULL,
    [document_id] [int] NULL,
    [product_id] [int] NULL,
    [uom_id] [int] NULL,
    [from_location_id] [int] NULL,
    [to_location_id] [int] NULL,
    [planned_qty] [decimal](18, 3) NULL,
    [actual_qty] [decimal](18, 3) NULL,
    [reserved_qty] [decimal](18, 3) NULL,
    [lot_id] [int] NULL,
    [transaction_type] [nvarchar](255) NULL,
    [status] [nvarchar](255) NULL,
    [created_at] [datetime2](7) NULL,
    [completed_at] [datetime2](7) NULL,
    [planned_date] [datetime2](7) NULL,
    PRIMARY KEY CLUSTERED 
(
	[id] ASC
)WITH (PAD_INDEX = OFF, STATISTICS_NORECOMPUTE = OFF, IGNORE_DUP_KEY = OFF, ALLOW_ROW_LOCKS = ON, ALLOW_PAGE_LOCKS = ON, OPTIMIZE_FOR_SEQUENTIAL_KEY = OFF) ON [PRIMARY]
) ON [PRIMARY]
GO
/****** Object:  Table [dbo].[suppliers]    Script Date: 3/24/2026 1:26:39 PM ******/
SET ANSI_NULLS ON
GO
SET QUOTED_IDENTIFIER ON
GO
CREATE TABLE [dbo].[suppliers]
(
    [id] [int] IDENTITY(1,1) NOT NULL,
    [name] [nvarchar](255) NOT NULL,
    [contact_person] [nvarchar](255) NULL,
    [phone] [nvarchar](255) NULL,
    [email] [nvarchar](255) NULL,
    [address] [nvarchar](255) NULL,
    [is_active] [bit] NULL,
    [created_at] [datetime2](7) NULL,
    PRIMARY KEY CLUSTERED 
(
	[id] ASC
)WITH (PAD_INDEX = OFF, STATISTICS_NORECOMPUTE = OFF, IGNORE_DUP_KEY = OFF, ALLOW_ROW_LOCKS = ON, ALLOW_PAGE_LOCKS = ON, OPTIMIZE_FOR_SEQUENTIAL_KEY = OFF) ON [PRIMARY]
) ON [PRIMARY]
GO
/****** Object:  Table [dbo].[transfer_order_items]    Script Date: 3/24/2026 1:26:39 PM ******/
SET ANSI_NULLS ON
GO
SET QUOTED_IDENTIFIER ON
GO
CREATE TABLE [dbo].[transfer_order_items]
(
    [id] [int] IDENTITY(1,1) NOT NULL,
    [transfer_order_id] [int] NOT NULL,
    [product_id] [int] NOT NULL,
    [requested_qty] [decimal](18, 3) NULL,
    [transferred_qty] [decimal](18, 3) NULL,
    PRIMARY KEY CLUSTERED 
(
	[id] ASC
)WITH (PAD_INDEX = OFF, STATISTICS_NORECOMPUTE = OFF, IGNORE_DUP_KEY = OFF, ALLOW_ROW_LOCKS = ON, ALLOW_PAGE_LOCKS = ON, OPTIMIZE_FOR_SEQUENTIAL_KEY = OFF) ON [PRIMARY]
) ON [PRIMARY]
GO
/****** Object:  Table [dbo].[transfer_orders]    Script Date: 3/24/2026 1:26:39 PM ******/
SET ANSI_NULLS ON
GO
SET QUOTED_IDENTIFIER ON
GO
CREATE TABLE [dbo].[transfer_orders]
(
    [id] [int] IDENTITY(1,1) NOT NULL,
    [transfer_no] [varchar](50) NOT NULL,
    [from_location_id] [int] NOT NULL,
    [to_location_id] [int] NOT NULL,
    [status] [varchar](30) NULL,
    [created_at] [datetime2](7) NULL,
    [confirmed_at] [datetime2](7) NULL,
    [completed_at] [datetime2](7) NULL,
    [note] [nvarchar](500) NULL,
    [created_by_id] [int] NULL,
    [created_by_name] [nvarchar](255) NULL,
    PRIMARY KEY CLUSTERED 
(
	[id] ASC
)WITH (PAD_INDEX = OFF, STATISTICS_NORECOMPUTE = OFF, IGNORE_DUP_KEY = OFF, ALLOW_ROW_LOCKS = ON, ALLOW_PAGE_LOCKS = ON, OPTIMIZE_FOR_SEQUENTIAL_KEY = OFF) ON [PRIMARY],
    UNIQUE NONCLUSTERED 
(
	[transfer_no] ASC
)WITH (PAD_INDEX = OFF, STATISTICS_NORECOMPUTE = OFF, IGNORE_DUP_KEY = OFF, ALLOW_ROW_LOCKS = ON, ALLOW_PAGE_LOCKS = ON, OPTIMIZE_FOR_SEQUENTIAL_KEY = OFF) ON [PRIMARY]
) ON [PRIMARY]
GO
/****** Object:  Table [dbo].[uom]    Script Date: 3/24/2026 1:26:39 PM ******/
SET ANSI_NULLS ON
GO
SET QUOTED_IDENTIFIER ON
GO
CREATE TABLE [dbo].[uom]
(
    [id] [int] IDENTITY(1,1) NOT NULL,
    [name] [nvarchar](255) NULL,
    [category] [nvarchar](255) NULL,
    [conversion_ratio] [decimal](18, 6) NULL,
    [is_base_unit] [bit] NULL,
    PRIMARY KEY CLUSTERED 
(
	[id] ASC
)WITH (PAD_INDEX = OFF, STATISTICS_NORECOMPUTE = OFF, IGNORE_DUP_KEY = OFF, ALLOW_ROW_LOCKS = ON, ALLOW_PAGE_LOCKS = ON, OPTIMIZE_FOR_SEQUENTIAL_KEY = OFF) ON [PRIMARY]
) ON [PRIMARY]
GO
/****** Object:  Table [dbo].[warehouses]    Script Date: 3/24/2026 1:26:39 PM ******/
SET ANSI_NULLS ON
GO
SET QUOTED_IDENTIFIER ON
GO
CREATE TABLE [dbo].[warehouses]
(
    [id] [int] IDENTITY(1,1) NOT NULL,
    [warehouse_code] [nvarchar](50) NOT NULL,
    [name] [nvarchar](255) NOT NULL,
    [address] [nvarchar](500) NULL,
    [phone] [nvarchar](50) NULL,
    [email] [nvarchar](255) NULL,
    [warehouse_type] [nvarchar](100) NULL,
    [area_sqm] [decimal](18, 2) NULL,
    [is_active] [bit] NULL,
    [notes] [nvarchar](max) NULL,
    [created_at] [datetime2](7) NULL,
    [updated_at] [datetime2](7) NULL,
    [manager_id] [int] NULL,
    PRIMARY KEY CLUSTERED 
(
	[id] ASC
)WITH (PAD_INDEX = OFF, STATISTICS_NORECOMPUTE = OFF, IGNORE_DUP_KEY = OFF, ALLOW_ROW_LOCKS = ON, ALLOW_PAGE_LOCKS = ON, OPTIMIZE_FOR_SEQUENTIAL_KEY = OFF) ON [PRIMARY]
) ON [PRIMARY] TEXTIMAGE_ON [PRIMARY]
GO
/****** Object:  Index [IX_locations_warehouse_id]    Script Date: 3/24/2026 1:26:39 PM ******/
CREATE NONCLUSTERED INDEX [IX_locations_warehouse_id] ON [dbo].[locations]
(
	[warehouse_id] ASC
)WITH (PAD_INDEX = OFF, STATISTICS_NORECOMPUTE = OFF, SORT_IN_TEMPDB = OFF, DROP_EXISTING = OFF, ONLINE = OFF, ALLOW_ROW_LOCKS = ON, ALLOW_PAGE_LOCKS = ON, OPTIMIZE_FOR_SEQUENTIAL_KEY = OFF) ON [PRIMARY]
GO
ALTER TABLE [dbo].[categories] ADD  DEFAULT ((1)) FOR [is_active]
GO
ALTER TABLE [dbo].[customers] ADD  DEFAULT ((1)) FOR [is_active]
GO
ALTER TABLE [dbo].[products] ADD  DEFAULT ('storable') FOR [product_type]
GO
ALTER TABLE [dbo].[products] ADD  DEFAULT ((1)) FOR [is_active]
GO
ALTER TABLE [dbo].[reordering_rules] ADD  DEFAULT ((1)) FOR [is_active]
GO
ALTER TABLE [dbo].[sale_order_items] ADD  DEFAULT ((0)) FOR [shipped_qty]
GO
ALTER TABLE [dbo].[suppliers] ADD  DEFAULT ((1)) FOR [is_active]
GO
ALTER TABLE [dbo].[categories]  WITH CHECK ADD FOREIGN KEY([parent_id])
REFERENCES [dbo].[categories] ([id])
GO
ALTER TABLE [dbo].[current_inventory]  WITH CHECK ADD FOREIGN KEY([location_id])
REFERENCES [dbo].[locations] ([id])
GO
ALTER TABLE [dbo].[current_inventory]  WITH CHECK ADD FOREIGN KEY([lot_id])
REFERENCES [dbo].[product_lots] ([id])
GO
ALTER TABLE [dbo].[current_inventory]  WITH CHECK ADD FOREIGN KEY([product_id])
REFERENCES [dbo].[products] ([id])
GO
ALTER TABLE [dbo].[inventory_adjustment_items]  WITH CHECK ADD FOREIGN KEY([adjustment_id])
REFERENCES [dbo].[inventory_adjustments] ([id])
GO
ALTER TABLE [dbo].[inventory_adjustment_items]  WITH CHECK ADD FOREIGN KEY([location_id])
REFERENCES [dbo].[locations] ([id])
GO
ALTER TABLE [dbo].[inventory_adjustment_items]  WITH CHECK ADD FOREIGN KEY([lot_id])
REFERENCES [dbo].[product_lots] ([id])
GO
ALTER TABLE [dbo].[inventory_adjustment_items]  WITH CHECK ADD FOREIGN KEY([product_id])
REFERENCES [dbo].[products] ([id])
GO
ALTER TABLE [dbo].[locations]  WITH CHECK ADD FOREIGN KEY([parent_id])
REFERENCES [dbo].[locations] ([id])
GO
ALTER TABLE [dbo].[locations]  WITH CHECK ADD  CONSTRAINT [FK_locations_warehouses] FOREIGN KEY([warehouse_id])
REFERENCES [dbo].[warehouses] ([id])
GO
ALTER TABLE [dbo].[locations] CHECK CONSTRAINT [FK_locations_warehouses]
GO
ALTER TABLE [dbo].[product_lots]  WITH CHECK ADD FOREIGN KEY([product_id])
REFERENCES [dbo].[products] ([id])
GO
ALTER TABLE [dbo].[products]  WITH CHECK ADD FOREIGN KEY([base_uom_id])
REFERENCES [dbo].[uom] ([id])
GO
ALTER TABLE [dbo].[products]  WITH CHECK ADD FOREIGN KEY([category_id])
REFERENCES [dbo].[categories] ([id])
GO
ALTER TABLE [dbo].[products]  WITH CHECK ADD FOREIGN KEY([purchase_uom_id])
REFERENCES [dbo].[uom] ([id])
GO
ALTER TABLE [dbo].[purchase_order_items]  WITH CHECK ADD FOREIGN KEY([product_id])
REFERENCES [dbo].[products] ([id])
GO
ALTER TABLE [dbo].[purchase_order_items]  WITH CHECK ADD FOREIGN KEY([purchase_order_id])
REFERENCES [dbo].[purchase_orders] ([id])
GO
ALTER TABLE [dbo].[purchase_order_items]  WITH CHECK ADD  CONSTRAINT [FK_purchase_order_items_product_lots_lot_id] FOREIGN KEY([lot_id])
REFERENCES [dbo].[product_lots] ([id])
GO
ALTER TABLE [dbo].[purchase_order_items] CHECK CONSTRAINT [FK_purchase_order_items_product_lots_lot_id]
GO
ALTER TABLE [dbo].[purchase_orders]  WITH CHECK ADD FOREIGN KEY([supplier_id])
REFERENCES [dbo].[suppliers] ([id])
GO
ALTER TABLE [dbo].[purchase_orders]  WITH CHECK ADD  CONSTRAINT [FK_purchase_orders_to_location] FOREIGN KEY([to_location_id])
REFERENCES [dbo].[locations] ([id])
GO
ALTER TABLE [dbo].[purchase_orders] CHECK CONSTRAINT [FK_purchase_orders_to_location]
GO
ALTER TABLE [dbo].[reordering_rules]  WITH CHECK ADD FOREIGN KEY([product_warehouse_id])
REFERENCES [dbo].[product_warehouses] ([id])
GO
ALTER TABLE [dbo].[product_warehouses] WITH CHECK ADD FOREIGN KEY([product_id]) REFERENCES [dbo].[products] ([id]);
GO
ALTER TABLE [dbo].[product_warehouses] WITH CHECK ADD FOREIGN KEY([warehouse_id]) REFERENCES [dbo].[warehouses] ([id]);
GO
ALTER TABLE [dbo].[sale_order_items]  WITH CHECK ADD FOREIGN KEY([product_id])
REFERENCES [dbo].[products] ([id])
GO
ALTER TABLE [dbo].[sale_order_items]  WITH CHECK ADD FOREIGN KEY([sale_order_id])
REFERENCES [dbo].[sale_orders] ([id])
GO
ALTER TABLE [dbo].[sale_orders]  WITH CHECK ADD FOREIGN KEY([customer_id])
REFERENCES [dbo].[customers] ([id])
GO
ALTER TABLE [dbo].[scrap_order_items]  WITH CHECK ADD FOREIGN KEY([lot_id])
REFERENCES [dbo].[product_lots] ([id])
GO
ALTER TABLE [dbo].[scrap_order_items]  WITH CHECK ADD FOREIGN KEY([product_id])
REFERENCES [dbo].[products] ([id])
GO
ALTER TABLE [dbo].[scrap_order_items]  WITH CHECK ADD FOREIGN KEY([scrap_order_id])
REFERENCES [dbo].[scrap_orders] ([id])
GO
ALTER TABLE [dbo].[scrap_order_items]  WITH CHECK ADD FOREIGN KEY([uom_id])
REFERENCES [dbo].[uom] ([id])
GO
ALTER TABLE [dbo].[scrap_orders]  WITH CHECK ADD FOREIGN KEY([location_id])
REFERENCES [dbo].[locations] ([id])
GO
ALTER TABLE [dbo].[scrap_orders]  WITH CHECK ADD FOREIGN KEY([warehouse_id])
REFERENCES [dbo].[warehouses] ([id])
GO
ALTER TABLE [dbo].[scrap_orders]  WITH CHECK ADD  CONSTRAINT [FK_scrap_orders_to_locations] FOREIGN KEY([to_location_id])
REFERENCES [dbo].[locations] ([id])
GO
ALTER TABLE [dbo].[scrap_orders] CHECK CONSTRAINT [FK_scrap_orders_to_locations]
GO
ALTER TABLE [dbo].[stock_documents]  WITH CHECK ADD FOREIGN KEY([from_location_id])
REFERENCES [dbo].[locations] ([id])
GO
ALTER TABLE [dbo].[stock_documents]  WITH CHECK ADD FOREIGN KEY([to_location_id])
REFERENCES [dbo].[locations] ([id])
GO
ALTER TABLE [dbo].[stock_transactions]  WITH CHECK ADD FOREIGN KEY([document_id])
REFERENCES [dbo].[stock_documents] ([id])
GO
ALTER TABLE [dbo].[stock_transactions]  WITH CHECK ADD FOREIGN KEY([from_location_id])
REFERENCES [dbo].[locations] ([id])
GO
ALTER TABLE [dbo].[stock_transactions]  WITH CHECK ADD FOREIGN KEY([product_id])
REFERENCES [dbo].[products] ([id])
GO
ALTER TABLE [dbo].[stock_transactions]  WITH CHECK ADD FOREIGN KEY([to_location_id])
REFERENCES [dbo].[locations] ([id])
GO
ALTER TABLE [dbo].[stock_transactions]  WITH CHECK ADD FOREIGN KEY([uom_id])
REFERENCES [dbo].[uom] ([id])
GO
ALTER TABLE [dbo].[transfer_order_items]  WITH CHECK ADD FOREIGN KEY([product_id])
REFERENCES [dbo].[products] ([id])
GO
ALTER TABLE [dbo].[transfer_order_items]  WITH CHECK ADD FOREIGN KEY([transfer_order_id])
REFERENCES [dbo].[transfer_orders] ([id])
GO
ALTER TABLE [dbo].[transfer_orders]  WITH CHECK ADD FOREIGN KEY([from_location_id])
REFERENCES [dbo].[locations] ([id])
GO
ALTER TABLE [dbo].[transfer_orders]  WITH CHECK ADD FOREIGN KEY([to_location_id])
REFERENCES [dbo].[locations] ([id])
GO

--- Index
USE [OJTSP26_inventory]
GO

CREATE NONCLUSTERED INDEX [IX_current_inventory_product_id] ON [dbo].[current_inventory] ([product_id] ASC);
CREATE NONCLUSTERED INDEX [IX_current_inventory_location_id] ON [dbo].[current_inventory] ([location_id] ASC);
CREATE NONCLUSTERED INDEX [IX_current_inventory_lot_id] ON [dbo].[current_inventory] ([lot_id] ASC);

CREATE NONCLUSTERED INDEX [IX_inventory_adjustments_assignee_id] ON [dbo].[inventory_adjustments] ([assignee_id] ASC);
CREATE NONCLUSTERED INDEX [IX_inv_adj_items_adjustment_id] ON [dbo].[inventory_adjustment_items] ([adjustment_id] ASC);
CREATE NONCLUSTERED INDEX [IX_inv_adj_items_product_id] ON [dbo].[inventory_adjustment_items] ([product_id] ASC);
CREATE NONCLUSTERED INDEX [IX_inv_adj_items_location_id] ON [dbo].[inventory_adjustment_items] ([location_id] ASC);
CREATE NONCLUSTERED INDEX [IX_inv_adj_items_lot_id] ON [dbo].[inventory_adjustment_items] ([lot_id] ASC);

CREATE NONCLUSTERED INDEX [IX_locations_parent_id] ON [dbo].[locations] ([parent_id] ASC);
CREATE NONCLUSTERED INDEX [IX_warehouses_manager_id] ON [dbo].[warehouses] ([manager_id] ASC);

CREATE NONCLUSTERED INDEX [IX_product_lots_product_id] ON [dbo].[product_lots] ([product_id] ASC);
CREATE NONCLUSTERED INDEX [IX_products_category_id] ON [dbo].[products] ([category_id] ASC);
CREATE NONCLUSTERED INDEX [IX_reordering_rules_product_warehouse_id] ON [dbo].[reordering_rules] ([product_warehouse_id] ASC);
CREATE NONCLUSTERED INDEX [IX_product_warehouses_product_id] ON [dbo].[product_warehouses] ([product_id] ASC);
CREATE NONCLUSTERED INDEX [IX_product_warehouses_warehouse_id] ON [dbo].[product_warehouses] ([warehouse_id] ASC);

CREATE NONCLUSTERED INDEX [IX_purchase_orders_supplier_id] ON [dbo].[purchase_orders] ([supplier_id] ASC);
CREATE NONCLUSTERED INDEX [IX_purchase_orders_to_location_id] ON [dbo].[purchase_orders] ([to_location_id] ASC);
CREATE NONCLUSTERED INDEX [IX_purchase_orders_created_by_id] ON [dbo].[purchase_orders] ([created_by_id] ASC);
CREATE NONCLUSTERED INDEX [IX_po_items_purchase_order_id] ON [dbo].[purchase_order_items] ([purchase_order_id] ASC);
CREATE NONCLUSTERED INDEX [IX_po_items_product_id] ON [dbo].[purchase_order_items] ([product_id] ASC);
CREATE NONCLUSTERED INDEX [IX_po_items_lot_id] ON [dbo].[purchase_order_items] ([lot_id] ASC);

CREATE NONCLUSTERED INDEX [IX_sale_orders_customer_id] ON [dbo].[sale_orders] ([customer_id] ASC);
CREATE NONCLUSTERED INDEX [IX_sale_orders_created_by_id] ON [dbo].[sale_orders] ([created_by_id] ASC);
CREATE NONCLUSTERED INDEX [IX_so_items_sale_order_id] ON [dbo].[sale_order_items] ([sale_order_id] ASC);
CREATE NONCLUSTERED INDEX [IX_so_items_product_id] ON [dbo].[sale_order_items] ([product_id] ASC);

CREATE NONCLUSTERED INDEX [IX_scrap_orders_warehouse_id] ON [dbo].[scrap_orders] ([warehouse_id] ASC);
CREATE NONCLUSTERED INDEX [IX_scrap_orders_location_id] ON [dbo].[scrap_orders] ([location_id] ASC);
CREATE NONCLUSTERED INDEX [IX_scrap_orders_created_by_id] ON [dbo].[scrap_orders] ([created_by_id] ASC);
CREATE NONCLUSTERED INDEX [IX_scrap_items_scrap_order_id] ON [dbo].[scrap_order_items] ([scrap_order_id] ASC);
CREATE NONCLUSTERED INDEX [IX_scrap_items_product_id] ON [dbo].[scrap_order_items] ([product_id] ASC);
CREATE NONCLUSTERED INDEX [IX_scrap_items_lot_id] ON [dbo].[scrap_order_items] ([lot_id] ASC);

CREATE NONCLUSTERED INDEX [IX_transfer_orders_from_location_id] ON [dbo].[transfer_orders] ([from_location_id] ASC);
CREATE NONCLUSTERED INDEX [IX_transfer_orders_to_location_id] ON [dbo].[transfer_orders] ([to_location_id] ASC);
CREATE NONCLUSTERED INDEX [IX_transfer_orders_created_by_id] ON [dbo].[transfer_orders] ([created_by_id] ASC);
CREATE NONCLUSTERED INDEX [IX_transfer_items_transfer_order_id] ON [dbo].[transfer_order_items] ([transfer_order_id] ASC);
CREATE NONCLUSTERED INDEX [IX_transfer_items_product_id] ON [dbo].[transfer_order_items] ([product_id] ASC);

CREATE NONCLUSTERED INDEX [IX_stock_docs_from_location_id] ON [dbo].[stock_documents] ([from_location_id] ASC);
CREATE NONCLUSTERED INDEX [IX_stock_docs_to_location_id] ON [dbo].[stock_documents] ([to_location_id] ASC);
CREATE NONCLUSTERED INDEX [IX_stock_trans_document_id] ON [dbo].[stock_transactions] ([document_id] ASC);
CREATE NONCLUSTERED INDEX [IX_stock_trans_product_id] ON [dbo].[stock_transactions] ([product_id] ASC);
CREATE NONCLUSTERED INDEX [IX_stock_trans_from_location_id] ON [dbo].[stock_transactions] ([from_location_id] ASC);
CREATE NONCLUSTERED INDEX [IX_stock_trans_to_location_id] ON [dbo].[stock_transactions] ([to_location_id] ASC);

CREATE NONCLUSTERED INDEX [IX_product_lots_expiration_date] ON [dbo].[product_lots] ([expiration_date] ASC);
CREATE NONCLUSTERED INDEX [IX_product_lots_lot_number] ON [dbo].[product_lots] ([lot_number] ASC);

CREATE NONCLUSTERED INDEX [IX_products_name] ON [dbo].[products] ([name] ASC);

CREATE NONCLUSTERED INDEX [IX_po_business_filter] ON [dbo].[purchase_orders] ([status] ASC, [created_at] DESC);
CREATE NONCLUSTERED INDEX [IX_so_business_filter] ON [dbo].[sale_orders] ([status] ASC, [created_at] DESC);
CREATE NONCLUSTERED INDEX [IX_trans_business_filter] ON [dbo].[transfer_orders] ([status] ASC, [created_at] DESC);
CREATE NONCLUSTERED INDEX [IX_scrap_business_filter] ON [dbo].[scrap_orders] ([status] ASC, [created_at] DESC);
CREATE NONCLUSTERED INDEX [IX_inv_adj_business_filter] ON [dbo].[inventory_adjustments] ([status] ASC, [created_at] DESC);
GO


