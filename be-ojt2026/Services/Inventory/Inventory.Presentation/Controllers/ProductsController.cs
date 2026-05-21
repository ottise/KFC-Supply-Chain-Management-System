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
[SwaggerTag("API quản lý sản phẩm: danh sách, chi tiết, tạo mới, cập nhật, lưu trữ, khôi phục")]
public class ProductsController : ControllerBase
{
    private readonly IProductService _productService;

    public ProductsController(IProductService productService)
    {
        _productService = productService;
    }

    [HttpGet]
    [SwaggerOperation(
        Summary = "Lấy danh sách sản phẩm có phân trang",
        Description = "Hỗ trợ tìm kiếm theo tên/mã, lọc trạng thái hoạt động, lọc theo danh mục và trả metadata phân trang.")]
    [ProducesResponseType(typeof(PagedResultDto<ProductDto>), StatusCodes.Status200OK)]
    [ProducesResponseType(StatusCodes.Status400BadRequest)]
    [ProducesResponseType(StatusCodes.Status401Unauthorized)]
    public async Task<IActionResult> GetAll(
        [FromQuery] string? search = null,
        [FromQuery] string? searchField = null,
        [FromQuery] bool? isActive = null,
        [FromQuery] int? categoryId = null,
        [FromQuery] int page = 1,
        [FromQuery] int pageSize = 5)
    {
        if (pageSize > 1000)
        {
            pageSize = 1000;
        }

        var result = await _productService.GetAllAsync(search, searchField, isActive, categoryId, page, pageSize);
        return Ok(result);
    }

    [HttpGet("location/{locationId:int}")]
    [SwaggerOperation(
        Summary = "Lấy danh sách sản phẩm theo vị trí",
        Description = "Trả về danh sách sản phẩm đang có tồn kho tại locationId.")]
    [ProducesResponseType(typeof(IEnumerable<ProductDto>), StatusCodes.Status200OK)]
    [ProducesResponseType(StatusCodes.Status400BadRequest)]
    [ProducesResponseType(StatusCodes.Status401Unauthorized)]
    public async Task<IActionResult> GetByLocationId(int locationId)
    {
        var products = await _productService.GetByLocationIdAsync(locationId);
        return Ok(products);
    }

    [HttpGet("{id:int}")]
    [SwaggerOperation(
        Summary = "Lấy chi tiết sản phẩm theo ID",
        Description = "Trả về thông tin chi tiết của một sản phẩm theo khóa chính id.")]
    [ProducesResponseType(typeof(ProductDto), StatusCodes.Status200OK)]
    [ProducesResponseType(StatusCodes.Status404NotFound)]
    [ProducesResponseType(StatusCodes.Status401Unauthorized)]
    public async Task<IActionResult> GetById(int id)
    {
        var product = await _productService.GetByIdAsync(id);
        return Ok(product);
    }

    [HttpGet("code/{code}")]
    [SwaggerOperation(
        Summary = "Lấy chi tiết sản phẩm theo mã",
        Description = "Tìm sản phẩm theo mã định danh code.")]
    [ProducesResponseType(typeof(ProductDto), StatusCodes.Status200OK)]
    [ProducesResponseType(StatusCodes.Status400BadRequest)]
    [ProducesResponseType(StatusCodes.Status404NotFound)]
    [ProducesResponseType(StatusCodes.Status401Unauthorized)]
    public async Task<IActionResult> GetByCode(string code)
    {
        var product = await _productService.GetByCodeAsync(code);
        return Ok(product);
    }

    [HttpPost]
    [SwaggerOperation(
        Summary = "Tạo mới sản phẩm",
        Description = "Tạo mới một sản phẩm và kiểm tra validation dữ liệu + ràng buộc nghiệp vụ (trùng code, FK tồn tại).")]
    [ProducesResponseType(StatusCodes.Status201Created)]
    [ProducesResponseType(StatusCodes.Status400BadRequest)]
    [ProducesResponseType(StatusCodes.Status404NotFound)]
    [ProducesResponseType(StatusCodes.Status409Conflict)]
    [ProducesResponseType(StatusCodes.Status401Unauthorized)]
    public async Task<IActionResult> Create([FromBody] CreateProductDto dto)
    {
        await _productService.CreateAsync(dto);
        return StatusCode(201, new { message = "Product created successfully" });
    }

    [HttpPut("{id:int}")]
    [SwaggerOperation(
        Summary = "Cập nhật sản phẩm",
        Description = "Cập nhật thông tin sản phẩm theo id. Cho phép cập nhật linh hoạt các field được gửi lên.")]
    [ProducesResponseType(StatusCodes.Status200OK)]
    [ProducesResponseType(StatusCodes.Status400BadRequest)]
    [ProducesResponseType(StatusCodes.Status404NotFound)]
    [ProducesResponseType(StatusCodes.Status409Conflict)]
    [ProducesResponseType(StatusCodes.Status401Unauthorized)]
    public async Task<IActionResult> Update(int id, [FromBody] UpdateProductDto dto)
    {
        await _productService.UpdateAsync(id, dto);
        return Ok(new { message = "Product updated successfully" });
    }

    [HttpDelete("{id:int}")]
    [SwaggerOperation(
        Summary = "Lưu trữ mềm sản phẩm (archive)",
        Description = "Đánh dấu sản phẩm về trạng thái không hoạt động (isActive = false), không xóa cứng dữ liệu.")]
    [ProducesResponseType(StatusCodes.Status200OK)]
    [ProducesResponseType(StatusCodes.Status400BadRequest)]
    [ProducesResponseType(StatusCodes.Status404NotFound)]
    [ProducesResponseType(StatusCodes.Status401Unauthorized)]
    public async Task<IActionResult> SoftDelete(int id)
    {
        await _productService.SoftDeleteAsync(id);
        return Ok(new { message = "Product archived successfully" });
    }

    [HttpPatch("{id:int}/restore")]
    [SwaggerOperation(
        Summary = "Khôi phục sản phẩm đã lưu trữ",
        Description = "Đánh dấu sản phẩm hoạt động trở lại (isActive = true).")]
    [ProducesResponseType(StatusCodes.Status200OK)]
    [ProducesResponseType(StatusCodes.Status400BadRequest)]
    [ProducesResponseType(StatusCodes.Status404NotFound)]
    [ProducesResponseType(StatusCodes.Status401Unauthorized)]
    public async Task<IActionResult> Restore(int id)
    {
        await _productService.RestoreAsync(id);
        return Ok(new { message = "Product restored successfully" });
    }

    [HttpPost("calculate-price")]
    [SwaggerOperation(
        Summary = "Tính toán giá bán gợi ý",
        Description = "Tính toán giá bán dựa trên giá nhập, đơn vị tính và phần trăm lợi nhuận (tùy chọn).")]
    [ProducesResponseType(typeof(PriceCalculationResponseDto), StatusCodes.Status200OK)]
    [ProducesResponseType(StatusCodes.Status400BadRequest)]
    [ProducesResponseType(StatusCodes.Status401Unauthorized)]
    public async Task<IActionResult> CalculatePrice([FromBody] PriceCalculationDto dto)
    {
        var result = await _productService.CalculatePriceAsync(dto);
        return Ok(result);
    }
}
