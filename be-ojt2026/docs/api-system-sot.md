# API System - State of the Art

## Table of Contents
1. [System APIs](#system-apis)
2. [Inventory APIs](#inventory-apis)
3. [Authentication APIs](#authentication-apis)

---

# SYSTEM APIS

## Overview

| Item | Value |
|------|-------|
| **Feature** | System Maintenance Management |
| **Database** | `OJTSP26_system` |
| **Base Route** | `/api/maintenance` |
| **Authentication** | JWT Bearer Token |
| **Authorization** | Admin role required for CRUD operations |

---

## Database Schema

### Table: `SystemMaintenance`

| Column | Type | Constraints | Description |
|--------|------|-------------|-------------|
| `Id` | `NVARCHAR(20)` | PRIMARY KEY | Format: `TICK-00001` to `TICK-99999` |
| `Status` | `NVARCHAR(20)` | NOT NULL, DEFAULT 'Scheduled' | Current maintenance status |
| `Reason` | `NVARCHAR(MAX)` | NOT NULL | Reason for maintenance |
| `StartTime` | `DATETIME2(7)` | NOT NULL | Scheduled start time (UTC) |
| `EndTime` | `DATETIME2(7)` | NOT NULL | Scheduled end time (UTC) |
| `CreatedAt` | `DATETIME2(7)` | NOT NULL, DEFAULT GETUTCDATE() | Creation timestamp |
| `CreatedBy` | `NVARCHAR(255)` | NOT NULL | User who created the ticket |

### Status Enum: `MaintenanceStatus`

| Value | Description |
|-------|-------------|
| `Scheduled` | Future planned maintenance |
| `Ongoing` | Currently active maintenance |
| `Done` | Completed maintenance |
| `Cancelled` | Cancelled maintenance |

---

## API Endpoints

### 1. GET `/api/maintenance/status` - Get Active Maintenance

**Authentication:** Anonymous
**Description:** Returns the current ongoing maintenance status.

**Response (200 OK):**
```json
{
  "isActive": true,
  "id": "TICK-00001",
  "reason": "Hệ thống nâng cấp database",
  "startTime": "2026-04-02T10:00:00Z",
  "endTime": "2026-04-02T12:00:00Z",
  "status": "Ongoing"
}
```

**Response (200 OK - No Active Maintenance):**
```json
{
  "status": "None"
}
```

---

### 2. GET `/api/maintenance/upcoming` - Get Upcoming Maintenance

**Authentication:** Anonymous
**Description:** Returns a list of upcoming scheduled maintenance tickets.

**Query Parameters:**
| Parameter | Type | Default | Description |
|-----------|------|---------|-------------|
| `limit` | int | 5 | Maximum number of items to return |

**Response (200 OK):**
```json
[
  {
    "id": "TICK-00002",
    "reason": "Bảo trì định kỳ",
    "startTime": "2026-04-05T00:00:00Z",
    "endTime": "2026-04-05T02:00:00Z",
    "status": "Scheduled"
  }
]
```

---

### 3. GET `/api/maintenance` - Get All Maintenance (Paginated)

**Authentication:** Admin
**Description:** Returns a paginated list of all maintenance tickets.

**Query Parameters:**
| Parameter | Type | Default | Description |
|-----------|------|---------|-------------|
| `page` | int | 1 | Page number |
| `pageSize` | int | 10 | Items per page (max 50) |
| `status` | string | null | Filter by status |

**Response (200 OK):**
```json
{
  "items": [
    {
      "id": "TICK-00001",
      "reason": "Hệ thống nâng cấp database",
      "startTime": "2026-04-02T10:00:00Z",
      "endTime": "2026-04-02T12:00:00Z",
      "status": "Ongoing",
      "createdAt": "2026-04-01T08:00:00Z",
      "createdBy": "admin@kfc.com"
    }
  ],
  "totalCount": 1,
  "page": 1,
  "pageSize": 10
}
```

---

### 4. GET `/api/maintenance/{id}` - Get Maintenance By ID

**Authentication:** Admin
**Description:** Returns details of a specific maintenance ticket.

**Path Parameters:**
| Parameter | Type | Description |
|-----------|------|-------------|
| `id` | string | Ticket ID (e.g., `TICK-00001`) |

**Response (200 OK):** Same as MaintenanceResponse
**Response (404 Not Found):**
```json
{
  "message": "Không tìm thấy ticket bảo trì"
}
```

---

### 5. POST `/api/maintenance` - Create Maintenance Ticket

**Authentication:** Admin
**Description:** Creates a new scheduled maintenance ticket.

**Request Body:**
```json
{
  "reason": "Bảo trì định kỳ hệ thống",
  "startTime": "2026-04-05T00:00:00Z",
  "endTime": "2026-04-05T02:00:00Z"
}
```

**Response (201 Created):**
```json
{
  "id": "TICK-00003",
  "reason": "Bảo trì định kỳ hệ thống",
  "startTime": "2026-04-05T00:00:00Z",
  "endTime": "2026-04-05T02:00:00Z",
  "status": "Scheduled",
  "createdAt": "2026-04-02T12:00:00Z",
  "createdBy": "admin@kfc.com"
}
```

**Response (409 Conflict):**
```json
{
  "message": "Thời gian bảo trì bị trùng với ticket TICK-00001"
}
```

---

### 6. POST `/api/maintenance/stop-now` - Stop Maintenance Immediately

**Authentication:** Admin
**Description:** Immediately stops an ongoing maintenance and marks it as Done.

**Request Body:** None

**Response (200 OK):** MaintenanceResponse with status = Done
**Response (400 Bad Request):**
```json
{
  "message": "Không có phiên bảo trì nào đang diễn ra"
}
```

---

### 7. PUT `/api/maintenance/{id}` - Update Maintenance Ticket

**Authentication:** Admin
**Description:** Updates an existing maintenance ticket.

**Request Body:**
```json
{
  "reason": "Lý do đã cập nhật",
  "startTime": "2026-04-05T01:00:00Z",
  "endTime": "2026-04-05T03:00:00Z",
  "status": "Scheduled"
}
```

**Response (200 OK):** Updated MaintenanceResponse
**Response (400 Bad Request):**
```json
{
  "message": "Không thể cập nhật ticket đã hoàn thành"
}
```

---

### 8. DELETE `/api/maintenance/{id}` - Cancel Maintenance Ticket

**Authentication:** Admin
**Description:** Cancels a scheduled or ongoing maintenance ticket (soft delete).

**Response (200 OK):**
```json
{
  "message": "Đã hủy ticket bảo trì thành công"
}
```

**Response (400 Bad Request):**
```json
{
  "message": "Không thể hủy ticket đã hoàn thành"
}
```

---

## System Validation Rules

### Create (POST /)

| Field | Rule | Error Message |
|-------|------|---------------|
| `Reason` | Required | "Reason is required" |
| `Reason` | Not empty/whitespace | "Reason cannot be empty" |
| `Reason` | Max 500 characters | "Reason cannot exceed 500 characters" |
| `StartTime` | Must be in the future | "Start time must be in the future" |
| `StartTime < EndTime` | Must be true | "Start time must be earlier than end time" |
| No overlap | Cannot overlap with Scheduled/Ongoing | "Maintenance window overlaps" |

### Update (PUT /{id})

| Rule | Error Message |
|------|---------------|
| Ticket exists | "Không tìm thấy ticket bảo trì" |
| Status = Scheduled or Ongoing | "Không thể cập nhật ticket đã hoàn thành" |
| No overlap | "Maintenance window overlaps" |

### Delete (DELETE /{id})

| Rule | Error Message |
|------|---------------|
| Status = Scheduled or Ongoing | "Không thể hủy ticket đã hoàn thành" |

---

## System Business Rules

### Status State Machine
```
Scheduled → Ongoing → Done
    ↓            ↓
 Cancelled    Cancelled
```

### Admin Operations Summary

| Action | Conditions |
|--------|------------|
| Create ticket | `startTime > now`, no overlap |
| Update ticket | Status = Scheduled or Ongoing |
| Cancel ticket | Status = Scheduled or Ongoing |
| Stop now | Status = Ongoing exists |

---

## Background Worker

**Class:** `MaintenanceWorker`
**Interval:** 60 seconds

**Logic:**
1. Scheduled → Ongoing: `now >= StartTime AND now <= EndTime`
2. Ongoing → Done: `now > EndTime`

---

## Gateway Middleware

**Class:** `MaintenanceMiddleware`
**Location:** `GatewayAPI/Middleware/MaintenanceMiddleware.cs`

**Exempt Routes:**
- `/api/v1/admin/*`
- `/api/v1/system/maintenance/*`
- `/api/v1/auth/*`
- Admin role bypass

**Fail-Open:** If System service unreachable, allow traffic

---

# INVENTORY APIS

## Overview

| Item | Value |
|------|-------|
| **Database** | `OJTSP26_inventory` |
| **Base Route** | `/api/{resource}` |
| **Authentication** | JWT Bearer Token |

---

## Database Schema

### Core Tables

| Table | Description |
|-------|-------------|
| `categories` | Product categories (hierarchical) |
| `current_inventory` | Real-time stock levels |
| `customers` | Customer information |
| `inventory_adjustments` | Inventory counting vouchers |
| `locations` | Warehouse locations (bins, shelves) |
| `product_lots` | Batch/lot tracking |
| `products` | Product catalog |
| `purchase_orders` | Purchase orders |
| `purchase_order_items` | PO line items |
| `reordering_rules` | Min/max reorder rules |
| `sale_orders` | Sale orders |
| `sale_order_items` | SO line items |
| `scrap_orders` | Scrap/write-off orders |
| `scrap_order_items` | Scrap line items |
| `stock_documents` | Stock movement documents |
| `stock_transactions` | Individual stock movements |
| `suppliers` | Supplier information |
| `transfer_orders` | Stock transfer orders |
| `transfer_order_items` | Transfer line items |
| `uom` | Units of measure |
| `warehouses` | Warehouse information |

---

## Inventory API Endpoints

### Products (`/api/products`)

| Method | Endpoint | Auth | Description |
|--------|----------|------|-------------|
| GET | `/api/products` | - | Paginated product list with search/filters |
| GET | `/api/products/{id}` | - | Get product by ID |
| GET | `/api/products/code/{code}` | - | Get product by code |
| GET | `/api/products/location/{locationId}` | - | Get products by location |
| POST | `/api/products` | Admin | Create new product |
| PUT | `/api/products/{id}` | Admin | Update product |
| DELETE | `/api/products/{id}` | Admin | Soft delete (archive) |
| PATCH | `/api/products/{id}/restore` | Admin | Restore archived product |
| POST | `/api/products/calculate-price` | - | Calculate suggested sale price |

**CreateProductDto:**
```json
{
  "Name": "string (required, max 255)",
  "Code": "string (required)",
  "ProductType": "Storable|Consumable|Service",
  "BaseUomId": "int (> 0)",
  "PurchaseUomId": "int?",
  "CategoryId": "int?",
  "SalePrice": "decimal?",
  "StockPrice": "decimal?"
}
```

---

### Categories (`/api/categories`)

| Method | Endpoint | Auth | Description |
|--------|----------|------|-------------|
| GET | `/api/categories` | - | Get all categories |
| GET | `/api/categories/tree` | - | Full category tree |
| GET | `/api/categories/{id}` | - | Get category by ID |
| GET | `/api/categories/{id}/tree` | - | Sub-tree starting at category |
| GET | `/api/categories/{id}/children` | - | All child IDs |
| POST | `/api/categories` | Admin | Create category |
| PUT | `/api/categories/{id}/name` | Admin | Update category name |
| PATCH | `/api/categories/{id}/status` | Admin | Toggle active status |

**CreateCategoryDto:**
```json
{
  "Name": "string (required)",
  "ParentId": "int?",
  "IsActive": "bool?"
}
```

---

### Warehouses (`/api/warehouses`)

| Method | Endpoint | Auth | Description |
|--------|----------|------|-------------|
| GET | `/api/warehouses` | - | Paginated warehouse list |
| GET | `/api/warehouses/all` | - | All warehouses without pagination |
| GET | `/api/warehouses/{id}` | - | Get warehouse by ID |
| GET | `/api/warehouses/all/warehouse/managerId` | Manager | Get warehouses for current manager |
| POST | `/api/warehouses` | Admin | Create warehouse |
| PUT | `/api/warehouses/{id}` | Admin | Update warehouse |
| PATCH | `/api/warehouses/{id}/deactivate` | Admin | Deactivate warehouse |
| PATCH | `/api/warehouses/{id}/activate` | Admin | Activate warehouse |
| DELETE | `/api/warehouses/{id}` | Admin | Delete warehouse |

**CreateWarehouseDto:**
```json
{
  "WarehouseCode": "string (required)",
  "Name": "string (required)",
  "Address": "string?",
  "Phone": "string?",
  "Email": "string?",
  "ManagerId": "int?",
  "WarehouseType": "string?",
  "AreaSqm": "decimal?",
  "Notes": "string?",
  "IsActive": "bool?"
}
```

---

### Locations (`/api/locations`)

| Method | Endpoint | Auth | Description |
|--------|----------|------|-------------|
| GET | `/api/locations` | - | Paginated location list |
| GET | `/api/locations/all` | - | All locations without pagination |
| GET | `/api/locations/{id}` | - | Get location by ID |
| POST | `/api/locations` | Admin | Create location |
| PUT | `/api/locations/{id}` | Admin | Update location |
| PATCH | `/api/locations/{id}/deactivate` | Admin | Deactivate location |
| PATCH | `/api/locations/{id}/activate` | Admin | Activate location |
| DELETE | `/api/locations/{id}` | Admin | Delete location |

**CreateLocationDto:**
```json
{
  "Name": "string (required)",
  "Type": "string (required)",
  "WarehouseId": "int (required)",
  "ParentId": "int?"
}
```

---

### UOMs (`/api/uoms`)

| Method | Endpoint | Auth | Description |
|--------|----------|------|-------------|
| GET | `/api/uoms` | - | Paginated UOM list |
| GET | `/api/uoms/all` | - | All UOMs without pagination |
| GET | `/api/uoms/categories` | - | All UOM categories |
| GET | `/api/uoms/category/{category}` | - | UOMs by category |
| GET | `/api/uoms/{id}` | - | Get UOM by ID |
| POST | `/api/uoms` | Admin | Create UOM |
| POST | `/api/uoms/base-unit` | Admin | Create base unit for category |
| PUT | `/api/uoms/{id}` | Admin | Update UOM |
| PUT | `/api/uoms/{id}/base-unit` | Admin | Update base unit |
| PUT | `/api/uoms/base-unit/category` | Admin | Update base unit by category |
| DELETE | `/api/uoms/{id}` | Admin | Delete UOM |

---

### Suppliers (`/api/suppliers`)

| Method | Endpoint | Auth | Description |
|--------|----------|------|-------------|
| GET | `/api/suppliers` | - | Paginated supplier list |
| GET | `/api/suppliers/{id}` | - | Get supplier by ID |
| POST | `/api/suppliers` | Admin | Create supplier |
| PUT | `/api/suppliers/{id}` | Admin | Update supplier |
| DELETE | `/api/suppliers/{id}` | Admin | Soft delete supplier |
| POST | `/api/suppliers/{id}/reactivate` | Admin | Reactivate deleted supplier |

**CreateSupplierRequest:**
```json
{
  "Name": "string (required, max 255)",
  "ContactPerson": "string (required, max 255)",
  "Phone": "string (required, pattern: ^\\+?[0-9]{10,12}$, max 20)",
  "Email": "string (required, valid email, max 255)",
  "Address": "string (max 500)"
}
```

---

### Customers (`/api/customers`)

| Method | Endpoint | Auth | Description |
|--------|----------|------|-------------|
| GET | `/api/customers` | - | Paginated customer list |
| GET | `/api/customers/{id}` | - | Get customer by ID |
| POST | `/api/customers` | Admin | Create customer |
| PUT | `/api/customers/{id}` | Admin | Update customer |
| DELETE | `/api/customers/{id}` | Admin | Soft delete customer |
| POST | `/api/customers/{id}/reactivate` | Admin | Reactivate deleted customer |

**CreateCustomerRequest:**
```json
{
  "CustomerName": "string (required, max 255)",
  "Phone": "string (required, pattern: ^\\+?[0-9]{10,12}$, max 12)",
  "Email": "string (required, valid email, max 255)",
  "Address": "string (max 500)"
}
```

---

### Purchase Orders (`/api/purchaseorders`)

| Method | Endpoint | Auth | Description |
|--------|----------|------|-------------|
| GET | `/api/purchaseorders` | - | Get all purchase orders |
| GET | `/api/purchaseorders/search` | - | Search with filters |
| GET | `/api/purchaseorders/{id}` | - | Get by ID |
| GET | `/api/purchaseorders/{id}/detail` | - | Get details with items |
| GET | `/api/purchaseorders/supplier/{supplierId}` | - | Get by supplier |
| GET | `/api/purchaseorders/status/{status}` | - | Get by status |
| GET | `/api/purchaseorders/created/{date}` | - | Get by creation date |
| GET | `/api/purchaseorders/confirmed/{date}` | - | Get by confirmation date |
| GET | `/api/purchaseorders/completed/{date}` | - | Get by completion date |
| POST | `/api/purchaseorders` | Admin | Create purchase order |
| PUT | `/api/purchaseorders/{id}/supplier/{supplierId}` | Admin | Update supplier |
| PUT | `/api/purchaseorders/{id}/status/{status}` | Admin | Update status |
| POST | `/api/purchaseorders/draft` | Admin | Create draft |
| POST | `/api/purchaseorders/confirm` | Admin | Confirm PO |
| POST | `/api/purchaseorders/completed` | Admin | Complete PO |

**Status Values:** Draft, Pending, Confirmed, Completed, PartiallyReceived

---

### Sale Orders (`/api/saleorders`)

| Method | Endpoint | Auth | Description |
|--------|----------|------|-------------|
| GET | `/api/saleorders` | - | Paginated sale orders |
| GET | `/api/saleorders/{id}` | - | Get by ID |
| GET | `/api/saleorders/status-count` | - | Count by status |
| POST | `/api/saleorders` | Admin | Create sale order |
| PUT | `/api/saleorders/{id}` | Admin | Update header |
| DELETE | `/api/saleorders/{id}` | Admin | Delete order |
| POST | `/api/saleorders/{id}/items` | Admin | Add item |
| PUT | `/api/saleorders/{id}/items/{itemId}` | Admin | Update item |
| DELETE | `/api/saleorders/{id}/items/{itemId}` | Admin | Delete item |
| POST | `/api/saleorders/{id}/check-availability` | - | Check stock |
| POST | `/api/saleorders/{id}/complete` | Admin | Complete (ready→done) |
| POST | `/api/saleorders/{id}/cancel` | Admin | Cancel order |

**CreateSaleOrderDto:**
```json
{
  "PlannedDate": "datetime",
  "CustomerId": "int",
  "LocationId": "int?",
  "ToLocationId": "int?",
  "Note": "string?",
  "Items": [
    {
      "ProductId": "int",
      "OrderedQty": "decimal",
      "UnitPrice": "decimal"
    }
  ]
}
```

**Status Flow:** `draft → waiting/ready → done/cancelled`

---

### Transfer Orders (`/api/transferorders`)

| Method | Endpoint | Auth | Description |
|--------|----------|------|-------------|
| GET | `/api/transferorders` | - | Paginated transfer orders |
| GET | `/api/transferorders/{id}` | - | Get by ID |
| GET | `/api/transferorders/status-count` | - | Count by status |
| POST | `/api/transferorders` | Admin | Create transfer order |
| POST | `/api/transferorders/create-by-location` | Admin | Create by location |
| PUT | `/api/transferorders/{id}` | Admin | Update header |
| DELETE | `/api/transferorders/{id}` | Admin | Delete order |
| POST | `/api/transferorders/{id}/items` | Admin | Add item |
| PUT | `/api/transferorders/{id}/items/{itemId}` | Admin | Update item |
| DELETE | `/api/transferorders/{id}/items/{itemId}` | Admin | Delete item |
| POST | `/api/transferorders/{id}/check-availability` | - | Check stock |
| POST | `/api/transferorders/{id}/complete` | Admin | Complete transfer |
| POST | `/api/transferorders/{id}/cancel` | Admin | Cancel transfer |

**CreateTransferOrderDto:**
```json
{
  "PlannedDate": "datetime",
  "WarehouseId": "int",
  "FromLocationId": "int",
  "ToLocationId": "int",
  "Note": "string?",
  "Items": [
    {
      "ProductId": "int",
      "RequestedQty": "decimal"
    }
  ]
}
```

**Business Rules:**
- FromLocation ≠ ToLocation
- Only draft orders can be updated/deleted
- Complete: deducts from source, adds to destination

---

### Scrap Orders (`/api/scraporders`)

| Method | Endpoint | Auth | Description |
|--------|----------|------|-------------|
| GET | `/api/scraporders` | - | Paginated scrap orders |
| GET | `/api/scraporders/{id}` | - | Get by ID |
| GET | `/api/scraporders/status-count` | - | Count by status |
| POST | `/api/scraporders` | Admin | Create scrap order |
| PUT | `/api/scraporders/{id}` | Admin | Update scrap order |
| DELETE | `/api/scraporders/{id}` | Admin | Delete order |
| POST | `/api/scraporders/{id}/check-availability` | - | Check stock |
| POST | `/api/scraporders/{id}/complete` | Admin | Complete scrap |
| POST | `/api/scraporders/{id}/cancel` | Admin | Cancel scrap |

**CreateScrapOrderDto:**
```json
{
  "WarehouseId": "int",
  "LocationId": "int",
  "Item": {
    "ProductId": "int",
    "Quantity": "decimal",
    "UomId": "int?",
    "LotId": "int?",
    "Reason": "string?"
  }
}
```

**Status Flow:** `draft → ready → done/cancelled`

---

### Stock Documents (`/api/stockdocuments`)

| Method | Endpoint | Auth | Description |
|--------|----------|------|-------------|
| GET | `/api/stockdocuments` | - | Paginated documents |
| GET | `/api/stockdocuments/{id}` | - | Document with transactions |
| GET | `/api/stockdocuments/status-count` | - | Count by status |
| GET | `/api/stockdocuments/by-type/{type}` | - | Get by document type |
| GET | `/api/stockdocuments/by-status/{status}` | - | Get by status |

**Query Parameters:** status, documentType, search, warehouseId, locationId, productId, lotId, fromDate, toDate, createdByUserId, dateType

---

### Product Lots (`/api/productlots`)

| Method | Endpoint | Auth | Description |
|--------|----------|------|-------------|
| GET | `/api/productlots` | - | Paginated lots |
| GET | `/api/productlots/all` | - | All without pagination |
| GET | `/api/productlots/search` | - | Search with filters |
| GET | `/api/productlots/{id}` | - | Get by ID |
| GET | `/api/productlots/location/{locationId}` | - | Get by location |
| GET | `/api/productlots/location/{locationId}/product/{productId}` | - | By location & product |
| POST | `/api/productlots` | Admin | Create lot |
| PUT | `/api/productlots/{id}` | Admin | Update lot |
| DELETE | `/api/productlots/{id}` | Admin | Delete lot |

**CreateProductLotDto:**
```json
{
  "ProductId": "int",
  "LotNumber": "string",
  "ExpirationDate": "datetime?"
}
```

---

### Reordering Rules (`/api/reorderingrule`)

| Method | Endpoint | Auth | Description |
|--------|----------|------|-------------|
| GET | `/api/reorderingrule` | - | Paginated rules |
| GET | `/api/reorderingrule/{locationId}` | - | Get by location |
| POST | `/api/reorderingrule` | Admin | Create rule |
| PUT | `/api/reorderingrule/{locationId}/{productId}` | Admin | Update rule |
| DELETE | `/api/reorderingrule/{locationId}/{productId}` | Admin | Soft delete rule |
| POST | `/api/reorderingrule/{locationId}/{productId}/reactivate` | Admin | Reactivate rule |

**CreateReorderingRuleRequest:**
```json
{
  "ProductId": "int",
  "LocationId": "int",
  "MinQty": "decimal",
  "MaxQty": "decimal",
  "TriggerType": "string",
  "IsActive": "bool?"
}
```

---

### Inventory Adjustment (`/api/inventoryadjustment`)

| Method | Endpoint | Auth | Description |
|--------|----------|------|-------------|
| POST | `/api/inventoryadjustment/draft` | Manager | Create draft adjustment |
| POST | `/api/inventoryadjustment/complete` | Manager | Complete adjustment |
| GET | `/api/inventoryadjustment/manager-inventories` | Manager | Get manager's inventories |
| GET | `/api/inventoryadjustment/staff-work` | Staff | Get staff work list |
| PUT | `/api/inventoryadjustment/update-count` | Staff | Update counted quantity |

---

### Dashboard (`/api/dashboard`)

| Method | Endpoint | Auth | Description |
|--------|----------|------|-------------|
| GET | `/api/dashboard/trend` | - | Inventory trend |
| GET | `/api/dashboard/category-product-counts` | - | Product count by category |
| GET | `/api/dashboard/warehouse-inventory` | Admin | Warehouse inventory |
| GET | `/api/dashboard/manager-warehouse-inventory` | Manager | Manager's warehouse inventory |

---

## Inventory Validation Rules

### Common Rules (from ValidationRules.cs)

| Rule | Constraint |
|------|------------|
| Money fields | >= 0, max 2 decimal places, max 9999999999999999.99 |
| Quantity fields | max 3 decimal places, max 999999999999999.999 |
| Text fields | max 255 characters |
| Address fields | max 500 characters |

### Supplier Validation
- Name: Required, max 255
- ContactPerson: Required, max 255
- Phone: Required, pattern `^\+?[0-9]{10,12}$`, max 20
- Email: Required, valid format, max 255

### Customer Validation
- CustomerName: Required, max 255
- Phone: Required, pattern `^\+?[0-9]{10,12}$`, max 12
- Email: Required, valid format, max 255

---

# AUTHENTICATION APIS

## Overview

| Item | Value |
|------|-------|
| **Database** | `OJTSP26_identity` |
| **Base Route** | `/api/auth`, `/api/user`, `/api/role` |
| **Authentication** | JWT Bearer Token |
| **Algorithm** | HMAC SHA256 |

---

## Database Schema

### Database: `OJTSP26_identity`

#### Table: `Roles`

| Column | Type | Constraints |
|--------|------|-------------|
| `id` | INT | PRIMARY KEY, IDENTITY(1,1) |
| `name` | NVARCHAR(30) | NOT NULL, UNIQUE |

#### Table: `Users`

| Column | Type | Constraints |
|--------|------|-------------|
| `id` | INT | PRIMARY KEY, IDENTITY(1,1) |
| `username` | NVARCHAR(50) | NOT NULL, UNIQUE |
| `email` | NVARCHAR(100) | NOT NULL, UNIQUE |
| `password_hash` | NVARCHAR(255) | NOT NULL |
| `role_id` | INT | NOT NULL, FK → Roles(id) |
| `status` | NVARCHAR(20) | NOT NULL, DEFAULT 'Active' |
| `created_at` | DATETIME | NULL |
| `fullname` | NVARCHAR(50) | NULL |
| `phone` | NVARCHAR(12) | NULL |
| `manager_id` | INT | NULL, FK → Users(id) |
| `is_active_mail` | BIT | NOT NULL, DEFAULT 0 |

#### Table: `EmailVerificationTokens`

| Column | Type | Constraints |
|--------|------|-------------|
| `id` | INT | PRIMARY KEY, IDENTITY(1,1) |
| `user_id` | INT | NOT NULL, FK → Users(id) ON DELETE CASCADE |
| `otp_code` | NVARCHAR(10) | NOT NULL |
| `expiration_time` | DATETIME2 | NOT NULL |
| `is_used` | BIT | NOT NULL, DEFAULT 0 |
| `created_at` | DATETIME2 | NOT NULL, DEFAULT GETDATE() |

#### Table: `PasswordResetTokens`

| Column | Type | Constraints |
|--------|------|-------------|
| `id` | INT | PRIMARY KEY, IDENTITY(1,1) |
| `user_id` | INT | NOT NULL, FK → Users(id) ON DELETE CASCADE |
| `otp_code` | NVARCHAR(10) | NOT NULL |
| `expiration_time` | DATETIME | NOT NULL |
| `is_used` | BIT | NOT NULL, DEFAULT 0 |
| `created_at` | DATETIME | NOT NULL, DEFAULT GETDATE() |

---

## JWT Configuration

| Parameter | Source |
|-----------|--------|
| Algorithm | HmacSha256Signature |
| Expiration | Config: `Jwt:ExpirationInMinutes` (default: 60 min) |
| Issuer | Config: `Jwt:Issuer` |
| Audience | Config: `Jwt:Audience` |
| Secret Key | Config: `Jwt:Key` |

**Token Claims:**
```
- NameIdentifier → User.Id
- Name → User.Username
- Email → User.Email
- Role → User.Role.Name
- Fullname → User.Fullname
- Phone → User.Phone
- ManagerId → User.ManagerId (or "null")
```

---

## Auth API Endpoints

### AuthController (`/api/auth`)

#### POST `/api/auth/login` - Login

**Authentication:** Anonymous
**Description:** Login with username or email

**Request:**
```json
{
  "EmailOrUsername": "string",
  "Password": "string"
}
```

**Response (200 OK):**
```json
{
  "token": "string",
  "username": "string",
  "email": "string",
  "fullname": "string",
  "phone": "string",
  "role": "string",
  "expiresAt": "datetime"
}
```

**Business Rules:**
- Login with username OR email
- Account status must be "Active"
- Email must be verified (`isActiveMail == true`)

---

#### GET `/api/auth/current-profile` - Get Current Profile

**Authentication:** Required
**Description:** Get profile of logged-in user

**Response (200 OK):**
```json
{
  "id": "int",
  "username": "string",
  "email": "string",
  "fullname": "string",
  "phone": "string",
  "role": "string",
  "managerId": "int?"
}
```

---

#### POST `/api/auth/verify-otp` - Verify OTP

**Authentication:** Anonymous
**Description:** Verify OTP code for password reset

**Request:**
```json
{
  "OtpCode": "string (6 digits)"
}
```

**Response (200 OK):**
```json
{
  "valid": true,
  "message": "string"
}
```

---

#### POST `/api/auth/forgot-password` - Request Password Reset

**Authentication:** Anonymous
**Description:** Request OTP for password reset

**Request:**
```json
{
  "Email": "string (valid email)"
}
```

**Response (200 OK):**
```json
{
  "message": "OTP đã được gửi đến email của bạn."
}
```

**Business Rules:**
- Email must exist in system
- Account status must be "Active"
- Generates 6-digit OTP valid for 5 minutes
- Sends OTP via email

---

#### POST `/api/auth/reset-password/otp` - Reset Password with OTP

**Authentication:** Anonymous
**Description:** Reset password using OTP

**Request:**
```json
{
  "Email": "string",
  "OtpCode": "string",
  "NewPassword": "string",
  "ConfirmPassword": "string"
}
```

**Response (200 OK):**
```json
{
  "message": "Đặt lại mật khẩu thành công."
}
```

**Business Rules:**
- NewPassword must match ConfirmPassword
- OTP must be valid and not expired
- Account status must be "Active"

---

#### POST `/api/auth/register` - Register

**Authentication:** Anonymous
**Description:** Register new user account

**Request:**
```json
{
  "Username": "string (min 3 chars)",
  "Password": "string (strong password)",
  "Email": "string (valid email)",
  "Fullname": "string (min 3 chars)",
  "Phone": "string (pattern: ^\\+?[0-9]\\d{1,12}$)"
}
```

**Response (200 OK):**
```json
{
  "id": "int",
  "username": "string",
  "email": "string",
  "fullname": "string",
  "phone": "string",
  "role": "Staff",
  "managerId": "int?",
  "isActiveMail": false
}
```

**Business Rules:**
- Email must be unique
- Username must be unique
- Default role is "Staff"
- Initial status is "Pending"
- Email verification required before login
- Verification email sent automatically

---

#### POST `/api/auth/send-verification-email` - Resend Verification Email

**Authentication:** Anonymous
**Description:** Resend email verification code

**Request:**
```json
{
  "Email": "string"
}
```

---

#### POST `/api/auth/verify-email` - Verify Email

**Authentication:** Anonymous
**Description:** Verify email address

**Request:**
```json
{
  "Email": "string",
  "OtpCode": "string"
}
```

**Response (200 OK):**
```json
{
  "valid": true,
  "message": "Xác thực email thành công!"
}
```

**Business Rules:**
- OTP must be valid and not expired
- On success: User status → "Active", `isActiveMail = true`

---

## User API Endpoints

### UserController (`/api/user`)

#### GET `/api/user` - Get All Users (Paginated)

**Authentication:** Required
**Description:** Get paginated list of all users

**Query Parameters:**
| Parameter | Type | Default | Description |
|-----------|------|---------|-------------|
| page | int | 1 | Page number |
| pageSize | int | 10 | Items per page (1-100) |
| isActive | bool? | null | Filter by active status |
| search | string? | null | Search username/email |
| roleId | int? | null | Filter by role |
| isActiveEmail | bool? | null | Filter by email verified |
| isUnassignedManager | bool? | null | Filter unassigned staff |

**Response (200 OK):**
```json
{
  "items": [...],
  "page": 1,
  "pageSize": 10,
  "totalItems": 100,
  "totalPages": 10,
  "hasNext": true,
  "hasPrevious": false
}
```

---

#### GET `/api/user/{id}` - Get User By ID

**Authentication:** Required

**Response (200 OK):** User object

---

#### POST `/api/user` - Create User

**Authentication:** Admin
**Description:** Create new user (Admin only)

**Request:**
```json
{
  "Username": "string",
  "Password": "string",
  "Email": "string",
  "Fullname": "string",
  "Phone": "string",
  "RoleId": "int"
}
```

**Response (201 Created):** Created user object

**Business Rules:**
- Email must be unique
- Username must be unique
- Initial status is "Pending"
- Verification email sent automatically

---

#### PUT `/api/user/{id}` - Update User

**Authentication:** Required (self or Admin)
**Description:** Update user info

**Request:**
```json
{
  "Fullname": "string",
  "Phone": "string"
}
```

---

#### PUT `/api/user/{id}/password` - Update Password

**Authentication:** Required (self only)
**Description:** Update user password

**Request:**
```json
{
  "CurrentPassword": "string",
  "NewPassword": "string"
}
```

**Business Rules:**
- Current password must be verified
- New password must meet strong password requirements

---

#### PUT `/api/user/{id}/user-role` - Update User Role

**Authentication:** Admin
**Description:** Update user role (Admin only)

**Request:**
```json
{
  "RoleId": "int"
}
```

---

#### DELETE `/api/user/{id}` - Soft Delete User

**Authentication:** Admin
**Response:** 204 No Content

---

#### POST `/api/user/{id}/reactivate` - Reactivate User

**Authentication:** Admin
**Description:** Reactivate a locked/deleted user

**Response:** 204 No Content

---

#### PUT `/api/user/{staffId}/assign-manager/{managerId}` - Assign Manager

**Authentication:** Required
**Description:** Assign a manager to a staff user

**Business Rules:**
- Staff cannot be their own manager
- Manager must have role "Manager" or "Admin"

---

#### PUT `/api/user/{staffId}/unassign-manager` - Unassign Manager

**Authentication:** Required
**Description:** Unassign manager from staff

**Business Rules:**
- Admin can unassign any staff's manager
- Manager can only unassign their own staff

---

#### GET `/api/user/employees` - Get Employees

**Authentication:** Manager
**Description:** Get employees under current manager

**Business Rules:**
- Only users with Manager role can access
- Returns users where ManagerId = current user

---

## Role API Endpoints

### RoleController (`/api/role`)

| Method | Endpoint | Auth | Description |
|--------|----------|------|-------------|
| GET | `/api/role` | Admin | Get all roles |
| GET | `/api/role/{id}` | Admin | Get role by ID |
| POST | `/api/role` | Admin | Create role |
| PUT | `/api/role/{id}` | Admin | Update role |
| DELETE | `/api/role/{id}` | Admin | Delete role |

**CreateRoleDto:**
```json
{
  "Name": "string (required, max 50)"
}
```

---

## Auth Validation Rules

| Field | Rule |
|-------|------|
| Password | Min 8 chars, 1 uppercase, 1 lowercase, 1 digit, 1 special char |
| Email | Valid email format |
| Phone | Pattern: `^\+?[0-9]\d{1,12}$` (1-13 digits) |
| Username/Fullname | Min 3 characters |
| OTP Code | Exactly 6 digits |

---

## User Status Flow

```
Pending (registration) → Active (email verified) → Inactive/Deleted (soft delete)
                        → Locked (admin action) → Active (reactivated)
```

---

## Role Types

| Role | Description |
|------|-------------|
| **Staff** | Default role for new registrations |
| **Manager** | Can manage assigned staff |
| **Admin** | Full system access |

---

## Authentication Flows

### Registration Flow
1. User submits registration form
2. System validates uniqueness of email/username
3. Creates user with "Pending" status
4. Generates email verification OTP (30 min expiry)
5. Sends verification email
6. User verifies email with OTP
7. Status → "Active", `isActiveMail = true`

### Login Flow
1. User submits email/username + password
2. System finds user by email or username
3. Checks account status is "Active"
4. Checks email is verified
5. Verifies password hash
6. Generates JWT token with user claims
7. Returns token + user info

### Password Reset Flow
1. User requests password reset with email
2. System validates account exists and is "Active"
3. Generates OTP (5 min expiry)
4. Sends OTP via email
5. User submits OTP + new password
6. System validates OTP, updates password
7. Sends password change confirmation email

---

## File Reference

### System APIs
| File | Purpose |
|------|---------|
| `Services/System/System.Domain/Entities/SystemMaintenance.cs` | Domain entity |
| `Services/System/System.Application/Services/MaintenanceService.cs` | Service implementation |
| `Services/System/System.Presentation/Controllers/MaintenanceController.cs` | API controller |
| `Services/System/System.Presentation/BackgroundTasks/MaintenanceWorker.cs` | Background worker |
| `GatewayAPI/Middleware/MaintenanceMiddleware.cs` | Gateway blocking middleware |
| `Databases/Schema/03_system.sql` | Database schema |

### Inventory APIs
| File | Purpose |
|------|---------|
| `Services/Inventory/Inventory.Presentation/Controllers/*.cs` | All controllers |
| `Services/Inventory/Inventory.Domain/Entities/*.cs` | Domain entities |
| `Services/Inventory/Inventory.Application/DTOs/*.cs` | Request/Response DTOs |
| `Databases/Schema/02_inventory.sql` | Database schema |

### Auth APIs
| File | Purpose |
|------|---------|
| `Services/Authentication/Authentication.Presentation/Controllers/AuthController.cs` | Auth endpoints |
| `Services/Authentication/Authentication.Presentation/Controllers/UserController.cs` | User endpoints |
| `Services/Authentication/Authentication.Presentation/Controllers/RoleController.cs` | Role endpoints |
| `Services/Authentication/Authentication.Application/Services/AuthenticationService.cs` | Auth service |
| `Services/Authentication/Authentication.Application/Services/UserService.cs` | User service |
| `Services/Authentication/Authentication.Domain/Entities/User.cs` | User entity |
| `BuildingBlocks/Security/JwtExtensions.cs` | JWT configuration |
| `Databases/Schema/01_identity.sql` | Database schema |

---

*Last Updated: 2026-04-02*
