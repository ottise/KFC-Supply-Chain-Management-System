using Inventory.Application.DTOs;
using Inventory.Application.DTOs.PurchaseOrder;
using Inventory.Application.IServices;
using Inventory.Domain.Entities;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;

namespace Inventory.Presentation.Controllers
{
    [ApiController]
    [Route("api/[controller]")]
    [Authorize]
    public class PurchaseOrdersController : ControllerBase
    {
        private readonly IPurchaseOrderService _purchaseOrderService;
        private readonly IPurchaseOrderOrchestrate _purchaseOrderOrchestrate;
        public PurchaseOrdersController(IPurchaseOrderService purchaseOrderService, IPurchaseOrderOrchestrate purchaseOrderOrchestrate)
        {
            _purchaseOrderService = purchaseOrderService;
            _purchaseOrderOrchestrate = purchaseOrderOrchestrate;
        }

        // GET /api/PurchaseOrders/search?search=abc&status=Draft&page=1&pageSize=10
        [HttpGet("search")]
        public async Task<ActionResult<PagedResultDto<PurchaseOrderResponseDto>>> Search([FromQuery] PurchaseOrderSearchDto searchDto, [FromQuery] int? managerId)
        {
            if (managerId.HasValue && managerId > 0)
            {
                var authLocationIds = await _purchaseOrderOrchestrate.GetAuthorizedLocationIdsAsync(managerId.Value);
                searchDto.AuthorizedLocationIds = authLocationIds.ToList();
            }

            var result = await _purchaseOrderService.SearchAsync(searchDto);
            return Ok(result);
        }

        [HttpGet]
        public async Task<ActionResult<IEnumerable<PurchaseOrder>>> GetAll()
        {
            var orders = await _purchaseOrderService.GetAllAsync();
            return Ok(orders);
        }

        [HttpGet("{id}")]
        public async Task<ActionResult<PurchaseOrder>> GetById(int id)
        {
            var order = await _purchaseOrderService.GetByIdAsync(id);
            return Ok(order);
        }

        // GET /api/PurchaseOrders/{id}/detail
        // Trả về: documentNo, origin, supplierName, toLocationName, status
        [HttpGet("{id}/detail")]
        public async Task<ActionResult<PurchaseOrderResponseDto>> GetDetailById(int id)
        {
            var result = await _purchaseOrderService.GetDetailByIdAsync(id);
            if (result == null) return NotFound($"Không tìm thấy Purchase Order với Id {id}.");
            return Ok(result);
        }

        [HttpGet("supplier/{supplierId}")]
        public async Task<ActionResult<List<PurchaseOrder>>> GetBySupplierId(int supplierId)
        {
            var orders = await _purchaseOrderService.GetBySupplierIdAsync(supplierId);
            return Ok(orders);
        }

        [HttpGet("status/{status}")]
        public async Task<ActionResult<List<PurchaseOrder>>> GetByStatus(string status)
        {
            var orders = await _purchaseOrderService.GetByStatusAsync(status);
            return Ok(orders);
        }

        [HttpGet("created/{date}")]
        public async Task<ActionResult<List<PurchaseOrder>>> GetByCreatedAt(DateTime date)
        {
            var orders = await _purchaseOrderService.GetByCreatedAtAsync(date);
            return Ok(orders);
        }

        [HttpGet("confirmed/{date}")]
        public async Task<ActionResult<List<PurchaseOrder>>> GetByConfirmedAt(DateTime date)
        {
            var orders = await _purchaseOrderService.GetByConfirmedAtAsync(date);
            return Ok(orders);
        }

        [HttpGet("completed/{date}")]
        public async Task<ActionResult<List<PurchaseOrder>>> GetByCompletedAt(DateTime date)
        {
            var orders = await _purchaseOrderService.GetByCompletedAtAsync(date);
            return Ok(orders);
        }

        [HttpPost]
        public async Task<ActionResult> Add([FromBody] CreatePurchaseOrderDto dto)
        {
            await _purchaseOrderService.AddAsync(dto);
            return Ok("Purchase order created successfully.");
        }

        [HttpPut("{id}/supplier/{supplierId}")]
        public async Task<ActionResult> UpdateSupplier(int id, int supplierId)
        {
            await _purchaseOrderService.UpdateSupplierAsync(id, supplierId);
            return Ok("Supplier updated successfully.");
        }

        [HttpPut("{id}/status/{status}")]
        public async Task<ActionResult> UpdateStatus(int id, string status)
        {
            await _purchaseOrderService.UpdateStatusAsync(id, status);
            return Ok("Status updated successfully.");
        }
        //
        //private int? GetManagerId()
        //{

        //    var managerIdClaim = User.FindFirst(ClaimTypes.NameIdentifier)?.Value
        //                         ?? User.FindFirst("sub")?.Value;
        //    if (string.IsNullOrEmpty(managerIdClaim))
        //        throw new UnauthorizedAccessException("ManagerId not found in token");

        //    //return int.Parse(managerIdClaim);
        //    return null;
        //}
        //private int GetUserId()
        //{
        //    var claim = User.Claims.FirstOrDefault(c => c.Type == "userId");
        //    if (claim == null)
        //        throw new UnauthorizedAccessException("Không tìm thấy claim userId trong token");

        //    if (int.TryParse(claim.Value, out var userId))
        //        return 3;

        //    throw new UnauthorizedAccessException("Claim userId không hợp lệ");

        //}
        private int? GetManagerId()
        {
            var claim = User.Claims.FirstOrDefault(c => c.Type == "ManagerId");
            if (claim != null && int.TryParse(claim.Value, out var managerId) && managerId > 0)
                return managerId;
            return null;
        }

        private int GetUserId()
        {
            var claim = User.Claims.FirstOrDefault(c => c.Type == System.Security.Claims.ClaimTypes.NameIdentifier);
            if (claim != null && int.TryParse(claim.Value, out var userId))
                return userId;

            // Nếu không đăng nhập hoặc không có token (ví dụ test), thì báo lỗi hoặc lấy tạm 3 tùy bạn, tôi sẽ throw lỗi cho chuẩn:
            throw new UnauthorizedAccessException("Không tìm thấy thông tin đăng nhập trong Token");
        }



        [HttpPost("draft")]
        public async Task<IActionResult> CreateDraftPurchaseOrder([FromBody] CreateDraftPurchaseOrderInputDto input)
        {
            if (input == null) return BadRequest("Dữ liệu đầu vào không hợp lệ");

            var managerId = GetManagerId();
            var userId = GetUserId();
            var result = await _purchaseOrderOrchestrate.CreateDraftPurchaseOrderAsync(input, managerId, userId);
            return Ok(result);
        }

        [HttpPost("confirm")]
        public async Task<IActionResult> ConfirmPurchaseOrder([FromBody] CreateConfirmInventoryAdjustmentDto input)
        {
            if (input == null)
                return BadRequest("Dữ liệu đầu vào không hợp lệ");

            var managerId = GetManagerId();
            var userId = GetUserId();

            var result = await _purchaseOrderOrchestrate.ConfirmPurchaseOrderAsync(input, managerId, userId);
            return Ok(result);
        }


        //[HttpPost("completed/{docId}")]
        //public async Task<IActionResult> CompletePurchaseOrder(int docId)
        //{
        //    if (docId <= 0) return BadRequest("DocId là bắt buộc");

        //    var managerId = GetManagerId();
        //    var input = new CreateCompletePurchaseOrderInputDto { DocId = docId };
        //    var result = await _purchaseOrderOrchestrate.CompletePurchaseOrderAsync(input, managerId);
        //    return Ok(result);
        //}

        [HttpPost("completed")]
        public async Task<IActionResult> CompletePurchaseOrder([FromBody] CreateCompletePurchaseOrderInputDto input)
        {
            if (input == null)
                return BadRequest("Dữ liệu đầu vào không hợp lệ");

            var managerId = GetManagerId();
            var userId = GetUserId();

            var result = await _purchaseOrderOrchestrate.CompletePurchaseOrderAsync(input, managerId, userId);
            return Ok(result);
        }
        [HttpPut("{id}/cancel")]
        public async Task<IActionResult> CancelPurchaseOrder(int id)
        {
            if (id <= 0) return BadRequest("Id là bắt buộc");

            var userId = GetUserId();
            try
            {
                await _purchaseOrderOrchestrate.CancelPurchaseOrderAsync(id, userId);
                return Ok(new { message = $"Purchase Order {id} cancelled successfully." });
            }
            catch (KeyNotFoundException ex)
            {
                return NotFound(ex.Message);
            }
            catch (InvalidOperationException ex)
            {
                return BadRequest(ex.Message);
            }
            catch (Exception ex)
            {
                return StatusCode(500, $"An error occurred while cancelling the purchase order: {ex.Message}");
            }
        }
    }
}



