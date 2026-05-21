
using Microsoft.EntityFrameworkCore;
using Inventory.Application.IRepositories;
using Inventory.Domain.Entities;
using Inventory.Infrastructure.Data;
using Microsoft.EntityFrameworkCore.Storage;

namespace Inventory.Infrastructure.Repositories
{
    public class UnitOfWork : IUnitOfWork
    {


        private readonly InventoryDbContext _context;
        private IDbContextTransaction _currentTransaction;
        private bool _disposed = false;

        public ICategoryRepository Category { get; }
        public ICurrentInventoryRepository CurrentInventory { get; }
        public ICustomerRepository Customer { get; }
        public IInventoryAdjustmentRepository InventoryAdjustment { get; }
        public IInventoryAdjustmentItemRepository InventoryAdjustmentItem { get; }
        public ILocationRepository Location { get; }
        public IProductRepository Product { get; }
        public IProductWarehouseRepository ProductWarehouse { get; }
        public IProductLotRepository ProductLot { get; }
        public IPurchaseOrderRepository PurchaseOrder { get; }
        public IPurchaseOrderItemRepository PurchaseOrderItem { get; }
        public IScrapOrderRepository ScrapOrder { get; }
        public IReorderingRuleRepository ReorderingRule { get; }
        public ISaleOrderRepository SaleOrder { get; }
        public ISaleOrderItemRepository SaleOrderItem { get; }
        public IStockDocumentRepository StockDocument { get; }
        public IStockTransactionRepository StockTransaction { get; }
        public ISupplierRepository Supplier { get; }
        public ITransferOrderRepository TransferOrder { get; }
        public ITransferOrderItemRepository TransferOrderItem { get; }
        public IUomRepository Uom { get; }
        public IWarehouseRepository Warehouse { get; }


        public UnitOfWork(
            InventoryDbContext context,
            ICategoryRepository category,
            ICurrentInventoryRepository currentInventory,
            ICustomerRepository customer,
            IInventoryAdjustmentRepository inventoryAdjustment,
            IInventoryAdjustmentItemRepository inventoryAdjustmentItem,
            ILocationRepository location,
            IProductRepository product,
            IProductWarehouseRepository productWarehouse,
            IProductLotRepository productLot,
            IPurchaseOrderRepository purchaseOrder,
            IPurchaseOrderItemRepository purchaseOrderItem,
            IScrapOrderRepository scrapOrder,
            IReorderingRuleRepository reorderingRule,
            ISaleOrderRepository saleOrder,
            ISaleOrderItemRepository saleOrderItem,
            IStockDocumentRepository stockDocument,
            IStockTransactionRepository stockTransaction,
            ISupplierRepository supplier,
            ITransferOrderRepository transferOrder,
            ITransferOrderItemRepository transferOrderItem,
            IUomRepository uom,
            IWarehouseRepository warehouse)
        {
            _context = context;
            Category = category;
            CurrentInventory = currentInventory;
            Customer = customer;
            InventoryAdjustment = inventoryAdjustment;
            InventoryAdjustmentItem = inventoryAdjustmentItem;
            Location = location;
            Product = product;
            ProductWarehouse = productWarehouse;
            ProductLot = productLot;
            PurchaseOrder = purchaseOrder;
            PurchaseOrderItem = purchaseOrderItem;
            ScrapOrder = scrapOrder;
            ReorderingRule = reorderingRule;
            SaleOrder = saleOrder;
            SaleOrderItem = saleOrderItem;
            StockDocument = stockDocument;
            StockTransaction = stockTransaction;
            Supplier = supplier;
            TransferOrder = transferOrder;
            TransferOrderItem = transferOrderItem;
            Uom = uom;
            Warehouse = warehouse;
        }

        public async Task BeginTransactionAsync(CancellationToken cancellationToken = default)
        {
            if (_currentTransaction != null)
            {
                throw new InvalidOperationException("A transaction is already in progress.");
            }
            _currentTransaction = await _context.Database.BeginTransactionAsync(cancellationToken);
        }

        public async Task CommitTransactionAsync(CancellationToken cancellationToken = default)
        {
            try
            {

                await _context.SaveChangesAsync(cancellationToken);
                await _currentTransaction.CommitAsync(cancellationToken);
            }
            catch
            {
                await RollbackTransactionAsync(cancellationToken);
                throw;

            }
            finally
            {
                if (_currentTransaction != null)
                {
                    await _currentTransaction.DisposeAsync();
                    _currentTransaction = null;
                }
            }
        }

        public async Task RollbackTransactionAsync(CancellationToken cancellationToken = default)
        {
            if (_currentTransaction == null)
            {
                return;
            }
            try
            {
                await _currentTransaction.RollbackAsync(cancellationToken);
            }
            finally
            {
                if (_currentTransaction != null)
                {
                    await _currentTransaction.DisposeAsync();
                    _currentTransaction = null;
                }
            }
        }
        public async Task<int> SaveChangesAsync(CancellationToken cancellationToken = default)
        {
            return await _context.SaveChangesAsync(cancellationToken);
        }

        protected virtual void Dispose(bool disposing)
        {
            Dispose(true);
            GC.SuppressFinalize(this);
        }


    }
}
