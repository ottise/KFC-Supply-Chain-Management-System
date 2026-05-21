using System.Security.Claims;
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
    public class PurchaseOrderItemController : ControllerBase
    {
        private readonly IPurchaseOrderItemService _service;
        private readonly IPurchaseOrderOrchestrate _orchestrate;

        public PurchaseOrderItemController(IPurchaseOrderItemService service, IPurchaseOrderOrchestrate orchestrate)
        {
            _service = service ?? throw new ArgumentNullException(nameof(service));
            _orchestrate = orchestrate ?? throw new ArgumentNullException(nameof(orchestrate));
        }

        private int? GetUserIdFromClaims()
        {
            var claim = User.Claims.FirstOrDefault(c => c.Type == ClaimTypes.NameIdentifier);
            return int.TryParse(claim?.Value, out var userId) ? userId : null;
        }


        [HttpGet]
        public async Task<ActionResult<IEnumerable<PurchaseOrderItem>>> GetAll()
        {
            var items = await _service.GetAllAsync();
            return Ok(items);
        }

        [HttpGet("{id}")]
        public async Task<ActionResult<PurchaseOrderItem>> GetById(int id)
        {
            var item = await _service.GetByIdAsync(id);
            return Ok(item);
        }

        [HttpGet("order/{orderId}")]
        public async Task<ActionResult<List<PurchaseOrderItem>>> GetByOrderId(int orderId)
        {
            var items = await _service.GetPurchaseOrderByOrderId(orderId);
            return Ok(items);
        }

        [HttpGet("product/{productId}")]
        public async Task<ActionResult<List<PurchaseOrderItem>>> GetByProductId(int productId)
        {
            var items = await _service.GetPurchaseOrderByProductIdAsync(productId);
            return Ok(items);
        }

        [HttpGet("orderedQty/{amount}")]
        public async Task<ActionResult<List<PurchaseOrderItem>>> GetByOrderedQty(decimal amount)
        {
            var items = await _service.GetPurchaseOrderByOrderQty(amount);
            return Ok(items);
        }

        [HttpGet("receivedQty/{amount}")]
        public async Task<ActionResult<List<PurchaseOrderItem>>> GetByReceivedQty(decimal amount)
        {
            var items = await _service.GetPurchaseOrderByReceivedQty(amount);
            return Ok(items);
        }

        [HttpGet("unitPrice/{amount}")]
        public async Task<ActionResult<List<PurchaseOrderItem>>> GetByUnitPrice(decimal amount)
        {
            var items = await _service.GetPurchaseOrderByUnitPrice(amount);
            return Ok(items);
        }

        [HttpGet("subtotal/{amount}")]
        public async Task<ActionResult<List<PurchaseOrderItem>>> GetBySubtotal(decimal amount)
        {
            var items = await _service.GetPurchaseOrderBySubtotal(amount);
            return Ok(items);
        }

        [HttpPost]
        public async Task<IActionResult> Create([FromBody] CreatePurchaseOrderItemDto dto)
        {
            await _service.CreatePurchaseOrderItem(dto);
            return CreatedAtAction(nameof(GetById), new { id = dto.PurchaseOrderId }, dto);
        }

        [HttpPut("{id}/order/{purchaseOrderId}")]
        public async Task<IActionResult> UpdatePurchaseOrderItemId(int id, int purchaseOrderId)
        {
            await _service.UpdatePurchaseOrderItemId(id, purchaseOrderId);
            return NoContent();
        }

        [HttpPut("{id}/product/{productId}")]
        public async Task<IActionResult> UpdateProductId(int id, int productId)
        {
            await _service.UpdateProductId(id, productId);
            return NoContent();
        }

        [HttpPut("{id}/orderedQty/{orderedQty}")]
        public async Task<IActionResult> UpdateOrderedQty(int id, decimal orderedQty)
        {
            await _service.UpdateOrderedQty(id, orderedQty);
            return NoContent();
        }

        [HttpPut("{id}/receivedQty/{receivedQty}")]
        public async Task<IActionResult> UpdateReceivedQty(int id, decimal receivedQty)
        {
            await _service.UpdateReceivedQty(id, receivedQty);
            return NoContent();
        }

        [HttpPut("{id}/unitPrice/{unitPrice}")]
        public async Task<IActionResult> UpdateUnitPrice(int id, decimal unitPrice)
        {
            await _service.UpdateUnitPrice(id, unitPrice);
            return NoContent();
        }

        [HttpGet("{id}/lots")]
        public async Task<ActionResult<List<ProductLot>>> GetLots(int id)
        {
            var lots = await _service.GetProductLotsByItemIdAsync(id);
            return Ok(lots);
        }

        [HttpDelete("{id}")]
        public async Task<IActionResult> Delete(int id)
        {
            try
            {
                var userId = GetUserIdFromClaims() ?? 0;
                await _orchestrate.DeleteDraftPurchaseOrderItemAsync(id, userId);
                return NoContent();
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
