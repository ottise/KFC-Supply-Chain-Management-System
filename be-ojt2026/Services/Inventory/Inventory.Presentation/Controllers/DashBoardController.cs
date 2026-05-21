using BuildingBlocks.Exceptions;
using Inventory.Application.IServices;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using Swashbuckle.AspNetCore.Annotations;
using System.Security.Claims;

namespace Inventory.Presentation.Controllers
{
    [ApiController]
    [Route("api/dashboard")]
    [Authorize]
    public class DashBoardController : ControllerBase
    {
        private readonly IDashBoardService _dashboardService;
        private readonly IWarehouseService _warehouseService;
        public DashBoardController(
            IDashBoardService dashboardService,
            IWarehouseService warehouseService)
        {
            _dashboardService = dashboardService;
            _warehouseService = warehouseService;
        }

        [HttpGet("trend")]
        public async Task<IActionResult> GetInventoryTrend(
            [FromQuery] DateTime startDate,
            [FromQuery] DateTime endDate,
            [FromQuery] int managerId, // Explicitly required as per user request
            [FromQuery] int? warehouseId = null)
        {
            try
            {
                // Get list of warehouses for the provided managerId
                var warehouses = await _warehouseService.GetWarehousesByManagerIdAsync(managerId);

                if (warehouses == null || !warehouses.Any())
                    return Ok(new { trend = new List<object>(), pending = new { } });

                List<int> targetWarehouseIds;
                if (warehouseId.HasValue)
                {
                    // If a specific warehouse is requested, check if it belongs to this manager
                    if (!warehouses.Any(w => w.Id == warehouseId.Value))
                        return BadRequest($"Manager {managerId} không quản lý kho có ID {warehouseId}.");

                    targetWarehouseIds = new List<int> { warehouseId.Value };
                }
                else
                {
                    // Default to all warehouses managed by this manager
                    targetWarehouseIds = warehouses.Select(w => w.Id).ToList();
                }

                var result = await _dashboardService.GetInventoryTrendAsync(startDate, endDate, targetWarehouseIds);
                return Ok(result);
            }
            catch (KeyNotFoundException ex)
            {
                // ManageId manages no warehouses
                return Ok(new { trend = new List<object>(), pending = new { }, message = ex.Message });
            }
            catch (ArgumentException ex)
            {
                return BadRequest(ex.Message);
            }
            catch (Exception ex)
            {
                return StatusCode(500, $"Lỗi hệ thống: {ex.Message}");
            }
        }

        [HttpGet("category-product-counts")]
        [SwaggerOperation(Summary = "Lấy tất cả số product của category parent (admin)")]
        public async Task<IActionResult> GetProductCountByParentCategory()
        {
            try
            {
                var result = await _dashboardService.GetProductCountByParentCategoryAsync();
                return Ok(result);
            }
            catch (Exception ex)
            {

                return BadRequest(ex.Message);
            }
        }


        [HttpGet("warehouse-inventory")]
        [SwaggerOperation(Summary = "Lấy thông tin tất cả warehouse hoặc search theo Id của warehouse đó (ADMIN)")]
        public async Task<IActionResult> GetWarehouseInventory([FromQuery] int? warehouseId = null)
        {
            try
            {
                // Extract JWT claims and verify Admin role
                var roleClaim = User.FindFirst(ClaimTypes.Role)?.Value;
                if (string.IsNullOrEmpty(roleClaim) || !roleClaim.Equals("Admin", StringComparison.OrdinalIgnoreCase))
                {
                    return StatusCode(403 , "Từ chối quyền truy cập. Yêu cầu là Admin.");
                }
                
                var result = await _dashboardService.GetWarehouseInventoryAsync(warehouseId);
                return Ok(result);
            }
            catch (NotFoundException ex)
            {
                return NotFound(new { Message = ex.Message });
            }
            catch (Exception ex)
            {

                return BadRequest(ex.Message);
            }
        }


        [HttpGet("manager-warehouse-inventory")]
        [SwaggerOperation(Summary = "Lấy thông tin những warehouse thuộc quyêng điều hành của manager X")]
        public async Task<IActionResult> GetManagerWarehouseInventory([FromQuery] int? warehouseId = null)
        {
            try
            {
                // Extract JWT claims in controller
                var userIdClaim = User.FindFirst(ClaimTypes.NameIdentifier)?.Value;
                var roleClaim = User.FindFirst(ClaimTypes.Role)?.Value;

                if (string.IsNullOrEmpty(userIdClaim) || string.IsNullOrEmpty(roleClaim))
                {
                    return StatusCode(401, "Người dùng không có quyền sử dụng chức năng này.");
                }

                var userId = int.Parse(userIdClaim);
                var userRole = roleClaim;

                // Pass userId and warehouseId to service
                var result = await _dashboardService.GetManagerWarehouseInventoryAsync(userId, warehouseId);

                if (result == null || (result.Warehouses == null || !result.Warehouses.Any()))
                {
                    return NotFound(new { Message = "Không tìm thấy warehouse hoặc quyền truy cập bị từ chối." });
                }

                return Ok(result);
            }
            catch (NotFoundException ex)
            {
                return NotFound(new { Message = ex.Message });
            }
            catch (UnauthorizedAccessException ex)
            {
                return Forbid(ex.Message);
            }
            catch (Exception ex)
            {
                return BadRequest(ex.Message);
            }
        }

    }
}
