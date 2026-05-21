# System Service - Code Patterns & Swagger

## Project Structure
```
Services/System/
├── System.Domain/           # Entities, Enums
├── System.Application/      # DTOs, Interfaces (IServices, IRepositories)
├── System.Infrastructure/   # Repositories implementation, DbContext
└── System.Presentation/     # Controllers, Middleware, Extensions
```

## Maintenance Feature

### Entity
- **File**: `System.Domain/Entities/SystemMaintenance.cs`
- **ID Pattern**: `TICK-{number:D5}` (e.g., TICK-00001)
- **Status Enum**: `Scheduled | Ongoing | Done | Cancelled`
- **Fields**: Id, Status, Reason, StartTime, EndTime, CreatedAt, CreatedBy

### DTOs (`System.Application/DTOs/Maintenance/`)
| File | Purpose |
|------|---------|
| `CreateMaintenanceRequest.cs` | POST - reason (required), startTime, endTime |
| `UpdateMaintenanceRequest.cs` | PUT - reason, startTime, endTime, status (Enum) |
| `MaintenanceResponse.cs` | Response - id, reason, startTime, endTime, status, createdAt, createdBy |

### Swagger Patterns
```csharp
[ApiController]
[Route("api/[controller]")]
[Produces("application/json")]
[SwaggerTag("Mô tả tiếng Việt cho nhóm API")]
public class XController : ControllerBase
{
    // Method-level annotations:
    [HttpGet("status")]
    [AllowAnonymous]
    [SwaggerOperation(Summary = "...", Description = "...")]
    [SwaggerResponse(StatusCodes.Status200OK, Description = "...", Type = typeof(ResponseDTO))]
    [SwaggerResponse(StatusCodes.Status404NotFound, Description = "...", Type = typeof(ErrorResponse))]
    [SwaggerResponse(StatusCodes.Status409Conflict, Description = "...", Type = typeof(ErrorResponse))]

    // Error Response DTO for Swagger:
    public class ErrorResponse
    {
        public string message { get; set; } = null!;
    }

    // Paged Response DTO:
    public class PagedResponse<T>
    {
        public List<T> items { get; set; } = new();
        public int totalCount { get; set; }
        public int page { get; set; }
        public int pageSize { get; set; }
    }
}
```

### Controller Patterns
```csharp
[ApiController]
[Route("api/[controller]")]
public class XController : ControllerBase
{
    // GET status - AllowAnonymous
    [HttpGet("status")]
    [AllowAnonymous]

    // GET upcoming - AllowAnonymous
    [HttpGet("upcoming")]
    [AllowAnonymous]

    // CRUD - [Authorize(Roles = "Admin")]
    [HttpGet]
    [Authorize(Roles = "Admin")]

    // Exception handling: return Conflict/NotFound with { message: "..." }
}
```

### Service Layer Pattern
```csharp
public class XService : IXService
{
    private readonly IUnitOfWork _unitOfWork;

    // Transaction pattern for create:
    await _unitOfWork.BeginTransactionAsync();
    try { ... await _unitOfWork.CommitTransactionAsync(); }
    catch { await _unitOfWork.RollbackTransactionAsync(); throw; }
}
```

### Repository Pattern
- **IUnitOfWork**: MaintenanceRepository, SaveChangesAsync, BeginTransaction/Commit/Rollback
- **IMaintenanceRepository**: GetAllAsync, GetByIdAsync, GetActiveMaintenanceAsync, GetByStatusAsync, AddAsync, UpdateAsync, GetLastTicketIdAsync
- **ID Generation**: Parse TICK-XXX number in memory (not lexicographic)

---

## API Endpoints

| Method | Endpoint | Auth | Mô tả |
|--------|----------|------|--------|
| GET | `/status` | Anonymous | Lấy trạng thái bảo trì hiện tại (Ongoing) |
| GET | `/upcoming?limit=5` | Anonymous | Lấy danh sách bảo trì sắp tới (Scheduled) |
| GET | `/` | Admin | Danh sách phân trang, filter `?status=` |
| GET | `/{id}` | Admin | Chi tiết ticket |
| POST | `/` | Admin | Tạo ticket mới (Scheduled) |
| POST | `/stop-now` | Admin | Dừng bảo trì đang diễn ra |
| PUT | `/{id}` | Admin | Cập nhật ticket |
| DELETE | `/{id}` | Admin | Hủy ticket (soft delete) |

---

## Business Rules

### Status Flow
```
Scheduled → Ongoing → Done
    ↓            ↓
 Cancelled   (không về được)
```

### Admin ĐƯỢC LÀM
| Action | Điều kiện |
|--------|-----------|
| Tạo ticket | Scheduled, startTime > now, không overlap |
| Update ticket | Scheduled hoặc Ongoing |
| Delete ticket | Scheduled hoặc Ongoing (không phải Done) |
| Stop now | Phải có Ongoing |

### Admin KHÔNG ĐƯỢC LÀM
| Case | Lý do |
|------|-------|
| Tạo startTime ≤ now | Phải lên lịch trước |
| Tạo overlap | Trùng lặp thời gian |
| Update Done/Cancelled | Đã kết thúc |
| Đổi Done/Cancelled → Ongoing | Không hồi phục |
| Update overlap | Trùng lặp thời gian |
| Delete Done | Đã hoàn thành, giữ lại lịch sử |
| Stop khi không có Ongoing | Không có gì để dừng |

### Validation Chi Tiết

**Tạo ticket (POST /):**
- `reason` ≠ null/empty/whitespace
- `startTime < endTime`
- `startTime > now`
- Không overlap với Scheduled/Ongoing

**Update ticket (PUT /{id}):**
- Chỉ Scheduled hoặc Ongoing mới được sửa
- `startTime < endTime`
- Không đổi Done/Cancelled → Ongoing
- Không overlap với Scheduled/Ongoing khác

**Delete ticket (DELETE /{id}):**
- Scheduled/Ongoing → Cancelled ✅
- Done → ❌ Cannot cancel

**Stop now (POST /stop-now):**
- Phải có Ongoing mới được stop
- Đặt status = Done, endTime = now

### Overlap Rules

| New/Update | vs Scheduled | vs Ongoing |
|------------|--------------|------------|
| **Scheduled** | ❌ Blocked | ❌ Blocked |
| **Ongoing** | ❌ Blocked | ❌ Blocked |

---

## Program.cs Registration
```csharp
builder.Services.AddScoped<IUnitOfWork, UnitOfWork>();
builder.Services.AddScoped<IMaintenanceService, MaintenanceService>();
builder.Services.AddHostedService<MaintenanceWorker>();
builder.Services.AddDbContext<SystemDbContext>(options =>
    options.UseSqlServer(connectionString));
```

## DB Configuration
- Table: `SystemMaintenance`
- Status stored as string (EF Core conversion)
- CreatedAt default: `GETUTCDATE()`
