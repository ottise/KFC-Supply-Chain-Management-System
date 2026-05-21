# Changelog

All notable changes to this project will be documented in this file.

The format is based on [Keep a Changelog](https://keepachangelog.com/en/1.0.0/),
and this project adheres to [Semantic Versioning](https://semver.org/spec/v2.0.0.html).

---

## [0.9.3] - 2026-03-26

### Added
- NEW Deployment Guide for Docker Hub and VPS staging.
- Implement container **Healthchecks** and **Resource Limits** (CPU/Memory) for all microservices.
- Standardize SQL initialization with automatic schema reset and sample data loading.
- Add manager-scoped filtering for **Stock Documents** and **Stock Transactions**.
- Expose **Manager List**, **Assigned Staff**, and **Bulk Unassign** endpoints in `UserController`.
- Support filtering staff by "Unassigned Manager" status in user queries.
- Add `createdAt` timestamp to user listing and detail responses.

### Changed
- Optimize Docker build process with refined `.dockerignore` for multi-platform compatibility.
- Update Identity schema to include missing `fullname`, `phone`, and `is_active_mail` columns.
- Refactor **Scrap Order** status count and listing services to respect manager scope.
- Harden Docker Compose infrastructure with bridge network isolation and host port flexibility.

### Fixed
- **Persistent 500 Error**: Resolve database schema mismatch during Authentication login flow.
- Block password reset/OTP requests for inactive users with proper `UnauthorizedException` propagation.
- Fix role-name string comparison bug in administrative access checks.
- Resolve incorrect method selector in global error handler.

---

## [0.9.2] - 2026-03-22 to 2026-03-23

### Added
- Pass manager and user context in Scrap Order list endpoint.
- Add manager-scoped filtering and accent-insensitive search for Scrap Orders.
- Add `isActiveEmail` filter to Authentication module.

### Changed
- Update `IScrapOrderService` interface for manager-scoped listing.
- Update status count service signature with manager scope parameter.

### Fixed
- Scope Scrap Order status count by manager warehouses only.

---

## [0.9.1] - 2026-03-20 to 2026-03-21

### Added
- Add API to report all documents by time range (Dashboard).
- Add total count for each product type to Dashboard.
- Support accent-insensitive product search in Inventory.
- Add Dashboard features and endpoints (`DashboardController`).

### Fixed
- Add `docId` to Purchase Order response DTO.
- Upgrade `get Sale Order` API to include user and manager context.
- Add `tranType` validation for inventory adjustment.
- Fix inventory adjustment logic.
- Add `userId` and `managerId` to Sale Order list API response.
- Clean up Sale Order API response structure for clarity.

---

## [0.9.0] - 2026-03-18 to 2026-03-19

### Added
- Allow finding product lots by location.
- Implement product status filtering, advanced search, and price calculation logic.
- Add `Update` and `Delete` endpoints for Scrap Orders.
- Add `GetByCodeWithLocationsAsync` to `IWarehouseRepository`.
- Add audit and virtual location properties to `ScrapOrder` DTOs.
- Implement RBAC and update search parameters in Inventory controllers.
- Implement expanded location search and RBAC filtering in Inventory services.
- Standardize search parameters to `locationName` and add `Note` fields to order entities.
- Add creator tracking and `Note` fields to order entities.
- Add `Items` to Purchase Order DTO.
- Add additional response fields for Purchase Order API.
- Add Reordering Rule CRUD and validations.
- Update Reordering Rule trigger types to `Automatic` / `Manual`.

### Changed
- Change API response structure for consistency.
- Simplify Purchase Order validations.
- Rename order document types to PascalCase.

### Fixed
- Fix showing Purchase Orders for users without Warehouse access.
- Fix inventory adjustment logic.
- Fix logic thread in purchase order execution.
- Implement robust validation, single-item logic, and transactional integrity for Scrap Orders.
- Resolve redundant transaction and `SaveChanges` calls in `UnitOfWork`.
- Fix purchase service execution thread.

---

## [0.8.0] - 2026-03-14 to 2026-03-17

### Added
- Implement full Scrap Order workflow (create, update, delete, status count).
- Add `ScrapOrderDto`, `ScrapOrderDetailDto`, `ScrapOrderListItemDto`, `ScrapOrderStatusCountDto`.
- Add `CreateScrapOrderDto`, `CreateScrapOrderItemDto`.
- Add Scrap Order status enum.
- Add Scrap Order item validator and create validator.
- Add Scrap Order endpoints and repository contract.
- Expand Scrap Order service contract.
- Add `GetAll` stock documents by type and by status.
- Add `UOM Name` to response.
- Add new Inventory controller.
- Secure `StockOrder` endpoints with JWT manager authorization.
- Implement manager-based auth and `PlannedDate` mapping in services.
- Apply `PlannedDate` to order DTOs and update Warehouse DTOs.
- Add `ManagerId` to `Warehouse` entity and update status constants.
- Add inventory queries for lot-based availability.
- Expose `fromLocation` / `toLocation` in Sale Order list DTO and detail DTO.
- Add `ToLocationId` to create and update sale order DTO.

### Changed
- Update transfer orders API flow validations.
- Adjust stock transactions and documents API behavior.
- Update sale orders API flow validations.
- Validate `ToLocationId` on create and update sale order.
- Replace `GetAll` with `GetByDocumentId` in stock transactions; add manager access control; enrich DTO with navigation names.
- Restrict stock documents to GET-only APIs with manager-based access control; remove PUT location endpoint.
- Refactor claim retrieval methods for consistency and clarity.
- Refactor `GetByIdAsync` to remove duplicate warehouse retrieval logic.
- Update `Authentication.Presentation`, `Authentication.Infrastructure`, `Authentication.Application` package refs.
- Update inventory database schema script.
- Update inventory sample data.
- Remove legacy `ScrapOrderDto` and `ScrapOrderItemDto`.

### Fixed
- Add `UomId` and `PlannedDate` to `StockTransaction` in `AddItem` and `UpdateItem`.
- Fix 8 bugs in `TransferOrder` — duplicate `productId`, cancel `completed_at`, `reserved_qty`, `MarkDone` stock deduction, draft-only CRUD, `UomId`/`PlannedDate` in item sync, validate items before saving.
- Align transfer order flow with lot-based reserve/complete.
- Fix sale order flow for lot-based reserve/complete/cancel.
- Fix stock document logic.
- Fix inventory adjustment.
- Fix Location validation (warehouse/parent active) and add ScrapOrder tables + GET all API.
- Remove `AuthenticationOptions` from inventory route in Ocelot configuration.
- Fix Authentication bug in role assignment flow.
- Fix incorrect method selector in error handler.

---

## [0.7.0] - 2026-03-12 to 2026-03-13

### Added
- Add `GetByDocumentIdAsync` to stock transactions for fetching transactions by stock document.
- Add `GetByLocationIdsAsync` and `CountByStatusAndLocationIdsAsync` for manager-filtered queries.
- Add Warehouse, Location, UOM — pagination, filters, unify response, authorize UOM endpoints.
- Add email verification flow and token support.
- Set new users to `Pending` status and send verification email on registration.
- Add manager assignment and role/status enums.
- Include `ManagerId` in JWT and auth response.
- Add Customer CRUD, pagination, and DTOs.
- Update Swagger descriptions for Sale Order: from `pending` to `draft` with correct status flow.
- Extend current inventory repository contract.

### Fixed
- Resolve role assignment issue on new user registration.
- Fix purchase order logic.

---

## [0.6.0] - 2026-03-09 to 2026-03-11

### Added
- New inventory adjustment workflow.
- Add CRUD APIs for UOM; add paging for Warehouse and Location.
- Add `planned_date` field for `StockTransaction` and `get all` API.
- Add `get Locations by WarehouseId` API.
- Add OTP verification endpoint and logic.
- Add registration flow and adjust user/role flows.
- Add admin user-role update endpoints.
- Add password reset endpoints and service changes.
- Add OTP password reset, mail service, and validations.
- Add authentication authorization for Warehouse and Location APIs.

### Changed
- Update delivery note logic and unify DTO/Validation base.
- Enhance delivery note logic with pagination and field validation.
- Add database queries and implement delivery note logic.
- Apply `[Authorize]` attribute to secure controller endpoints.
- Update product API and implement service validation.

### Fixed
- Fix `appsettings` configuration for Gateway and Inventory services.

---

## [0.5.0] - 2026-03-05 to 2026-03-08

### Added
- New Purchase Order and Purchase Order Item APIs.
- New Category APIs.
- Add CRUD APIs for Location and Warehouse entities.
- Add tables and `get product` API.
- Enhance Authentication service with pagination, improved error handling, and Swagger documentation.
- Add PowerShell scripts for local database initialization and sample data loading.
- Add auto-load SQL script in Docker initialization.
- Implement `get all UOM and Products` API, entities and configurations.
- Add new secret key configuration management.
- Migrate to `FluentValidation` and update controllers.
- Add OTP password reset, mail service and validations.
- Assign default role for new users.

### Added
- Add `Warehouse` entity and `get all` API for Warehouse.
- Add `UnitPrice`, `Subtotal` fields for `PurchaseOrderItem`.
- Add fields for `User` entity and `Warehouses` entity.

### Changed
- Merge Category into Inventory service.
- Ignore `appsettings` files from source control.
- Update `CreateUser` endpoint to remove admin role restriction.
- Delete secret key from `appsettings` and move to environment config.
- Remove email DTOs and strip `appsettings` from source.

### Fixed
- Fix Docker Compose build failure caused by missing `.git` folder for Husky pre-push hook.
- Fix inventory adjustment logic.

---

## [0.4.0] - 2026-03-01 to 2026-03-04

### Added
- Add `BuildingBlocks` to solution folder.
- Implement code, business logic, and refactor Authentication service.
- New inventory adjustment workflow.
- Add `Directory.Build.targets` to automate `dotnet tool restore` and Husky install before build.
- Add Husky .NET local tool configuration.
- Add pre-push hook to run dotnet Husky tasks.
- Setup Husky for pre-commit dotnet build.
- Add config for BuildingBlocks and Gateway.
- Create services, interface services, interface repositories, and repositories for Inventory service.
- Add Husky hooks and build command for each service.

### Changed
- Implement business logic product feature; configure BuildingBlocks for friendly error responses; configure Ocelot to route APIs through GatewayAPI.

---

## [0.3.0] - 2026-02-26 to 2026-02-28

### Added
- Initial design of manager assignment and role/status enum.

### Changed
- Refactor solution structure — remove unused services and create new services.
- Refactor configuration files.
- Push initial configuration files to `refactor/SonNPX` branch.

---

## [0.1.0] - 2026-02-06

**Initial Release — Project Bootstrap**

### Added
- Initial project structure: KFC Franchise Supply Chain Management System.
- Base microservices skeleton.
- Initial cleanup of base service patterns.
- Refactor parts of Authentication service (initial structure).

[0.9.3]: https://gitlab.com/kfc-supply-chain-management-system/be-ojt2026/-/compare/v0.9.2...v0.9.3
[0.9.2]: https://gitlab.com/kfc-supply-chain-management-system/be-ojt2026/-/compare/v0.9.1...v0.9.2
[0.9.1]: https://gitlab.com/kfc-supply-chain-management-system/be-ojt2026/-/compare/v0.9.0...v0.9.1
[0.9.0]: https://gitlab.com/kfc-supply-chain-management-system/be-ojt2026/-/compare/v0.8.0...v0.9.0
[0.8.0]: https://gitlab.com/kfc-supply-chain-management-system/be-ojt2026/-/compare/v0.7.0...v0.8.0
[0.7.0]: https://gitlab.com/kfc-supply-chain-management-system/be-ojt2026/-/compare/v0.6.0...v0.7.0
[0.6.0]: https://gitlab.com/kfc-supply-chain-management-system/be-ojt2026/-/compare/v0.5.0...v0.6.0
[0.5.0]: https://gitlab.com/kfc-supply-chain-management-system/be-ojt2026/-/compare/v0.4.0...v0.5.0
[0.4.0]: https://gitlab.com/kfc-supply-chain-management-system/be-ojt2026/-/compare/v0.3.0...v0.4.0
[0.3.0]: https://gitlab.com/kfc-supply-chain-management-system/be-ojt2026/-/compare/v0.1.0...v0.3.0
[0.1.0]: https://gitlab.com/kfc-supply-chain-management-system/be-ojt2026/-/tags/v0.1.0
