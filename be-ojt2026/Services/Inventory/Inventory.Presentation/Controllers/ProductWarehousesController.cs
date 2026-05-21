using Inventory.Application.DTOs;
using Inventory.Application.DTOs.ProductWarehouse;
using Inventory.Application.IServices;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using Swashbuckle.AspNetCore.Annotations;
using System.Security.Claims;

namespace Inventory.Presentation.Controllers;

[ApiController]
[Route("api/[controller]")]
[Authorize]
public class ProductWarehousesController : ControllerBase
{
    private readonly IProductWarehouseService _productWarehouseService;

    public ProductWarehousesController(IProductWarehouseService productWarehouseService)
    {
        _productWarehouseService = productWarehouseService;
    }

    private int? GetManagerIdFromClaims()
    {
        var claim = User.Claims.FirstOrDefault(c => c.Type == "ManagerId");
        if (int.TryParse(claim?.Value, out var managerId))
            return managerId;
        return null;
    }

    private int? GetUserIdFromClaims()
    {
        var claim = User.Claims.FirstOrDefault(c => c.Type == ClaimTypes.NameIdentifier || c.Type == "id" || c.Type == "UserId");
        return int.TryParse(claim?.Value, out var userId) ? userId : null;
    }

    [HttpGet]
    [SwaggerOperation(
        Summary = "Lấy tất cả sản phẩm trong các kho (hỗ trợ đọc từ query hoặc token)",
        Description = "Hỗ trợ tìm kiếm theo tên/mã, lọc trạng thái hoạt động, lọc theo danh mục và trả metadata phân trang.")]
    [ProducesResponseType(typeof(PagedResultDto<ProductWarehouseDto>), StatusCodes.Status200OK)]
    public async Task<IActionResult> GetAll(
        [FromQuery] int? managerId = null,
        [FromQuery] string? search = null,
        [FromQuery] string? searchField = null,
        [FromQuery] bool? isActive = null,
        [FromQuery] int? categoryId = null,
        [FromQuery] int page = 1,
        [FromQuery] int pageSize = 5)
    {
        var claimManagerId = GetManagerIdFromClaims();
        if (claimManagerId.HasValue && managerId.HasValue && managerId.Value != claimManagerId.Value)
        {
            return StatusCode(403, new { Message = "Bạn không có quyền xem dữ liệu của người quản lý khác." });
        }
        
        if (pageSize > 1000) pageSize = 1000;
        var filterId = claimManagerId ?? managerId ?? GetUserIdFromClaims();
        var result = await _productWarehouseService.GetAllAsync(filterId, search, searchField, isActive, categoryId, page, pageSize);
        return Ok(result);
    }

    [HttpGet("warehouse/{warehouseId}")]
    [SwaggerOperation(
        Summary = "Lấy danh sách sản phẩm theo kho",
        Description = "Hỗ trợ tìm kiếm theo tên/mã, lọc trạng thái hoạt động, lọc theo danh mục và trả metadata phân trang.")]
    [ProducesResponseType(typeof(PagedResultDto<ProductWarehouseDto>), StatusCodes.Status200OK)]
    public async Task<IActionResult> GetByWarehouseId(
        int warehouseId,
        [FromQuery] string? search = null,
        [FromQuery] string? searchField = null,
        [FromQuery] bool? isActive = null,
        [FromQuery] int? categoryId = null,
        [FromQuery] int page = 1,
        [FromQuery] int pageSize = 5)
    {
        try
        {
            if (pageSize > 1000) pageSize = 1000;
            var managerId = GetManagerIdFromClaims();
            var userId = GetUserIdFromClaims();
            var result = await _productWarehouseService.GetByWarehouseIdAsync(warehouseId, managerId, userId, search, searchField, isActive, categoryId, page, pageSize);
            return Ok(result);
        }
        catch (UnauthorizedAccessException)
        {
            return StatusCode(403, new { Message = "Bạn không có quyền xem dữ liệu của kho này do không phải quản lý của kho." });
        }
        catch (KeyNotFoundException ex)
        {
            return NotFound(new { Message = ex.Message });
        }
    }

    [HttpPost]
    [SwaggerOperation(Summary = "Thêm sản phẩm vào kho")]
    public async Task<IActionResult> AddProductToWarehouse([FromBody] AddProductWarehouseDto request)
    {
        try
        {
            var userId = GetUserIdFromClaims();
            var managerId = GetManagerIdFromClaims();
            var result = await _productWarehouseService.AddProductToWarehouseAsync(request, userId, managerId);
            return Ok(result);
        }
        catch (KeyNotFoundException ex)
        {
            return NotFound(new { Message = ex.Message });
        }
        catch (InvalidOperationException ex)
        {
            return BadRequest(new { Message = ex.Message });
        }
        catch (Exception ex)
        {
            return StatusCode(500, new { Message = ex.Message });
        }
    }

    [HttpDelete("{id}")]
    [SwaggerOperation(Summary = "Xóa (soft delete) sản phẩm khỏi kho")]
    public async Task<IActionResult> RemoveProductFromWarehouse(int id)
    {
        try
        {
            var managerId = GetManagerIdFromClaims();
            var userId = GetUserIdFromClaims();
            await _productWarehouseService.RemoveProductFromWarehouseAsync(id, managerId, userId);
            return Ok(new { message = "Xóa sản phẩm khỏi kho thành công", id = id });
        }
        catch (KeyNotFoundException ex)
        {
            return NotFound(new { Message = ex.Message });
        }
        catch (UnauthorizedAccessException ex)
        {
            return StatusCode(403, new { Message = ex.Message });
        }
    }

    [HttpPut("{id}/status")]
    [SwaggerOperation(Summary = "Chỉnh sửa trạng thái sản phẩm trong kho")]
    public async Task<IActionResult> ChangeStatus(int id, [FromBody] ChangeStatusProductWarehouseDto request)
    {
        try
        {
            var managerId = GetManagerIdFromClaims();
            var userId = GetUserIdFromClaims();
            var result = await _productWarehouseService.ChangeStatusAsync(id, request.IsActive, managerId, userId);
            return Ok(result);
        }
        catch (KeyNotFoundException ex)
        {
            return NotFound(new { Message = ex.Message });
        }
        catch (UnauthorizedAccessException ex)
        {
            return StatusCode(403, new { Message = ex.Message });
        }
        catch (Exception ex)
        {
            return StatusCode(500, new { Message = ex.Message });
        }
    }
}
