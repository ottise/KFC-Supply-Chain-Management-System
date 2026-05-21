using Inventory.Application.DTOs;
using Inventory.Application.IServices;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;

namespace Inventory.Presentation.Controllers;

[ApiController]
[Route("api/[controller]")]
[Authorize]
public class LocationsController : ControllerBase
{
    private readonly ILocationService _locationService;

    public LocationsController(ILocationService locationService)
    {
        _locationService = locationService;
    }

    [HttpPost]
    public async Task<IActionResult> Create([FromBody] CreateLocationDto dto)
    {
        var location = await _locationService.CreateAsync(dto);
        return StatusCode(201, new
        {
            message = "Location created successfully.",
            location
        });
    }

    [HttpGet]
    public async Task<IActionResult> GetAll([FromQuery] int page = 1, [FromQuery] int pageSize = 10,
        [FromQuery] int? warehouseId = null, [FromQuery] bool? isActive = null, [FromQuery] string? search = null,
        [FromQuery] bool? isParent = null, [FromQuery] int? parentId = null, [FromQuery] int? managerId = null)
    {
        var result = await _locationService.GetPaginatedAsync(page, pageSize, warehouseId, isActive, search, isParent, parentId, managerId);
        return Ok(result);
    }

    [HttpGet("all")]
    public async Task<IActionResult> GetAllNoPaging()
    {
        var result = await _locationService.GetAllAsync();
        return Ok(result);
    }

    [HttpGet("{id:int}")]
    public async Task<IActionResult> GetById(int id)
    {
        var location = await _locationService.GetByIdAsync(id);
        if (location == null)
        {
            return NotFound(new { message = $"The location with ID {id} was not found." });
        }

        return Ok(location);
    }

    [HttpPut("{id:int}")]
    public async Task<IActionResult> Update(int id, [FromBody] LocationDto dto)
    {
        var updated = await _locationService.UpdateAsync(id, dto);
        return Ok(new
        {
            message = "Location updated successfully.",
            location = updated
        });
    }

    [HttpPatch("{id:int}/deactivate")]
    public async Task<IActionResult> Deactivate(int id)
    {
        await _locationService.DeactivateAsync(id);
        return Ok(new { message = "Location deactivated successfully." });
    }

    [HttpPatch("{id:int}/activate")]
    public async Task<IActionResult> Activate(int id)
    {
        await _locationService.ActivateAsync(id);
        return Ok(new { message = "Location activated successfully." });
    }

    [HttpDelete("{id:int}")]
    public async Task<IActionResult> Delete(int id)
    {
        await _locationService.DeleteAsync(id);
        return Ok(new { message = $"Location with ID {id} has been deleted successfully." });
    }
}

