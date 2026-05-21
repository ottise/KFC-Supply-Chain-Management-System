using Inventory.Application.DTOs.PurchaseOrder;
using Inventory.Application.IRepositories;
using Inventory.Application.IServices;
using Inventory.Domain.Entities;

namespace Inventory.Application.Services
{
    public class PurchaseOrderItemService : IPurchaseOrderItemService
    {
        private readonly IUnitOfWork _unitOfWork;

        public PurchaseOrderItemService(IUnitOfWork unitOfWork)
        {
            _unitOfWork = unitOfWork ?? throw new ArgumentNullException(nameof(unitOfWork));
        }

        public async Task<IEnumerable<PurchaseOrderItem>> GetAllAsync()
        {
            var result = await _unitOfWork.PurchaseOrderItem.GetAllAsync();
            if (result == null) throw new Exception("No purchase order items found.");
            return result;
        }

        public async Task<PurchaseOrderItem?> GetByIdAsync(int id)
        {
            if (id <= 0) throw new ArgumentException("Id must be greater than zero.");
            var item = await _unitOfWork.PurchaseOrderItem.GetByIdAsync(id);
            if (item == null) throw new Exception($"PurchaseOrderItem with id {id} not found.");
            return item;
        }

        public async Task<List<PurchaseOrderItem>> GetPurchaseOrderByOrderId(int id)
        {
            if (id <= 0) throw new ArgumentException("OrderId must be greater than zero.");
            var result = await _unitOfWork.PurchaseOrderItem.GetPurchaseOrderByOrderId(id);
            if (result == null || result.Count == 0) throw new Exception($"No items found for PurchaseOrderId {id}.");
            return result;
        }

        public async Task<List<PurchaseOrderItem>> GetPurchaseOrderByProductIdAsync(int id)
        {
            if (id <= 0) throw new ArgumentException("ProductId must be greater than zero.");
            var result = await _unitOfWork.PurchaseOrderItem.GetPurchaseOrderByProductIdAsync(id);
            if (result == null || result.Count == 0) throw new Exception($"No items found for ProductId {id}.");
            return result;
        }

        public async Task<List<PurchaseOrderItem>> GetPurchaseOrderByOrderQty(decimal amount)
        {
            if (amount <= 0) throw new ArgumentException("OrderedQty must be greater than zero.");
            var result = await _unitOfWork.PurchaseOrderItem.GetPurchaseOrderByOrderQty(amount);
            if (result == null || result.Count == 0) throw new Exception($"No items found with OrderedQty {amount}.");
            return result;
        }

        public async Task<List<PurchaseOrderItem>> GetPurchaseOrderByReceivedQty(decimal amount)
        {
            if (amount < 0) throw new ArgumentException("ReceivedQty cannot be negative.");
            var result = await _unitOfWork.PurchaseOrderItem.GetPurchaseOrderByReceivedQty(amount);
            if (result == null || result.Count == 0) throw new Exception($"No items found with ReceivedQty {amount}.");
            return result;
        }

        public async Task<List<PurchaseOrderItem>> GetPurchaseOrderByUnitPrice(decimal amount)
        {
            if (amount < 0) throw new ArgumentException("UnitPrice cannot be negative.");
            var result = await _unitOfWork.PurchaseOrderItem.GetPurchaseOrderByUnitPrice(amount);
            if (result == null || result.Count == 0) throw new Exception($"No items found with UnitPrice {amount}.");
            return result;
        }

        public async Task<List<PurchaseOrderItem>> GetPurchaseOrderBySubtotal(decimal amount)
        {
            if (amount < 0) throw new ArgumentException("Subtotal cannot be negative.");
            var result = await _unitOfWork.PurchaseOrderItem.GetPurchaseOrderBySubtotal(amount);
            if (result == null || result.Count == 0) throw new Exception($"No items found with Subtotal {amount}.");
            return result;
        }

        public async Task CreatePurchaseOrderItem(CreatePurchaseOrderItemDto dto)
        {
            if (dto == null) throw new ArgumentNullException(nameof(dto));
            if (dto.OrderedQty <= 0) throw new ArgumentException("OrderedQty must be greater than zero.");
            if (dto.UnitPrice < 0) throw new ArgumentException("UnitPrice cannot be negative.");

            await _unitOfWork.PurchaseOrderItem.CreatePurchaseOrderItem(dto);
            await _unitOfWork.SaveChangesAsync();
        }

        public async Task UpdatePurchaseOrderItemId(int id, int purchaseOrderId)
        {
            if (id <= 0) throw new ArgumentException("Id must be greater than zero.");
            if (purchaseOrderId <= 0) throw new ArgumentException("PurchaseOrderId must be greater than zero.");

            await _unitOfWork.PurchaseOrderItem.UpdatePurchaseOrderItemId(id, purchaseOrderId);
            await _unitOfWork.SaveChangesAsync();
        }

        public async Task UpdateProductId(int id, int productId)
        {
            if (id <= 0) throw new ArgumentException("Id must be greater than zero.");
            if (productId <= 0) throw new ArgumentException("ProductId must be greater than zero.");

            await _unitOfWork.PurchaseOrderItem.UpdateProductId(id, productId);
            await _unitOfWork.SaveChangesAsync();
        }

        public async Task UpdateOrderedQty(int id, decimal orderedQty)
        {
            if (id <= 0) throw new ArgumentException("Id must be greater than zero.");
            if (orderedQty <= 0) throw new ArgumentException("OrderedQty must be greater than zero.");

            await _unitOfWork.PurchaseOrderItem.UpdateOrderedQty(id, orderedQty);
            await _unitOfWork.SaveChangesAsync();
        }

        public async Task UpdateReceivedQty(int id, decimal receivedQty)
        {
            if (id <= 0) throw new ArgumentException("Id must be greater than zero.");
            if (receivedQty < 0) throw new ArgumentException("ReceivedQty cannot be negative.");

            await _unitOfWork.PurchaseOrderItem.UpdateReceivedQty(id, receivedQty);
            await _unitOfWork.SaveChangesAsync();
        }

        public async Task UpdateUnitPrice(int id, decimal unitPrice)
        {
            if (id <= 0) throw new ArgumentException("Id must be greater than zero.");
            if (unitPrice < 0) throw new ArgumentException("UnitPrice cannot be negative.");

            await _unitOfWork.PurchaseOrderItem.UpdateUnitPrice(id, unitPrice);
            await _unitOfWork.SaveChangesAsync();
        }


        //

        public async Task<PurchaseOrderItem> CreatePurchaseOrderItem(PurchaseOrderItem dto)
        {
            if (dto == null) throw new ArgumentNullException(nameof(dto));
            if (dto.PurchaseOrderId == null || dto.PurchaseOrderId <= 0) throw new ArgumentException("Invalid PurchaseOrderId");
            if (dto.ProductId == null || dto.ProductId <= 0) throw new ArgumentException("Invalid ProductId");

            await _unitOfWork.PurchaseOrderItem.CreatePurchaseOrderItem(dto);
            await _unitOfWork.SaveChangesAsync();
            return dto;
        }
        public async Task<PurchaseOrderItem?> GetByPurchaseOrderIdAndProductIdAndLotId(int purchaseOrderId, int productId, int lotId)
        {
            if (purchaseOrderId <= 0) throw new ArgumentException("Invalid purchase order id");
            if (productId <= 0) throw new ArgumentException("Invalid product id");
            if (lotId < 0) throw new ArgumentException("Invalid lot id");

            return await _unitOfWork.PurchaseOrderItem.GetByPurchaseOrderIdAndProductIdAndLotId(purchaseOrderId, productId, lotId);
        }

        public async Task UpdatePurchaseOrderItem(PurchaseOrderItem item)
        {
            if (item == null) throw new ArgumentNullException(nameof(item));

            await _unitOfWork.PurchaseOrderItem.UpdatePurchaseOrderItem(item);
            await _unitOfWork.SaveChangesAsync();
        }

        public async Task<List<ProductLot>> GetProductLotsByItemIdAsync(int itemId)
        {
            return await _unitOfWork.PurchaseOrderItem.GetProductLotsByItemIdAsync(itemId);
        }

        public async Task DeleteAsync(PurchaseOrderItem item)
        {
            if (item == null) throw new ArgumentNullException(nameof(item));
            await _unitOfWork.PurchaseOrderItem.DeleteAsync(item);
            await _unitOfWork.SaveChangesAsync();
        }
    }
}
