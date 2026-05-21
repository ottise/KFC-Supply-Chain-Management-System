using Inventory.Application.DTOs;
using Inventory.Application.IServices;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Http;
using Microsoft.AspNetCore.Mvc;
using Swashbuckle.AspNetCore.Annotations;

namespace Inventory.Presentation.Controllers
{
    [ApiController]
    [Route("api/[controller]")]
    [Authorize]
    [Produces("application/json")]
    [SwaggerTag("Manage Stock Documents (read-only, filtered by manager's warehouses)")]
    public class StockDocumentsController : ControllerBase
    {
        private readonly IStockDocumentService _stockDocumentService;

        public StockDocumentsController(IStockDocumentService stockDocumentService)
        {
            _stockDocumentService = stockDocumentService;
        }

        [HttpGet]
        [SwaggerOperation(
            Summary = "Get paginated list of stock documents",
            Description = "Returns stock documents belonging to the current manager's warehouses. Supports filtering by status (pending, done, cancelled) and documentType (SaleOrder, TransferOrder). Only accessible by managers.")]
        [ProducesResponseType(typeof(PagedResultDto<StockDocumentListItemDto>), StatusCodes.Status200OK)]
        [ProducesResponseType(StatusCodes.Status400BadRequest)]
        [ProducesResponseType(StatusCodes.Status401Unauthorized)]
        [ProducesResponseType(StatusCodes.Status403Forbidden)]
        public async Task<IActionResult> GetAll(
            [FromQuery] string? status,
            [FromQuery] string? documentType,
            [FromQuery] string? search,
            [FromQuery] int? warehouseId,
            [FromQuery] int? locationId,
            [FromQuery] int? productId,
            [FromQuery] int? lotId,
            [FromQuery] DateTime? fromDate,
            [FromQuery] DateTime? toDate,
            [FromQuery] int? createdByUserId,
            [FromQuery] string? dateType,
            [FromQuery] int page = 1,
            [FromQuery] int pageSize = 5)
        {
            var managerId = GetEffectiveManagerId();
            if (pageSize > 20) pageSize = 20;

            var result = await _stockDocumentService.GetStockDocumentsAsync(managerId, status, documentType, search, warehouseId, locationId, page, pageSize, productId, lotId, fromDate, toDate, createdByUserId, dateType);
            return Ok(result);
        }

        [HttpGet("{id:int}")]
        [SwaggerOperation(
            Summary = "Get stock document detail by ID",
            Description = "Returns detailed stock document with its stock transactions (items). Only accessible if the document belongs to the manager's warehouses.")]
        [ProducesResponseType(typeof(StockDocumentDetailDto), StatusCodes.Status200OK)]
        [ProducesResponseType(StatusCodes.Status401Unauthorized)]
        [ProducesResponseType(StatusCodes.Status403Forbidden)]
        [ProducesResponseType(StatusCodes.Status404NotFound)]
        public async Task<IActionResult> GetById(int id)
        {
            var managerId = GetEffectiveManagerId();
            var result = await _stockDocumentService.GetStockDocumentByIdAsync(managerId, id);
            return Ok(result);
        }

        [HttpGet("status-count")]
        [SwaggerOperation(
            Summary = "Get count of stock documents by status",
            Description = "Returns count of Pending, Done, and Cancelled stock documents belonging to the manager's warehouses. Optionally filter by documentType (SaleOrder, TransferOrder).")]
        [ProducesResponseType(typeof(StockDocumentStatusCountDto), StatusCodes.Status200OK)]
        [ProducesResponseType(StatusCodes.Status401Unauthorized)]
        [ProducesResponseType(StatusCodes.Status403Forbidden)]
        public async Task<IActionResult> GetStatusCount(
            [FromQuery] string? documentType,
            [FromQuery] string? search,
            [FromQuery] int? warehouseId,
            [FromQuery] int? locationId)
        {
            var managerId = GetEffectiveManagerId();
            var result = await _stockDocumentService.GetStatusCountAsync(managerId, documentType, search, warehouseId, locationId);
            return Ok(result);
        }

        private int GetEffectiveManagerId()
        {
            var managerIdStr = User.FindFirst("ManagerId")?.Value;
            if (int.TryParse(managerIdStr, out var mId)) return mId;

            var userIdStr = User.FindFirst(System.Security.Claims.ClaimTypes.NameIdentifier)?.Value
                         ?? User.FindFirst("sub")?.Value
                         ?? User.FindFirst("UserId")?.Value;

            if (int.TryParse(userIdStr, out var userId)) return userId;

            throw new BuildingBlocks.Exceptions.ForbiddenException("Invalid or missing User/Manager identification in token.");
        }
        private int? GetManagerId()
        {
            var claim = User.FindFirst("managerId");
            if (claim != null && int.TryParse(claim.Value, out var managerId))
                return managerId;

            return null;
        }

        private int GetUserId()
        {
            var claim = User.FindFirst("userId");
            if (claim == null || !int.TryParse(claim.Value, out var userId))
                throw new UnauthorizedAccessException("Không tìm thấy hoặc claim userId không hợp lệ");

            return userId;
        }
        [HttpGet("by-type/{type}")]
        public async Task<IActionResult> GetByDocumentType(string type)
        {
            try
            {
                var managerId = GetManagerId();
                var userId = GetUserId();

                var documents = await _stockDocumentService.GetStockDocumentsByTypeAsync(type, managerId, userId);
                return Ok(documents);
            }
            catch (ArgumentException ex)
            {
                return BadRequest(new { message = ex.Message });
            }
            catch (UnauthorizedAccessException ex)
            {
                return Unauthorized(new { message = ex.Message });
            }
            catch (KeyNotFoundException ex)
            {
                return NotFound(new { message = ex.Message });
            }
            catch (Exception ex)
            {
                return StatusCode(500, new { message = "Có lỗi xảy ra", detail = ex.Message });
            }
        }
        [HttpGet("by-status/{status}")]
        public async Task<IActionResult> GetByStatus(string status)
        {
            try
            {
                var managerId = GetManagerId();
                var userId = GetUserId();

                var documents = await _stockDocumentService.GetPurchaseOrderDocumentsByStatusAsync(status, managerId, userId);
                return Ok(documents);
            }
            catch (ArgumentException ex)
            {
                return BadRequest(new { message = ex.Message });
            }
            catch (UnauthorizedAccessException ex)
            {
                return Unauthorized(new { message = ex.Message });
            }
            catch (KeyNotFoundException ex)
            {
                return NotFound(new { message = ex.Message });
            }
            catch (Exception ex)
            {
                return StatusCode(500, new { message = "Có lỗi xảy ra", detail = ex.Message });
            }
        }

    }
}
