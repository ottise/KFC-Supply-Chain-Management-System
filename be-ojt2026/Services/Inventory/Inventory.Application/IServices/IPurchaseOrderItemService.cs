using Inventory.Application.DTOs.PurchaseOrder;
using Inventory.Domain.Entities;

namespace Inventory.Application.IServices;

public interface IPurchaseOrderItemService
{
    Task<IEnumerable<PurchaseOrderItem>> GetAllAsync();
    Task<PurchaseOrderItem?> GetByIdAsync(int id);
    Task<List<PurchaseOrderItem>> GetPurchaseOrderByOrderId(int id);
    Task<List<PurchaseOrderItem>> GetPurchaseOrderByProductIdAsync(int id);
    Task<List<PurchaseOrderItem>> GetPurchaseOrderByOrderQty(decimal amount);
    Task<List<PurchaseOrderItem>> GetPurchaseOrderByReceivedQty(decimal amount);
    Task<List<PurchaseOrderItem>> GetPurchaseOrderByUnitPrice(decimal amount);
    Task<List<PurchaseOrderItem>> GetPurchaseOrderBySubtotal(decimal amount);

    Task CreatePurchaseOrderItem(CreatePurchaseOrderItemDto dto);

    Task UpdatePurchaseOrderItemId(int id, int purchaseOrderId);
    Task UpdateProductId(int id, int productId);
    Task UpdateOrderedQty(int id, decimal orderedQty);
    Task UpdateReceivedQty(int id, decimal receivedQty);
    Task UpdateUnitPrice(int id, decimal unitPrice);



    Task<PurchaseOrderItem> CreatePurchaseOrderItem(PurchaseOrderItem dto);
    Task<PurchaseOrderItem?> GetByPurchaseOrderIdAndProductIdAndLotId(int purchaseOrderId, int productId, int lotId);


    Task UpdatePurchaseOrderItem(PurchaseOrderItem item);
    Task<List<ProductLot>> GetProductLotsByItemIdAsync(int itemId);
    Task DeleteAsync(PurchaseOrderItem item);
}
