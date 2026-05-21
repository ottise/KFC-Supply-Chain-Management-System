using Inventory.Application.DTOs;
using Inventory.Application.DTOs.ScrapOrder;
using Inventory.Application.IServices;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Http;
using Microsoft.AspNetCore.Mvc;
using Swashbuckle.AspNetCore.Annotations;

namespace Inventory.Presentation.Controllers;

[Route("api/[controller]")]
[ApiController]
[Authorize]
[SwaggerTag("Manage Scrap Orders")]
public class ScrapOrdersController : ControllerBase
{
    private readonly IScrapOrderService _scrapOrderService;

    public ScrapOrdersController(IScrapOrderService scrapOrderService)
    {
        _scrapOrderService = scrapOrderService;
    }

    [HttpGet]
    [SwaggerOperation("Get a list of scrap orders.", "Requires authentication. Optionally filter by status.")]
    [ProducesResponseType(StatusCodes.Status200OK)]
    [ProducesResponseType(StatusCodes.Status400BadRequest)]
    [ProducesResponseType(StatusCodes.Status401Unauthorized)]
    public async Task<ActionResult<PagedResultDto<ScrapOrderListItemDto>>> GetScrapOrders(
        [FromQuery] string? status,
        [FromQuery] string? scrapNo,
        [FromQuery] string? locationName,
        [FromQuery] string? createdBy,
        [FromQuery] int page = 1,
        [FromQuery] int pageSize = 20,
        [FromQuery] int? managerId = null,
        CancellationToken cancellationToken = default)
    {
        var tokenManagerIdStr = User.FindFirst("ManagerId")?.Value;
        int? tokenManagerId = null;
        if (!string.IsNullOrEmpty(tokenManagerIdStr) && tokenManagerIdStr != "null")
        {
            if (int.TryParse(tokenManagerIdStr, out var mId))
                tokenManagerId = mId;
        }

        var userIdStr = User.FindFirst(System.Security.Claims.ClaimTypes.NameIdentifier)?.Value
                     ?? User.FindFirst("sub")?.Value;
        int? userId = null;
        if (!string.IsNullOrEmpty(userIdStr) && int.TryParse(userIdStr, out var uId))
            userId = uId;

        var effectiveManagerId = managerId ?? tokenManagerId;

        if (pageSize > 20) pageSize = 20;
        var result = await _scrapOrderService.GetAllAsync(effectiveManagerId, userId, status, page, pageSize, cancellationToken, scrapNo, locationName, createdBy);
        return Ok(result);
    }

    [HttpGet("{id}")]
    [SwaggerOperation("Get details of a specific scrap order by ID.", "Requires authentication.")]
    [ProducesResponseType(StatusCodes.Status200OK)]
    [ProducesResponseType(StatusCodes.Status401Unauthorized)]
    [ProducesResponseType(StatusCodes.Status404NotFound)]
    public async Task<ActionResult<ScrapOrderDetailDto>> GetScrapOrder(int id, CancellationToken cancellationToken)
    {
        var result = await _scrapOrderService.GetByIdAsync(id, cancellationToken);
        return Ok(result);
    }

    [HttpGet("status-count")]
    [SwaggerOperation("Get the count of scrap orders by status.", "Requires authentication.")]
    [ProducesResponseType(StatusCodes.Status200OK)]
    [ProducesResponseType(StatusCodes.Status401Unauthorized)]
    public async Task<ActionResult<ScrapOrderStatusCountDto>> GetStatusCount(
        [FromQuery] int? managerId = null,
        CancellationToken cancellationToken = default)
    {
        var tokenManagerIdStr = User.FindFirst("ManagerId")?.Value;
        int? tokenManagerId = null;
        if (!string.IsNullOrEmpty(tokenManagerIdStr) && tokenManagerIdStr != "null")
        {
            if (int.TryParse(tokenManagerIdStr, out var mId))
                tokenManagerId = mId;
        }

        var userIdStr = User.FindFirst(System.Security.Claims.ClaimTypes.NameIdentifier)?.Value
                     ?? User.FindFirst("sub")?.Value;
        int? userId = null;
        if (!string.IsNullOrEmpty(userIdStr) && int.TryParse(userIdStr, out var uId))
            userId = uId;

        var effectiveManagerId = managerId ?? tokenManagerId;

        var result = await _scrapOrderService.GetStatusCountAsync(effectiveManagerId, userId, cancellationToken);
        return Ok(result);
    }

    [HttpPost]
    [SwaggerOperation("Create a new scrap order.", "Requires authentication. Status will be 'draft'. Duplicate productId not allowed.")]
    [ProducesResponseType(StatusCodes.Status201Created)]
    [ProducesResponseType(StatusCodes.Status400BadRequest)]
    [ProducesResponseType(StatusCodes.Status401Unauthorized)]
    public async Task<IActionResult> CreateScrapOrder([FromBody] CreateScrapOrderDto dto, CancellationToken cancellationToken)
    {
        var managerId = GetEffectiveUserId();
        var createdByName = User.FindFirst("Fullname")?.Value ?? User.Identity?.Name ?? "Unknown";

        await _scrapOrderService.CreateAsync(managerId, createdByName, dto, cancellationToken);
        return StatusCode(201, new { message = "Scrap order created successfully" });
    }

    // ===== STATUS WORKFLOW =====

    [HttpPost("{id}/check-availability")]
    [SwaggerOperation("Check inventory availability and update status.", "Requires authentication. If enough stock, status becomes Ready.")]
    [ProducesResponseType(StatusCodes.Status200OK)]
    [ProducesResponseType(StatusCodes.Status400BadRequest)]
    [ProducesResponseType(StatusCodes.Status401Unauthorized)]
    [ProducesResponseType(StatusCodes.Status404NotFound)]
    public async Task<IActionResult> CheckAvailability(int id, CancellationToken cancellationToken)
    {
        var managerId = GetEffectiveUserId();
        var result = await _scrapOrderService.CheckAvailabilityAsync(managerId, id, cancellationToken);
        return Ok(new { message = $"Availability checked. Current status: {result.Status}", data = result });
    }

    [HttpPost("{id}/complete")]
    [SwaggerOperation("Complete the scrap order (ready → done).", "Requires authentication. Only allowed when status is 'ready'. Will deduct stock from source.")]
    [ProducesResponseType(StatusCodes.Status200OK)]
    [ProducesResponseType(StatusCodes.Status400BadRequest)]
    [ProducesResponseType(StatusCodes.Status401Unauthorized)]
    [ProducesResponseType(StatusCodes.Status404NotFound)]
    public async Task<IActionResult> CompleteScrapOrder(int id, CancellationToken cancellationToken)
    {
        var managerId = GetEffectiveUserId();
        await _scrapOrderService.MarkDoneAsync(managerId, id, cancellationToken);
        return Ok(new { message = "Scrap order completed successfully" });
    }

    [HttpPost("{id}/cancel")]
    [SwaggerOperation("Cancel the scrap order (draft/ready → cancelled).", "Requires authentication. Cannot cancel if already done.")]
    [ProducesResponseType(StatusCodes.Status200OK)]
    [ProducesResponseType(StatusCodes.Status400BadRequest)]
    [ProducesResponseType(StatusCodes.Status401Unauthorized)]
    [ProducesResponseType(StatusCodes.Status404NotFound)]
    public async Task<IActionResult> CancelScrapOrder(int id, CancellationToken cancellationToken)
    {
        var managerId = GetEffectiveUserId();
        await _scrapOrderService.CancelAsync(managerId, id, cancellationToken);
        return Ok(new { message = "Scrap order cancelled successfully" });
    }

    [HttpPut("{id}")]
    [SwaggerOperation("Update a scrap order.", "Requires authentication. Only allowed when status is 'draft'.")]
    [ProducesResponseType(StatusCodes.Status200OK)]
    [ProducesResponseType(StatusCodes.Status400BadRequest)]
    [ProducesResponseType(StatusCodes.Status401Unauthorized)]
    [ProducesResponseType(StatusCodes.Status404NotFound)]
    public async Task<IActionResult> UpdateScrapOrder(int id, [FromBody] CreateScrapOrderDto dto, CancellationToken cancellationToken)
    {
        var managerId = GetEffectiveUserId();
        await _scrapOrderService.UpdateAsync(managerId, id, dto, cancellationToken);
        return Ok(new { message = "Scrap order updated successfully" });
    }

    [HttpDelete("{id}")]
    [SwaggerOperation("Delete a scrap order.", "Requires authentication. Only allowed when status is 'draft'. Will delete linked stock documents and transactions.")]
    [ProducesResponseType(StatusCodes.Status200OK)]
    [ProducesResponseType(StatusCodes.Status400BadRequest)]
    [ProducesResponseType(StatusCodes.Status401Unauthorized)]
    [ProducesResponseType(StatusCodes.Status404NotFound)]
    public async Task<IActionResult> DeleteScrapOrder(int id, CancellationToken cancellationToken)
    {
        var managerId = GetEffectiveUserId();
        await _scrapOrderService.DeleteAsync(managerId, id, cancellationToken);
        return Ok(new { message = "Scrap order deleted successfully" });
    }

    private int GetEffectiveUserId()
    {
        var managerIdStr = User.FindFirst("ManagerId")?.Value;
        if (int.TryParse(managerIdStr, out var managerId) && managerId > 0)
            return managerId;

        var userIdStr = User.FindFirst(System.Security.Claims.ClaimTypes.NameIdentifier)?.Value;
        if (int.TryParse(userIdStr, out var userId) && userId > 0)
            return userId;

        throw new BuildingBlocks.Exceptions.ForbiddenException("Invalid or missing user identity in token.");
    }
}
