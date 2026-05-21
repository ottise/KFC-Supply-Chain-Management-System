using Inventory.Application.DTOs;
using Inventory.Application.IServices;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Http;
using Microsoft.AspNetCore.Mvc;
using Swashbuckle.AspNetCore.Annotations;

namespace Inventory.Presentation.Controllers;

[ApiController]
[Route("api/[controller]")]
[Authorize]
[Produces("application/json")]
[SwaggerTag("View Stock Transactions by Stock Document (read-only, filtered by manager's warehouses)")]
public class StockTransactionsController : ControllerBase
{
    private readonly IStockTransactionService _stockTransactionService;

    public StockTransactionsController(IStockTransactionService stockTransactionService)
    {
        _stockTransactionService = stockTransactionService;
    }

    [HttpGet("by-document/{documentId:int}")]
    [SwaggerOperation(
        Summary = "Get stock transactions by stock document ID",
        Description = "Returns all stock transactions belonging to a specific stock document. Only accessible if the document belongs to the manager's warehouses.")]
    [ProducesResponseType(typeof(IEnumerable<StockTransactionDto>), StatusCodes.Status200OK)]
    [ProducesResponseType(StatusCodes.Status400BadRequest)]
    [ProducesResponseType(StatusCodes.Status401Unauthorized)]
    [ProducesResponseType(StatusCodes.Status403Forbidden)]
    [ProducesResponseType(StatusCodes.Status404NotFound)]
    public async Task<IActionResult> GetByDocumentId(int documentId)
    {
        var managerId = GetEffectiveManagerId();
        var transactions = await _stockTransactionService.GetByDocumentIdAsync(managerId, documentId);
        return Ok(transactions);
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
}
