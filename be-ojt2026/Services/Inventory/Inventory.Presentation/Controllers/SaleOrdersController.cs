using Inventory.Application.DTOs;
using Inventory.Application.IServices;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Http;
using Microsoft.AspNetCore.Mvc;
using Swashbuckle.AspNetCore.Annotations;

namespace Inventory.Presentation.Controllers;

[Route("api/[controller]")]
[ApiController]
[Authorize]
[SwaggerTag("Manage Sale Orders")]
public class SaleOrdersController : ControllerBase
{
    private readonly ISaleOrderService _saleOrderService;

    public SaleOrdersController(ISaleOrderService saleOrderService)
    {
        _saleOrderService = saleOrderService;
    }

    [HttpGet]
    [SwaggerOperation(
        Summary = "Get a paginated list of sale orders.",
        Description = "Requires authentication. Supports partial matching (case-insensitive) for orderNo, createdBy, and locationName (matches Source Location, Customer Name, or Customer Address).")]
    [ProducesResponseType(StatusCodes.Status200OK)]
    [ProducesResponseType(StatusCodes.Status400BadRequest)]
    [ProducesResponseType(StatusCodes.Status401Unauthorized)]
    public async Task<ActionResult<PagedResultDto<SaleOrderListItemDto>>> GetSaleOrders(
        [FromQuery] string? status,
        [FromQuery] string? orderNo,
        [FromQuery] string? locationName,
        [FromQuery] string? createdBy,
        [FromQuery] DateTime? fromDate,
        [FromQuery] DateTime? toDate,
        [FromQuery] DateTime? fromPlannedDate,
        [FromQuery] DateTime? toPlannedDate,
        [FromQuery] int page = 1,
        [FromQuery] int pageSize = 20,
        [FromQuery] int? managerId = null,
        [FromQuery] int? createdById = null)
    {
        var tokenManagerIdStr = User.FindFirst("ManagerId")?.Value;
        int? tokenManagerId = null;
        if (!string.IsNullOrEmpty(tokenManagerIdStr) && tokenManagerIdStr != "null")
        {
            if (int.TryParse(tokenManagerIdStr, out var mId))
                tokenManagerId = mId;
        }

        // Lấy UserId từ JWT (để dùng khi ManagerId = null)
        var userIdStr = User.FindFirst(System.Security.Claims.ClaimTypes.NameIdentifier)?.Value
                     ?? User.FindFirst("sub")?.Value;
        int? userId = null;
        if (!string.IsNullOrEmpty(userIdStr) && int.TryParse(userIdStr, out var uId))
            userId = uId;

        var effectiveManagerId = managerId ?? tokenManagerId;

        if (pageSize > 20) pageSize = 20;
        var result = await _saleOrderService.GetAllAsync(effectiveManagerId, userId, status, orderNo, locationName, createdBy, createdById, fromDate, toDate, fromPlannedDate, toPlannedDate, page, pageSize);
        return Ok(result);
    }

    [HttpGet("{id}")]
    [SwaggerOperation("Get details of a specific sale order by ID.", "Requires authentication.")]
    [ProducesResponseType(StatusCodes.Status200OK)]
    [ProducesResponseType(StatusCodes.Status401Unauthorized)]
    [ProducesResponseType(StatusCodes.Status404NotFound)]
    public async Task<ActionResult<SaleOrderDetailDto>> GetSaleOrder(int id)
    {
        var result = await _saleOrderService.GetByIdAsync(id);
        return Ok(result);
    }

    [HttpGet("status-count")]
    [SwaggerOperation("Get the count of sale orders by status.", "Requires authentication.")]
    [ProducesResponseType(StatusCodes.Status200OK)]
    [ProducesResponseType(StatusCodes.Status401Unauthorized)]
    public async Task<ActionResult<SaleOrderStatusCountDto>> GetStatusCount()
    {
        var result = await _saleOrderService.GetStatusCountAsync();
        return Ok(result);
    }

    [HttpPost]
    [SwaggerOperation("Create a new sale order.", "Requires authentication. Status will be 'draft'. Duplicate productId not allowed.")]
    [ProducesResponseType(StatusCodes.Status201Created)]
    [ProducesResponseType(StatusCodes.Status400BadRequest)]
    [ProducesResponseType(StatusCodes.Status401Unauthorized)]
    public async Task<IActionResult> CreateSaleOrder([FromBody] CreateSaleOrderDto dto)
    {
        var managerIdStr = User.FindFirst("ManagerId")?.Value;
        int? managerId = null;
        if (int.TryParse(managerIdStr, out var mId)) managerId = mId;

        var userIdStr = User.FindFirst(System.Security.Claims.ClaimTypes.NameIdentifier)?.Value
                     ?? User.FindFirst("sub")?.Value
                     ?? User.FindFirst("UserId")?.Value;

        if (!int.TryParse(userIdStr, out var userId))
        {
            return Unauthorized(new { message = "Invalid or missing UserId claim in token." });
        }

        var userName = User.FindFirst("Fullname")?.Value ?? User.Identity?.Name ?? User.FindFirst("name")?.Value ?? User.FindFirst(System.Security.Claims.ClaimTypes.Name)?.Value ?? "Unknown";

        await _saleOrderService.CreateAsync(managerId, userId, userName, dto);
        return StatusCode(201, new { message = "Sale order created successfully" });
    }

    [HttpPut("{id}")]
    [SwaggerOperation("Update the header of a sale order.", "Requires authentication. Only allowed when status is 'draft'.")]
    [ProducesResponseType(StatusCodes.Status200OK)]
    [ProducesResponseType(StatusCodes.Status400BadRequest)]
    [ProducesResponseType(StatusCodes.Status401Unauthorized)]
    [ProducesResponseType(StatusCodes.Status404NotFound)]
    public async Task<IActionResult> UpdateSaleOrderHeader(int id, [FromBody] UpdateSaleOrderDto dto)
    {
        var managerIdStr = User.FindFirst("ManagerId")?.Value;
        int? managerId = null;
        if (int.TryParse(managerIdStr, out var mId)) managerId = mId;

        var userIdStr = User.FindFirst(System.Security.Claims.ClaimTypes.NameIdentifier)?.Value
                     ?? User.FindFirst("sub")?.Value
                     ?? User.FindFirst("UserId")?.Value;

        if (!int.TryParse(userIdStr, out var userId))
        {
            return Unauthorized(new { message = "Invalid or missing UserId claim in token." });
        }

        await _saleOrderService.UpdateAsync(managerId, userId, id, dto);
        return Ok(new { message = "Sale order updated successfully" });
    }

    [HttpDelete("{id}")]
    [SwaggerOperation("Delete a sale order.", "Requires authentication. Only allowed when status is 'draft'.")]
    [ProducesResponseType(StatusCodes.Status204NoContent)]
    [ProducesResponseType(StatusCodes.Status400BadRequest)]
    [ProducesResponseType(StatusCodes.Status401Unauthorized)]
    [ProducesResponseType(StatusCodes.Status404NotFound)]
    public async Task<IActionResult> DeleteSaleOrder(int id)
    {
        await _saleOrderService.DeleteAsync(id);
        return Ok(new { message = "Sale order deleted successfully" });
    }

    // ===== ITEMS =====

    [HttpPost("{id}/items")]
    [SwaggerOperation("Add an item to a sale order.", "Requires authentication. Only allowed when status is 'draft'.")]
    [ProducesResponseType(StatusCodes.Status201Created)]
    [ProducesResponseType(StatusCodes.Status400BadRequest)]
    [ProducesResponseType(StatusCodes.Status401Unauthorized)]
    [ProducesResponseType(StatusCodes.Status404NotFound)]
    public async Task<IActionResult> AddItem(int id, [FromBody] SaleOrderItemUpsertDto dto)
    {
        await _saleOrderService.AddItemAsync(id, dto);
        return StatusCode(201, new { message = "Item added to sale order successfully" });
    }

    [HttpPut("{id}/items/{itemId}")]
    [SwaggerOperation("Update an item in a sale order.", "Requires authentication. Only allowed when status is 'draft'.")]
    [ProducesResponseType(StatusCodes.Status200OK)]
    [ProducesResponseType(StatusCodes.Status400BadRequest)]
    [ProducesResponseType(StatusCodes.Status401Unauthorized)]
    [ProducesResponseType(StatusCodes.Status404NotFound)]
    public async Task<IActionResult> UpdateItem(int id, int itemId, [FromBody] SaleOrderItemUpsertDto dto)
    {
        await _saleOrderService.UpdateItemAsync(id, itemId, dto);
        return Ok(new { message = "Sale order item updated successfully" });
    }

    [HttpDelete("{id}/items/{itemId}")]
    [SwaggerOperation("Delete an item from a sale order.", "Requires authentication. Only allowed when status is 'draft'.")]
    [ProducesResponseType(StatusCodes.Status200OK)]
    [ProducesResponseType(StatusCodes.Status400BadRequest)]
    [ProducesResponseType(StatusCodes.Status401Unauthorized)]
    [ProducesResponseType(StatusCodes.Status404NotFound)]
    public async Task<IActionResult> DeleteItem(int id, int itemId)
    {
        await _saleOrderService.DeleteItemAsync(id, itemId);
        return Ok(new { message = "Sale order item deleted successfully" });
    }

    // ===== STATUS WORKFLOW =====

    [HttpPost("{id}/check-availability")]
    [SwaggerOperation("Check inventory availability and update status.", "Requires authentication. If enough stock, status becomes Ready, else Waiting. Can be called multiple times while in Waiting.")]
    [ProducesResponseType(StatusCodes.Status200OK)]
    [ProducesResponseType(StatusCodes.Status400BadRequest)]
    [ProducesResponseType(StatusCodes.Status401Unauthorized)]
    [ProducesResponseType(StatusCodes.Status404NotFound)]
    public async Task<IActionResult> CheckAvailability(int id)
    {
        var result = await _saleOrderService.CheckAvailabilityAsync(id);
        return Ok(new { message = $"Availability checked. Current status: {result.Status}", data = result });
    }

    [HttpPost("{id}/complete")]
    [SwaggerOperation("Complete the sale order (ready → done).", "Requires authentication. Only allowed when status is 'ready'. Will deduct stock from source location.")]
    [ProducesResponseType(StatusCodes.Status200OK)]
    [ProducesResponseType(StatusCodes.Status400BadRequest)]
    [ProducesResponseType(StatusCodes.Status401Unauthorized)]
    [ProducesResponseType(StatusCodes.Status404NotFound)]
    public async Task<IActionResult> CompleteSaleOrder(int id)
    {
        await _saleOrderService.MarkDoneAsync(id);
        return Ok(new { message = "Sale order completed successfully" });
    }

    [HttpPost("{id}/cancel")]
    [SwaggerOperation("Cancel the sale order (draft/waiting/ready → cancelled).", "Requires authentication. Cannot cancel if already done. Releases reserved stock if applicable.")]
    [ProducesResponseType(StatusCodes.Status200OK)]
    [ProducesResponseType(StatusCodes.Status400BadRequest)]
    [ProducesResponseType(StatusCodes.Status401Unauthorized)]
    [ProducesResponseType(StatusCodes.Status404NotFound)]
    public async Task<IActionResult> CancelSaleOrder(int id)
    {
        await _saleOrderService.CancelAsync(id);
        return Ok(new { message = "Sale order cancelled successfully" });
    }
}
