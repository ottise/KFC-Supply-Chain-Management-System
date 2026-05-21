using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using Swashbuckle.AspNetCore.Annotations;
using System.Application.IServices;
using System.Application.DTOs.Maintenance;
using System.Security.Claims;
using System.Threading.Tasks;

namespace System.Presentation.Controllers
{
    [ApiController]
    [Route("api/[controller]")]
    [Produces("application/json")]
    [SwaggerTag("Quản lý bảo trì hệ thống - tạo, cập nhật, theo dõi và hủy các lịch bảo trì")]
    public class MaintenanceController : ControllerBase
    {
        private readonly IMaintenanceService _maintenanceService;

        public MaintenanceController(IMaintenanceService maintenanceService)
        {
            _maintenanceService = maintenanceService;
        }

        [HttpGet("status")]
        [AllowAnonymous]
        [SwaggerOperation(Summary = "Lấy trạng thái bảo trì hiện tại")]
        [SwaggerResponse(StatusCodes.Status200OK, Description = "Không có bảo trì nào đang hoạt động", Type = typeof(StatusNoneResponse))]
        [SwaggerResponse(StatusCodes.Status200OK, Description = "Có bảo trì đang hoạt động", Type = typeof(StatusActiveResponse))]
        [SwaggerResponse(StatusCodes.Status204NoContent, Description = "Không có bảo trì nào đang hoạt động (no content)")]
        public async Task<IActionResult> GetStatus()
        {
            var active = await _maintenanceService.GetActiveMaintenanceAsync();
            if (active == null)
            {
                return Ok(new StatusNoneResponse());
            }

            return Ok(new StatusActiveResponse
            {
                isActive = true,
                id = active.id,
                reason = active.reason,
                startTime = active.startTime,
                endTime = active.endTime,
                status = active.status
            });
        }

        [HttpGet("upcoming")]
        [AllowAnonymous]
        [SwaggerOperation(Summary = "Lấy danh sách bảo trì sắp tới", Description = "Trả về danh sách các lịch bảo trì có trạng thái Scheduled, sắp xếp theo startTime tăng dần")]
        [SwaggerResponse(StatusCodes.Status200OK, Description = "Danh sách bảo trì sắp tới", Type = typeof(List<MaintenanceResponse>))]
        public async Task<IActionResult> GetUpcoming([FromQuery] int limit = 5)
        {
            var upcoming = await _maintenanceService.GetUpcomingMaintenanceAsync(limit);
            return Ok(upcoming);
        }

        [HttpGet]
        [Authorize(Roles = "Admin")]
        [SwaggerOperation(Summary = "Lấy danh sách phân trang ticket bảo trì")]
        [SwaggerResponse(StatusCodes.Status200OK, Description = "Danh sách phân trang", Type = typeof(PagedResponse<MaintenanceResponse>))]
        [SwaggerResponse(StatusCodes.Status400BadRequest, Description = "Tham số không hợp lệ", Type = typeof(ErrorResponse))]
        [SwaggerResponse(StatusCodes.Status401Unauthorized, Description = "Chưa đăng nhập")]
        [SwaggerResponse(StatusCodes.Status403Forbidden, Description = "Không có quyền Admin")]
        public async Task<IActionResult> GetAll(
            [FromQuery] int page = 1,
            [FromQuery] int pageSize = 10,
            [FromQuery] string? keyword = null,
            [FromQuery] Domain.Enums.MaintenanceStatus? status = null)
        {
            var (items, totalCount) = await _maintenanceService.GetPagedMaintenanceAsync(page, pageSize, keyword, status);
            return Ok(new PagedResponse<MaintenanceResponse>
            {
                items = items.ToList(),
                totalCount = totalCount,
                page = page,
                pageSize = pageSize
            });
        }

        [HttpGet("{id}")]
        [Authorize(Roles = "Admin")]
        [SwaggerOperation(Summary = "Lấy chi tiết ticket bảo trì")]
        [SwaggerResponse(StatusCodes.Status200OK, Description = "Ticket tìm thấy", Type = typeof(MaintenanceResponse))]
        [SwaggerResponse(StatusCodes.Status400BadRequest, Description = "ID không hợp lệ", Type = typeof(ErrorResponse))]
        [SwaggerResponse(StatusCodes.Status401Unauthorized, Description = "Chưa đăng nhập")]
        [SwaggerResponse(StatusCodes.Status403Forbidden, Description = "Không có quyền Admin")]
        [SwaggerResponse(StatusCodes.Status404NotFound, Description = "Ticket không tồn tại", Type = typeof(ErrorResponse))]
        public async Task<IActionResult> GetById(string id)
        {
            var ticket = await _maintenanceService.GetByIdAsync(id);
            if (ticket == null) return NotFound(new ErrorResponse { message = "Ticket không tồn tại" });
            return Ok(ticket);
        }

        [HttpPost]
        [Authorize(Roles = "Admin")]
        [SwaggerOperation(Summary = "Tạo ticket bảo trì mới", Description = "startTime > now, không overlap với các bảo trì khác")]
        [SwaggerResponse(StatusCodes.Status201Created, Description = "Ticket đã được tạo thành công", Type = typeof(MaintenanceResponse))]
        [SwaggerResponse(StatusCodes.Status400BadRequest, Description = "Request không hợp lệ hoặc validation thất bại", Type = typeof(ErrorResponse))]
        [SwaggerResponse(StatusCodes.Status401Unauthorized, Description = "Chưa đăng nhập")]
        [SwaggerResponse(StatusCodes.Status403Forbidden, Description = "Không có quyền Admin")]
        [SwaggerResponse(StatusCodes.Status409Conflict, Description = "Lịch bảo trì bị trùng lặp thời gian", Type = typeof(ErrorResponse))]
        public async Task<IActionResult> Create([FromBody] CreateMaintenanceRequest request)
        {
            try
            {
                var createdBy = User.FindFirstValue(ClaimTypes.Name) ?? "Admin";
                var created = await _maintenanceService.CreateTicketAsync(request, createdBy);
                return CreatedAtAction(nameof(GetById), new { id = created.id }, created);
            }
            catch (InvalidOperationException ex)
            {
                return Conflict(new ErrorResponse { message = ex.Message });
            }
        }

        [HttpPost("stop-now")]
        [Authorize(Roles = "Admin")]
        [SwaggerOperation(Summary = "Dừng bảo trì đang diễn ra ngay lập tức")]
        [SwaggerResponse(StatusCodes.Status200OK, Description = "Bảo trì đã được dừng thành công", Type = typeof(MaintenanceResponse))]
        [SwaggerResponse(StatusCodes.Status401Unauthorized, Description = "Chưa đăng nhập")]
        [SwaggerResponse(StatusCodes.Status403Forbidden, Description = "Không có quyền Admin")]
        [SwaggerResponse(StatusCodes.Status409Conflict, Description = "Không có bảo trì nào đang diễn ra để dừng", Type = typeof(ErrorResponse))]
        public async Task<IActionResult> StopNow()
        {
            try
            {
                var ticket = await _maintenanceService.StopMaintenanceAsync();
                return Ok(ticket);
            }
            catch (InvalidOperationException ex)
            {
                return Conflict(new ErrorResponse { message = ex.Message });
            }
        }

        [HttpPut("{id}")]
        [Authorize(Roles = "Admin")]
        [SwaggerOperation(Summary = "Cập nhật ticket bảo trì", Description = "Chỉ áp dụng cho Scheduled và Ongoing")]
        [SwaggerResponse(StatusCodes.Status204NoContent, Description = "Ticket đã được cập nhật thành công")]
        [SwaggerResponse(StatusCodes.Status400BadRequest, Description = "Request không hợp lệ hoặc validation thất bại", Type = typeof(ErrorResponse))]
        [SwaggerResponse(StatusCodes.Status401Unauthorized, Description = "Chưa đăng nhập")]
        [SwaggerResponse(StatusCodes.Status403Forbidden, Description = "Không có quyền Admin")]
        [SwaggerResponse(StatusCodes.Status404NotFound, Description = "Ticket không tồn tại", Type = typeof(ErrorResponse))]
        [SwaggerResponse(StatusCodes.Status409Conflict, Description = "Lịch bảo trì bị trùng lặp hoặc không thể cập nhật trạng thái này", Type = typeof(ErrorResponse))]
        public async Task<IActionResult> Update(string id, [FromBody] UpdateMaintenanceRequest request)
        {
            try
            {
                var success = await _maintenanceService.UpdateTicketAsync(id, request);
                if (!success) return NotFound(new ErrorResponse { message = "Ticket không tồn tại" });
                return NoContent();
            }
            catch (InvalidOperationException ex)
            {
                return Conflict(new ErrorResponse { message = ex.Message });
            }
        }

        [HttpDelete("{id}")]
        [Authorize(Roles = "Admin")]
        [SwaggerOperation(Summary = "Hủy ticket bảo trì", Description = "Chỉ áp dụng cho Scheduled và Ongoing. Không thể hủy ticket đã Done")]
        [SwaggerResponse(StatusCodes.Status204NoContent, Description = "Ticket đã được hủy thành công")]
        [SwaggerResponse(StatusCodes.Status400BadRequest, Description = "Không thể hủy ticket đã hoàn thành (Done)", Type = typeof(ErrorResponse))]
        [SwaggerResponse(StatusCodes.Status401Unauthorized, Description = "Chưa đăng nhập")]
        [SwaggerResponse(StatusCodes.Status403Forbidden, Description = "Không có quyền Admin")]
        [SwaggerResponse(StatusCodes.Status404NotFound, Description = "Ticket không tồn tại", Type = typeof(ErrorResponse))]
        public async Task<IActionResult> Delete(string id)
        {
            var success = await _maintenanceService.DeleteTicketAsync(id);
            if (!success) return NotFound(new ErrorResponse { message = "Ticket không tồn tại" });
            return NoContent();
        }
    }

    #region Response DTOs for Swagger Documentation

    public class StatusNoneResponse
    {
        public string status { get; set; } = "None";
    }

    public class StatusActiveResponse
    {
        public bool isActive { get; set; } = true;
        public string id { get; set; } = null!;
        public string reason { get; set; } = null!;
        public DateTime startTime { get; set; }
        public DateTime endTime { get; set; }
        public string status { get; set; } = null!;
    }

    public class ErrorResponse
    {
        public string message { get; set; } = null!;
    }

    public class PagedResponse<T>
    {
        public List<T> items { get; set; } = new();
        public int totalCount { get; set; }
        public int page { get; set; }
        public int pageSize { get; set; }
    }

    #endregion
}
