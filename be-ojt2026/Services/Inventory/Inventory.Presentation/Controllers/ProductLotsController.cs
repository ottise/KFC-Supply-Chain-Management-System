using Inventory.Application.DTOs;
using Inventory.Application.IServices;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;

namespace Inventory.Presentation.Controllers;

[ApiController]
[Route("api/[controller]")]
[Authorize]
public class ProductLotsController : ControllerBase
{
    private readonly IProductLotService _productLotService;

    public ProductLotsController(IProductLotService productLotService)
    {
        _productLotService = productLotService;
    }

    [HttpGet]
    public async Task<IActionResult> GetAll(
        [FromQuery] int page = 1,
        [FromQuery] int pageSize = 10,
        [FromQuery] string? lotNumber = null,
        [FromQuery] DateTime? expirationDateFrom = null,
        [FromQuery] DateTime? expirationDateTo = null)
    {
        var result = await _productLotService.GetPaginatedAsync(page, pageSize, lotNumber, expirationDateFrom, expirationDateTo);
        return Ok(result);
    }

    [HttpGet("all")]
    public async Task<IActionResult> GetAllNoPaging()
    {
        var result = await _productLotService.GetAllAsync();
        return Ok(result);
    }

    [HttpGet("search")]
    public async Task<IActionResult> Search(
        [FromQuery] int page = 1,
        [FromQuery] int pageSize = 10,
        [FromQuery] string? keyword = null,
        [FromQuery] int? productId = null,
        [FromQuery] int? managerId = null,
        [FromQuery] int? locationId = null,
        [FromQuery] DateTime? expirationDateBefore = null,
        [FromQuery] DateTime? expirationDateAfter = null,
        [FromQuery] int? expiresWithinDays = null)
    {
        var result = await _productLotService.SearchAsync(page, pageSize, keyword, productId, managerId, locationId, expirationDateBefore, expirationDateAfter, expiresWithinDays);
        return Ok(result);
    }

    [HttpGet("{id:int}")]
    public async Task<IActionResult> GetById(int id)
    {
        var lot = await _productLotService.GetByIdAsync(id);
        if (lot == null)
            return NotFound(new { message = $"Product lot with ID {id} was not found." });
        return Ok(lot);
    }

    [HttpGet("location/{locationId:int}")]
    public async Task<IActionResult> GetByLocationId(int locationId)
    {
        var lots = await _productLotService.GetByLocationIdAsync(locationId);
        return Ok(lots);
    }

    [HttpGet("location/{locationId:int}/product/{productId:int}")]
    public async Task<IActionResult> GetByLocationAndProduct(int locationId, int productId)
    {
        var lots = await _productLotService.GetByLocationAndProductAsync(locationId, productId);
        return Ok(lots);
    }

    [HttpPost]
    public async Task<IActionResult> Create([FromBody] CreateProductLotDto dto)
    {
        var lot = await _productLotService.CreateAsync(dto);
        return StatusCode(201, new
        {
            message = "Product lot created successfully.",
            lot
        });
    }

    [HttpPut("{id:int}")]
    public async Task<IActionResult> Update(int id, [FromBody] CreateProductLotDto dto)
    {
        var updated = await _productLotService.UpdateAsync(id, dto);
        return Ok(new
        {
            message = "Product lot updated successfully.",
            lot = updated
        });
    }

    [HttpDelete("{id:int}")]
    public async Task<IActionResult> Delete(int id)
    {
        await _productLotService.DeleteAsync(id);
        return Ok(new { message = $"Product lot with ID {id} has been deleted successfully." });
    }
}
