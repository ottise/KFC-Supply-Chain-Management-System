using System.Collections.Generic;
using System.Threading.Tasks;
using Inventory.Application.DTOs.PurchaseOrder;
using Inventory.Application.IRepositories;
using Inventory.Domain.Entities;
using Inventory.Infrastructure.Data;
using MassTransit;
using Microsoft.EntityFrameworkCore;

namespace Inventory.Infrastructure.Repositories
{
    public class PurchaseOrderItemRepository : IPurchaseOrderItemRepository
    {
        private readonly InventoryDbContext _context;

        public PurchaseOrderItemRepository(InventoryDbContext context)
        {
            _context = context;
        }

        public async Task<IEnumerable<PurchaseOrderItem>> GetAllAsync()
        {
            return await _context.PurchaseOrderItems
                .ToListAsync();
        }

        public async Task<PurchaseOrderItem?> GetByIdAsync(int id)
        {
            return await _context.PurchaseOrderItems
                .SingleOrDefaultAsync(p => p.Id == id);
        }
        public async Task<List<PurchaseOrderItem>> GetPurchaseOrderByOrderId(int id)
        {
            var allOrders = await _context.PurchaseOrderItems
                .AsNoTracking()
                .Include(p => p.Lot)
                .Where(p => p.PurchaseOrderId == id)
                .ToListAsync();
            return allOrders;
        }

        public async Task<List<PurchaseOrderItem>> GetPurchaseOrderByProductIdAsync(int id)
        {
            var allOrders = await _context.PurchaseOrderItems
                .AsNoTracking()
                 .Where(p => p.ProductId == id)
                 .ToListAsync();
            return allOrders;
        }

        public async Task<List<PurchaseOrderItem>> GetPurchaseOrderByOrderQty(decimal amount)
        {
            var allOrders = await _context.PurchaseOrderItems
                .AsNoTracking()
                .Where(p => p.OrderedQty == amount)
                .ToListAsync();
            return allOrders;
        }
        public async Task<List<PurchaseOrderItem>> GetPurchaseOrderByReceivedQty(decimal amount)
        {
            var allOrders = await _context.PurchaseOrderItems
                .AsNoTracking()
                .Where(p => p.ReceivedQty == amount)
                .ToListAsync();
            return allOrders;

        }

        public async Task<List<PurchaseOrderItem>> GetPurchaseOrderByUnitPrice(decimal amount)
        {
            var allOrders = await _context.PurchaseOrderItems
                .AsNoTracking()
                .Where(p => p.UnitPrice == amount)
                .ToListAsync();
            return allOrders;

        }

        public async Task<List<PurchaseOrderItem>> GetPurchaseOrderBySubtotal(decimal amount)
        {
            var allOrders = await _context.PurchaseOrderItems
                .AsNoTracking()
                .Where(p => p.Subtotal == amount)
                .ToListAsync();
            return allOrders;

        }

        public async Task CreatePurchaseOrderItem(CreatePurchaseOrderItemDto dto)
        {
            var purchaseOrderItem = new PurchaseOrderItem
            {
                PurchaseOrderId = dto.PurchaseOrderId,
                ProductId = dto.ProductId,
                OrderedQty = dto.OrderedQty,
                ReceivedQty = dto.ReceivedQty,
                UnitPrice = dto.UnitPrice,
                LotId = dto.LotId,
                Subtotal = dto.OrderedQty * dto.UnitPrice
            };
            await _context.PurchaseOrderItems.AddAsync(purchaseOrderItem);
        }

        public async Task UpdatePurchaseOrderItemId(int id, int purchaseOrderId)
        {
            var purchaseOrderItem = await GetByIdAsync(id);
            if (purchaseOrderItem == null)
            {
                throw new Exception($"PurchaseOrderItem with id {id} not found.");
            }
            purchaseOrderItem.PurchaseOrderId = purchaseOrderId;
            _context.PurchaseOrderItems.Update(purchaseOrderItem);
        }
        public async Task UpdateProductId(int id, int productId)
        {
            var purchaseOrderItem = await GetByIdAsync(id);
            if (purchaseOrderItem == null)
            {
                throw new Exception($"PurchaseOrderItem with id {id} not found.");
            }
            purchaseOrderItem.ProductId = productId;
            _context.PurchaseOrderItems.Update(purchaseOrderItem);
        }
        public async Task UpdateOrderedQty(int id, decimal orderedQty)
        {
            var purchaseOrderItem = await GetByIdAsync(id);
            if (purchaseOrderItem == null)
            {
                throw new Exception($"PurchaseOrderItem with id {id} not found.");
            }
            purchaseOrderItem.OrderedQty = orderedQty;
            purchaseOrderItem.Subtotal = purchaseOrderItem.OrderedQty * purchaseOrderItem.UnitPrice;
            _context.PurchaseOrderItems.Update(purchaseOrderItem);
        }
        public async Task UpdateReceivedQty(int id, decimal receivedQty)
        {
            var purchaseOrderItem = await GetByIdAsync(id);
            if (purchaseOrderItem == null)
            {
                throw new Exception($"PurchaseOrderItem with id {id} not found.");
            }
            purchaseOrderItem.ReceivedQty = receivedQty;
            _context.PurchaseOrderItems.Update(purchaseOrderItem);
        }
        public async Task UpdateUnitPrice(int id, decimal unitPrice)
        {
            var purchaseOrderItem = await GetByIdAsync(id);
            if (purchaseOrderItem == null)
            {
                throw new Exception($"PurchaseOrderItem with id {id} not found.");
            }
            purchaseOrderItem.UnitPrice = unitPrice;
            purchaseOrderItem.Subtotal = purchaseOrderItem.OrderedQty * purchaseOrderItem.UnitPrice;
            _context.PurchaseOrderItems.Update(purchaseOrderItem);
        }
        public async Task<PurchaseOrderItem> CreatePurchaseOrderItem(PurchaseOrderItem dto)
        {
            await _context.PurchaseOrderItems.AddAsync(dto);
            return dto;
        }


        public async Task<PurchaseOrderItem?> GetByPurchaseOrderIdAndProductIdAndLotId(int purchaseOrderId, int productId, int lotId)
        {
            return await _context.PurchaseOrderItems
                .FirstOrDefaultAsync(x => x.PurchaseOrderId == purchaseOrderId && x.ProductId == productId && x.LotId == lotId);
        }

        public async Task UpdatePurchaseOrderItem(PurchaseOrderItem item)
        {
            _context.PurchaseOrderItems.Update(item);
            await Task.CompletedTask;
        }

        public async Task<List<ProductLot>> GetProductLotsByItemIdAsync(int itemId)
        {
            var poi = await _context.PurchaseOrderItems.FindAsync(itemId);
            if (poi == null) return new List<ProductLot>();

            var query = from sd in _context.StockDocuments
                        join st in _context.StockTransactions on sd.Id equals st.DocumentId
                        join pl in _context.ProductLots on st.LotId equals pl.Id
                        where sd.ReferenceId == poi.PurchaseOrderId
                           && sd.ReferenceType == "PurchaseOrder"
                           && st.ProductId == poi.ProductId
                        select pl;

            return await query.Distinct().ToListAsync();
        }

        public async Task DeleteAsync(PurchaseOrderItem item)
        {
            _context.PurchaseOrderItems.Remove(item);
            await Task.CompletedTask;
        }
    }
}
