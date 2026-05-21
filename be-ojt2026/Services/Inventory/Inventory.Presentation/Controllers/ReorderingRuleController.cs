using Inventory.Application.DTOs.ReorderingRule;
using Inventory.Application.IServices;
using Inventory.Application.Validations.ReorderingRule;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using Swashbuckle.AspNetCore.Annotations;

namespace Inventory.Presentation.Controllers
{
    [ApiController]
    [Route("api/[controller]")]
    [Authorize]
    public class ReorderingRuleController : ControllerBase
    {
        private readonly IReorderingRuleService _reorderingRuleService;

        public ReorderingRuleController(
            IReorderingRuleService reorderingRuleService)
        {
            _reorderingRuleService = reorderingRuleService;
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
            var claim = User.Claims.FirstOrDefault(c => c.Type == System.Security.Claims.ClaimTypes.NameIdentifier || c.Type == "id" || c.Type == "UserId");
            return int.TryParse(claim?.Value, out var userId) ? userId : null;
        }


        [HttpPost]
        [SwaggerOperation(Summary = "Create new reordering rule")]
        public async Task<IActionResult> CreateReorderingRule([FromBody] CreateReorderingRuleRequest request)
        {
            var validation = new CreateReorderingRuleValidation();
            var validationResult = await validation.ValidateAsync(request);
            if (!validationResult.IsValid)
            {
                return StatusCode(422, new { Message = string.Join("; ", validationResult.Errors.Select(e => e.ErrorMessage)) });
            }

            try
            {
                var managerId = GetManagerIdFromClaims();
                var userId = GetUserIdFromClaims();
                var result = await _reorderingRuleService.CreateReOrderingRuleAsync(request, managerId, userId);
                return CreatedAtAction(
                    nameof(GetReorderingRules),
                    new { },
                    result);
            }
            catch (KeyNotFoundException ex)
            {
                return NotFound(new { Message = ex.Message });
            }
            catch (InvalidOperationException ex)
            {
                return Conflict(new { Message = ex.Message });
            }
            catch (Exception ex)
            {
                return BadRequest(new { Message = ex.Message });
            }
        }




        [HttpGet]
        [SwaggerOperation(Summary = "Get all reordering rule in db with pagination and filtering")]
        public async Task<IActionResult> GetReorderingRules([FromQuery] int page = 1, [FromQuery] int pageSize = 10,
            [FromQuery] bool? isActive = null, [FromQuery] string? search = null, [FromQuery] int? productWarehouseId = null, [FromQuery] int? warehouseId = null, [FromQuery] int? managerId = null)
        {
            try
            {
                var claimManagerId = GetManagerIdFromClaims();
                if (claimManagerId.HasValue && managerId.HasValue && managerId.Value != claimManagerId.Value)
                {
                    return StatusCode(403, new { Message = "Bạn không có quyền xem dữ liệu của người quản lý khác." });
                }
                var filterId = claimManagerId ?? managerId ?? GetUserIdFromClaims();
                var result = await _reorderingRuleService.GetPaginatedAsync(page, pageSize, isActive, search, productWarehouseId, filterId, warehouseId);
                return Ok(result);
            }
            catch (InvalidOperationException ex)
            {
                return BadRequest(new { Message = ex.Message });
            }
            catch (Exception ex)
            {
                return BadRequest(new { Message = ex.Message });
            }
        }


        [HttpDelete("{productWarehouseId}")]
        [SwaggerOperation(Summary = "Soft delete reordering rule {productWarehouseId required}")]
        public async Task<IActionResult> DeleteReorderingRule(int productWarehouseId)
        {
            try
            {
                var managerId = GetManagerIdFromClaims();
                var userId = GetUserIdFromClaims();
                var result = await _reorderingRuleService.DeleteReOrderingRuleAsync(productWarehouseId, managerId, userId);
                return Ok(new { message = "Xóa quy tắc đặt hàng thành công", productWarehouseId = productWarehouseId });
            }
            catch (KeyNotFoundException ex)
            {
                return NotFound(new { Message = ex.Message });
            }
            catch (Exception ex)
            {
                return BadRequest(new { Message = ex.Message });
            }
        }


        [HttpPut("{productWarehouseId}/status")]
        [SwaggerOperation(Summary = "Change status reordering rule {productWarehouseId required}")]
        public async Task<IActionResult> ChangeStatus(int productWarehouseId, [FromBody] ChangeStatusReorderingRuleDto request)
        {
            try
            {
                var managerId = GetManagerIdFromClaims();
                var userId = GetUserIdFromClaims();
                var result = await _reorderingRuleService.ChangeStatusAsync(productWarehouseId, request.IsActive, managerId, userId);
                return Ok(new { message = "Cập nhật trạng thái thành công" });
            }
            catch (KeyNotFoundException ex)
            {
                return NotFound(new { Message = ex.Message });
            }
            catch (Exception ex)
            {
                return BadRequest(new { Message = ex.Message });
            }
        }

        [HttpPut("{productWarehouseId}")]
        [SwaggerOperation(Summary = "Update reordering rule {productWarehouseId required}")]
        public async Task<IActionResult> UpdateReorderingRule(int productWarehouseId, UpdateReorderingRuleRequest request)
        {
            var validation = new UpdateReorderingRuleValidation();
            var validationResult = await validation.ValidateAsync(request);
            if (!validationResult.IsValid)
            {
                return StatusCode(422, new { Message = string.Join("; ", validationResult.Errors.Select(e => e.ErrorMessage)) });
            }

            try
            {
                var managerId = GetManagerIdFromClaims();
                var userId = GetUserIdFromClaims();
                var result = await _reorderingRuleService.UpdaReOrOrderingRuleAsync(request, productWarehouseId, managerId, userId);
                return Ok(result);
            }
            catch (KeyNotFoundException ex)
            {
                return NotFound(new { Message = ex.Message });
            }
            catch (InvalidOperationException ex)
            {
                return Conflict(new { Message = ex.Message });
            }
            catch (Exception ex)
            {
                return BadRequest(new { Message = ex.Message });
            }
        }

        [HttpGet("warnings")]
        [SwaggerOperation(Summary = "Lấy danh sách cảnh báo các sản phẩm dưới mức tồn kho tối thiểu")]
        public async Task<IActionResult> GetWarnings([FromQuery] int page = 1, [FromQuery] int pageSize = 10, [FromQuery] int? managerId = null, [FromQuery] int? warehouseId = null)
        {
            try
            {
                var claimManagerId = GetManagerIdFromClaims();
                if (claimManagerId.HasValue && managerId.HasValue && managerId.Value != claimManagerId.Value)
                {
                    return StatusCode(403, new { Message = "Bạn không có quyền xem dữ liệu của người quản lý khác." });
                }
                var filterId = claimManagerId ?? managerId ?? GetUserIdFromClaims();
                var result = await _reorderingRuleService.GetWarningsAsync(page, pageSize, filterId, warehouseId);
                return Ok(result);
            }
            catch (Exception ex)
            {
                return BadRequest(new { Message = ex.Message });
            }
        }

    }
}
