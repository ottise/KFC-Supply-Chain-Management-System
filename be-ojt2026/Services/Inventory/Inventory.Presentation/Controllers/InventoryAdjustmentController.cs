using Inventory.Application.DTOs.InventoryAdjustment;
using Inventory.Application.IServices;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using System.Security.Claims;

namespace Inventory.Presentation.Controllers
{
    [ApiController]
    [Route("api/[controller]")]
    [Authorize]
    public class InventoryAdjustmentController : ControllerBase
    {
        private readonly IInventoryVoucherService _voucherService;

        public InventoryAdjustmentController(IInventoryVoucherService voucherService)
        {
            _voucherService = voucherService;
        }

        private int? GetManagerIdFromClaims()
        {
            var claim = User.Claims.FirstOrDefault(c => c.Type == "ManagerId");
            return int.TryParse(claim?.Value, out var managerId) ? managerId : null;
        }

        private int? GetUserIdFromClaims()
        {
            var claim = User.Claims.FirstOrDefault(c => c.Type == ClaimTypes.NameIdentifier);
            return int.TryParse(claim?.Value, out var userId) ? userId : null;
        }

        [HttpPost("draft")]
        public async Task<IActionResult> CreateDraft([FromBody] CreateDraftRequestDto request)
        {
            if (request == null)
                return BadRequest("Request không hợp lệ");

            try
            {
                var managerId = GetManagerIdFromClaims();
                var userId = GetUserIdFromClaims() ?? 0;

                var result = await _voucherService.CreateDraftAsync(request, managerId, userId);
                return Ok(result);
            }
            catch (Exception ex) when (ex is ArgumentException || ex is KeyNotFoundException || ex is InvalidOperationException)
            {
                return BadRequest(ex.Message);
            }
            catch (Exception ex)
            {
                return StatusCode(500, $"Lỗi hệ thống: {ex.Message}");
            }
        }

        [HttpPost("complete")]
        public async Task<IActionResult> CompleteAdjustment([FromBody] List<CompleteRequestDto> requests)
        {
            if (requests == null || !requests.Any())
                return BadRequest("Danh sách request không hợp lệ");

            try
            {
                var managerId = GetManagerIdFromClaims();
                var userId = GetUserIdFromClaims() ?? 0;

                var result = await _voucherService.CompleteAsync(requests, managerId, userId);
                return Ok(result);
            }
            catch (Exception ex) when (ex is ArgumentException || ex is KeyNotFoundException || ex is InvalidOperationException)
            {
                return BadRequest(ex.Message);
            }
            catch (Exception ex)
            {
                return StatusCode(500, $"Lỗi hệ thống: {ex.Message}");
            }
        }

        [HttpGet("manager-inventories")]
        public async Task<IActionResult> GetManagerInventories([FromQuery] int? lotId = null,
                                                               [FromQuery] int? locationId = null,
                                                               [FromQuery] int? warehouseId = null,
                                                               [FromQuery] string? status = null)
        {
            try
            {
                var managerId = GetManagerIdFromClaims();
                var userId = GetUserIdFromClaims() ?? 0;

                var inventories = await _voucherService.GetManagerInventoriesAsync(managerId, userId, lotId, locationId, warehouseId, status);
                if (inventories == null || !inventories.Any())
                    return NotFound("Không tìm thấy inventory nào");

                return Ok(inventories);
            }
            catch (Exception ex) when (ex is ArgumentException || ex is KeyNotFoundException)
            {
                return BadRequest(ex.Message);
            }
            catch (Exception ex)
            {
                return StatusCode(500, $"Lỗi hệ thống: {ex.Message}");
            }
        }

        [HttpGet("staff-work")]
        public async Task<IActionResult> GetStaffWork([FromQuery] int? lotId = null,
                                                      [FromQuery] int? locationId = null,
                                                      [FromQuery] int? warehouseId = null)
        {
            try
            {
                var staffId = GetUserIdFromClaims() ?? 0;
                if (staffId <= 0)
                    return BadRequest("Không tìm thấy StaffId trong claim");

                var workList = await _voucherService.GetStaffWorkAsync(staffId, lotId, locationId, warehouseId);
                if (workList == null || !workList.Any())
                    return NotFound("Không tìm thấy công việc nào cho staff");

                return Ok(workList);
            }
            catch (Exception ex) when (ex is ArgumentException || ex is KeyNotFoundException)
            {
                return BadRequest(ex.Message);
            }
            catch (Exception ex)
            {
                return StatusCode(500, $"Lỗi hệ thống: {ex.Message}");
            }
        }

        [HttpPut("update-count")]
        public async Task<IActionResult> UpdateCount([FromBody] UpdateCountRequestDto request)
        {
            if (request == null)
                return BadRequest("Request không hợp lệ");

            try
            {
                var staffId = GetUserIdFromClaims() ?? 0;
                var response = await _voucherService.UpdateCountAsync(request, staffId);

                return Ok(new StaffWorkResponseDto
                {
                    InventoryId = response.InventoryId,
                    WarehouseId = response.WarehouseId,
                    AssigneeId = response.AssigneeId,
                    ProductId = response.ProductId,
                    LocationId = response.LocationId,
                    LotId = response.LotId,
                    TranId = response.TranId,
                    PlanDate = response.PlanDate,
                    SystemQty = response.SystemQty,
                    CountQty = response.CountQty,
                    DifferenceQty = response.DifferenceQty,
                    Status = response.Status
                });
            }
            catch (Exception ex) when (ex is ArgumentException || ex is KeyNotFoundException || ex is InvalidOperationException)
            {
                return BadRequest(ex.Message);
            }
            catch (Exception ex)
            {
                return StatusCode(500, $"Lỗi hệ thống: {ex.Message}");
            }
        }

    }
}
