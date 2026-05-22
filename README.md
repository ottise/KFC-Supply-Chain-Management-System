# KFC Franchise Supply Chain Management System

Backend microservices architecture for the KFC Franchise Supply Chain Management System (OJT 2026), developed using .NET 8 and Clean Architecture principles.

---

# Overview

This project is designed following a Microservices Architecture pattern to support scalable, maintainable, and modular enterprise development.

The system manages:

- Authentication & Authorization
- Purchase Orders
- Inventory Management
- Financial Processing
- Logistics & Shipment Tracking
- Notifications
- System Monitoring & Maintenance

The repository contains:

- Backend Microservices
- API Gateway
- Shared Building Blocks
- Database Scripts
- Docker Configuration
- CI/CD & Git Hooks

---

# Architecture

## System Structure

```text
KFC-Frachise-Supply-Chain-Management-System
│
├── GatewayAPI
├── BuildingBlocks
├── Databases
├── Services
│   ├── Authentication
│   ├── System
│   ├── Purchase
│   ├── Inventory
│   ├── Finance
│   ├── Logistics
│   └── Notification
│
└── docker-compose.yml
```

---

# Microservices

| # | Service | Database | Purpose | Dev Port | Docker Port |
|---|---|---|---|---|---|
| 1 | Authentication | OJTSP26_identity | Authentication & permission-based authorization | 5001 | 8081 |
| 2 | System | OJTSP26_system | Maintenance mode, system logs, notifications | 5008 | 8082 |
| 3 | Purchase | OJTSP26_purchase | Purchase orders, supplier management, approval workflow | 5003 | 8083 |
| 4 | Inventory | OJTSP26_inventory | Warehouse management, batches, stock adjustments | 5004 | 8084 |
| 5 | Finance | OJTSP26_finance | Credit, payments, financial operations | 5005 | 8085 |
| 6 | Logistics | OJTSP26_logistics | Shipment, tracking, delivery management | 5006 | 8086 |
| 7 | Notification | OJTSP26_notification | Email/In-App notifications and delivery logs | 5007 | 8087 |

---

# Additional Components

## GatewayAPI
Centralized API Gateway using Ocelot.

- Port: `5000` (Development)
- Docker Port: `8080`

Responsibilities:
- Routing
- JWT validation
- API aggregation
- Reverse proxy
- Authentication forwarding

---

## BuildingBlocks

Shared libraries used across all services.

Includes:
- JWT Extensions
- Swagger Configuration
- Global Exception Middleware
- Health Check Extensions
- Standard API Response
- Error Catalog
- CORS Configuration

---

## Databases

Contains:
- Database schema scripts
- Seed/sample data
- Initialization scripts

```text
Databases/
├── Database/
└── Samples/
```

---

# Clean Architecture

Each service follows Clean Architecture with 4 layers:

```text
Services/<ServiceName>/
├── <ServiceName>.Domain/
├── <ServiceName>.Application/
├── <ServiceName>.Infrastructure/
└── <ServiceName>.Presentation/
```

## Layer Responsibilities

### Domain
Contains:
- Entities
- Constants
- Domain models
- Business rules

### Application
Contains:
- DTOs
- Interfaces
- MediatR handlers
- Services
- Use cases

### Infrastructure
Contains:
- EF Core
- DbContext
- Configurations
- Repository implementation
- UnitOfWork

### Presentation
Contains:
- Controllers
- Middleware
- Authorization
- Swagger
- Program.cs
- Dockerfile

---

# Technologies

## Backend
- .NET 8
- ASP.NET Core Web API
- Entity Framework Core
- MediatR
- Ocelot Gateway
- JWT Authentication

## Database
- SQL Server

## DevOps
- Docker
- Docker Compose
- Husky.Net
- GitLab CI/CD

---

# Environment Requirements

Before running the project, ensure the following tools are installed:

- .NET SDK 8.x
- SQL Server
- Docker Desktop (optional)

Check installed SDK version:

```bash
dotnet --version
```

---

# Running The Project

## Option A — Run Services Individually

### Gateway

```bash
dotnet run --project .\GatewayAPI\GatewayAPI.csproj
```

### Authentication

```bash
dotnet run --project .\Services\Authentication\Authentication.Presentation\Authentication.Presentation.csproj
```

### System

```bash
dotnet run --project .\Services\System\System.Presentation\System.Presentation.csproj
```

### Purchase

```bash
dotnet run --project .\Services\Purchase\Purchase.Presentation\Purchase.Presentation.csproj
```

### Inventory

```bash
dotnet run --project .\Services\Inventory\Inventory.Presentation\Inventory.Presentation.csproj
```

### Finance

```bash
dotnet run --project .\Services\Finance\Finance.Presentation\Finance.Presentation.csproj
```

### Logistics

```bash
dotnet run --project .\Services\Logistics\Logistics.Presentation\Logistics.Presentation.csproj
```

### Notification

```bash
dotnet run --project .\Services\Notification\Notification.Presentation\Notification.Presentation.csproj
```

---

## Option B — Run With Hot Reload

Use `dotnet watch run` for automatic reload during development.

Example:

```bash
dotnet watch run --project .\GatewayAPI\GatewayAPI.csproj
```

Apply similarly for all services.

---

## Option C — Run Using Docker Compose (Recommended)

### Run all services

```bash
docker compose up --build
```

### Run in background

```bash
docker compose up -d --build
```

### Stop containers

```bash
docker compose down
```

---

# Build & Validation

## Build Entire Solution

```bash
dotnet restore
dotnet clean
dotnet build .\KFCFranchiseSupplyChain.sln
```

---

## Build Individual Services

Example:

```bash
dotnet build .\Services\Inventory\Inventory.Presentation\Inventory.Presentation.csproj
```

---

# API Gateway & JWT Standardization

## Ocelot Environment Configuration

Gateway uses environment-specific Ocelot configuration files:

| Environment | File |
|---|---|
| Development | ocelot.Development.json |
| Docker | ocelot.Docker.json |
| Production | ocelot.Production.json |

The gateway fails startup if the correct configuration file is missing.

---

## Gateway Routes

```text
/api/v1/auth/{everything}
/api/v1/system/{everything}
/api/v1/purchase/{everything}
/api/v1/inventory/{everything}
/api/v1/finance/{everything}
/api/v1/logistics/{everything}
/api/v1/notification/{everything}
```

Example request:

```http
GET http://localhost:5000/api/v1/inventory/products
Authorization: Bearer <access_token>
```

---

# JWT Authentication

JWT tokens are issued by the Authentication Service and validated across:

- GatewayAPI
- Protected Services

JWT validation priority:

## Primary Validation

```json
Jwt:Key
Jwt:Issuer
Jwt:Audience
```

## Fallback Validation

```json
Jwt:Authority
Jwt:Audience
```

---

# Swagger & Health Checks

## Swagger

Each service exposes Swagger UI at:

```text
/swagger
```

## Health Check

Each service exposes health status at:

```text
/health
```

---

# Error Handling

Global error handling is centralized via:

- GlobalExceptionMiddleware
- JWT Events
- MiddlewareExtensions
- ErrorCatalog

Standard response format:

```json
ApiResponse<T>
```

---

# Database Scripts

Database scripts are stored under:

```text
Databases/
├── Database/
└── Samples/
```

Includes:
- Schema creation
- Seed data
- Sample records

---

# Git Workflow & Husky

The project uses Husky.Net for automated code validation before commit/push.

## Automatic Validation

Husky automatically runs:

```bash
dotnet build KFCFranchiseSupplyChain.sln --nologo --verbosity quiet
```

If build fails:
- Commit is aborted automatically.

---

## Standard Git Workflow

```bash
git checkout -b feature/your-feature
git add .
git commit -m "Your commit message"
git push -u origin feature/your-feature
```

---

## Manual Husky Validation

```bash
dotnet husky run
```

---

## Bypass Husky Hook

```bash
git commit -m "Temporary commit" --no-verify
```

---

# Development Standards

## Coding Standards

- Clean Architecture
- SOLID Principles
- Separation of Concerns
- Repository Pattern
- UnitOfWork Pattern
- Centralized Error Handling
- JWT Standardization

---

# Recommended Development Flow

1. Pull latest code
2. Create feature branch
3. Implement feature
4. Run local build
5. Test APIs
6. Commit changes
7. Push branch
8. Create Merge Request

---

# Future Improvements

Potential roadmap items:

- Kubernetes deployment
- Distributed caching
- Event-driven messaging
- Observability & tracing
- Rate limiting
- Distributed logging
- CI/CD automation enhancement

---

# Authors

Developed for:
- OJT 2026
- KFC Franchise Supply Chain Management System

---

# License

This project is intended for educational and internal enterprise training purposes.

---

# Project Status

Current Status:
- Active Development

Main Focus:
- Backend microservices implementation
- Integration stabilization
- Authentication & business workflow completion