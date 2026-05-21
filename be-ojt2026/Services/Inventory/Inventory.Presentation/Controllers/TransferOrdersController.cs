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
[SwaggerTag("Manage Transfer Orders")]
public class TransferOrdersController : ControllerBase
{
    private readonly ITransferOrderService _transferOrderService;

    public TransferOrdersController(ITransferOrderService transferOrderService)
    {
        _transferOrderService = transferOrderService;
    }

    [HttpGet]
    [SwaggerOperation(
        Summary = "Get a paginated list of transfer orders.",
        Description = "Requires authentication. Supports partial matching (case-insensitive) for transferNo, createdBy, and locationName (matches both From and To Location names).")]
    [ProducesResponseType(StatusCodes.Status200OK)]
    [ProducesResponseType(StatusCodes.Status400BadRequest)]
    [ProducesResponseType(StatusCodes.Status401Unauthorized)]
    public async Task<ActionResult<PagedResultDto<TransferOrderListItemDto>>> GetTransferOrders(
        [FromQuery] string? status,
        [FromQuery] string? transferNo,
        [FromQuery] string? locationName,
        [FromQuery] string? createdBy,
        [FromQuery] int page = 1,
        [FromQuery] int pageSize = 20,
        [FromQuery] int? createdById = null)
    {
        if (pageSize > 20) pageSize = 20;
        var result = await _transferOrderService.GetAllAsync(status, transferNo, locationName, createdBy, createdById, page, pageSize);
        return Ok(result);
    }

    [HttpGet("{id}")]
    [SwaggerOperation("Get details of a specific transfer order by ID.", "Requires authentication.")]
    [ProducesResponseType(StatusCodes.Status200OK)]
    [ProducesResponseType(StatusCodes.Status401Unauthorized)]
    [ProducesResponseType(StatusCodes.Status404NotFound)]
    public async Task<ActionResult<TransferOrderDetailDto>> GetTransferOrder(int id)
    {
        var result = await _transferOrderService.GetByIdAsync(id);
        return Ok(result);
    }

    [HttpGet("status-count")]
    [SwaggerOperation("Get the count of transfer orders by status.", "Requires authentication.")]
    [ProducesResponseType(StatusCodes.Status200OK)]
    [ProducesResponseType(StatusCodes.Status401Unauthorized)]
    public async Task<ActionResult<TransferOrderStatusCountDto>> GetStatusCount()
    {
        var result = await _transferOrderService.GetStatusCountAsync();
        return Ok(result);
    }

    [HttpPost]
    [SwaggerOperation("Create a new transfer order.", "Requires authentication. Status will be 'draft'. Duplicate productId not allowed.")]
    [ProducesResponseType(StatusCodes.Status201Created)]
    [ProducesResponseType(StatusCodes.Status400BadRequest)]
    [ProducesResponseType(StatusCodes.Status401Unauthorized)]
    public async Task<IActionResult> CreateTransferOrder([FromBody] CreateTransferOrderDto dto)
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

        var result = await _transferOrderService.CreateAsync(managerId, userId, userName, dto);
        return StatusCode(201, new { message = "Transfer order created successfully", data = result });
    }

    [HttpPut("{id}")]
    [SwaggerOperation("Update the header of a transfer order.", "Requires authentication. Only allowed when status is 'draft'.")]
    [ProducesResponseType(StatusCodes.Status200OK)]
    [ProducesResponseType(StatusCodes.Status400BadRequest)]
    [ProducesResponseType(StatusCodes.Status401Unauthorized)]
    [ProducesResponseType(StatusCodes.Status404NotFound)]
    public async Task<IActionResult> UpdateTransferOrderHeader(int id, [FromBody] UpdateTransferOrderDto dto)
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

        await _transferOrderService.UpdateAsync(managerId, userId, id, dto);
        return Ok(new { message = "Transfer order updated successfully" });
    }

    [HttpDelete("{id}")]
    [SwaggerOperation("Delete a transfer order.", "Requires authentication. Only allowed when status is 'draft'.")]
    [ProducesResponseType(StatusCodes.Status204NoContent)]
    [ProducesResponseType(StatusCodes.Status400BadRequest)]
    [ProducesResponseType(StatusCodes.Status401Unauthorized)]
    [ProducesResponseType(StatusCodes.Status404NotFound)]
    public async Task<IActionResult> DeleteTransferOrder(int id)
    {
        await _transferOrderService.DeleteAsync(id);
        return Ok(new { message = "Transfer order deleted successfully" });
    }

    // ===== ITEMS =====

    [HttpPost("{id}/items")]
    [SwaggerOperation("Add an item to a transfer order.", "Requires authentication. Only allowed when status is 'draft'.")]
    [ProducesResponseType(StatusCodes.Status201Created)]
    [ProducesResponseType(StatusCodes.Status400BadRequest)]
    [ProducesResponseType(StatusCodes.Status401Unauthorized)]
    [ProducesResponseType(StatusCodes.Status404NotFound)]
    public async Task<IActionResult> AddItem(int id, [FromBody] TransferOrderItemUpsertDto dto)
    {
        await _transferOrderService.AddItemAsync(id, dto);
        return StatusCode(201, new { message = "Item added to transfer order successfully" });
    }

    [HttpPut("{id}/items/{itemId}")]
    [SwaggerOperation("Update an item in a transfer order.", "Requires authentication. Only allowed when status is 'draft'.")]
    [ProducesResponseType(StatusCodes.Status200OK)]
    [ProducesResponseType(StatusCodes.Status400BadRequest)]
    [ProducesResponseType(StatusCodes.Status401Unauthorized)]
    [ProducesResponseType(StatusCodes.Status404NotFound)]
    public async Task<IActionResult> UpdateItem(int id, int itemId, [FromBody] TransferOrderItemUpsertDto dto)
    {
        await _transferOrderService.UpdateItemAsync(id, itemId, dto);
        return Ok(new { message = "Transfer order item updated successfully" });
    }

    [HttpDelete("{id}/items/{itemId}")]
    [SwaggerOperation("Delete an item from a transfer order.", "Requires authentication. Only allowed when status is 'draft'.")]
    [ProducesResponseType(StatusCodes.Status200OK)]
    [ProducesResponseType(StatusCodes.Status400BadRequest)]
    [ProducesResponseType(StatusCodes.Status401Unauthorized)]
    [ProducesResponseType(StatusCodes.Status404NotFound)]
    public async Task<IActionResult> DeleteItem(int id, int itemId)
    {
        await _transferOrderService.DeleteItemAsync(id, itemId);
        return Ok(new { message = "Transfer order item deleted successfully" });
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
        var result = await _transferOrderService.CheckAvailabilityAsync(id);
        return Ok(new { message = $"Availability checked. Current status: {result.Status}", data = result });
    }

    [HttpPost("{id}/complete")]
    [SwaggerOperation("Complete the transfer order (ready → done).", "Requires authentication. Only allowed when status is 'ready'. Will deduct stock from source and add to destination.")]
    [ProducesResponseType(StatusCodes.Status200OK)]
    [ProducesResponseType(StatusCodes.Status400BadRequest)]
    [ProducesResponseType(StatusCodes.Status401Unauthorized)]
    [ProducesResponseType(StatusCodes.Status404NotFound)]
    public async Task<IActionResult> CompleteTransferOrder(int id)
    {
        await _transferOrderService.MarkDoneAsync(id);
        return Ok(new { message = "Transfer order completed successfully" });
    }

    [HttpPost("{id}/cancel")]
    [SwaggerOperation("Cancel the transfer order (draft/waiting/ready → cancelled).", "Requires authentication. Cannot cancel if already done. Releases reserved stock if applicable.")]
    [ProducesResponseType(StatusCodes.Status200OK)]
    [ProducesResponseType(StatusCodes.Status400BadRequest)]
    [ProducesResponseType(StatusCodes.Status401Unauthorized)]
    [ProducesResponseType(StatusCodes.Status404NotFound)]
    public async Task<IActionResult> CancelTransferOrder(int id)
    {
        await _transferOrderService.CancelAsync(id);
        return Ok(new { message = "Transfer order cancelled successfully" });
    }


    // khac kho
    [HttpPost("create-by-location")]
    [SwaggerOperation(
    Summary = "Create a new transfer order (by location).",
    Description = "Requires authentication. Status will be 'draft'. Duplicate productId not allowed."
)]
    [ProducesResponseType(StatusCodes.Status201Created)]
    [ProducesResponseType(StatusCodes.Status400BadRequest)]
    [ProducesResponseType(StatusCodes.Status401Unauthorized)]
    public async Task<IActionResult> CreateTransferOrderByLocation([FromBody] CreateTransferOrderDto dto)
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

        var userName = User.FindFirst("Fullname")?.Value
                    ?? User.Identity?.Name
                    ?? User.FindFirst("name")?.Value
                    ?? User.FindFirst(System.Security.Claims.ClaimTypes.Name)?.Value
                    ?? "Unknown";

        var result = await _transferOrderService.CreateTransferOrderAsync(managerId, userId, userName, dto);

        return StatusCode(201, new { message = "Transfer order created successfully", data = result });
    }


}
