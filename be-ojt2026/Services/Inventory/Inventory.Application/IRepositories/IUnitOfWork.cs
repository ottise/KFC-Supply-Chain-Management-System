using Inventory.Application.IRepositories;

namespace Inventory.Application.IRepositories
{
    public interface IUnitOfWork
    {
        ICategoryRepository Category { get; }
        ICurrentInventoryRepository CurrentInventory { get; }
        ICustomerRepository Customer { get; }
        IInventoryAdjustmentRepository InventoryAdjustment { get; }
        IInventoryAdjustmentItemRepository InventoryAdjustmentItem { get; }
        ILocationRepository Location { get; }
        IProductRepository Product { get; }
        IProductWarehouseRepository ProductWarehouse { get; }
        IProductLotRepository ProductLot { get; }
        IPurchaseOrderRepository PurchaseOrder { get; }
        IPurchaseOrderItemRepository PurchaseOrderItem { get; }
        IScrapOrderRepository ScrapOrder { get; }
        IReorderingRuleRepository ReorderingRule { get; }
        ISaleOrderRepository SaleOrder { get; }
        ISaleOrderItemRepository SaleOrderItem { get; }
        IStockDocumentRepository StockDocument { get; }
        IStockTransactionRepository StockTransaction { get; }
        ISupplierRepository Supplier { get; }
        ITransferOrderRepository TransferOrder { get; }
        ITransferOrderItemRepository TransferOrderItem { get; }
        IUomRepository Uom { get; }
        IWarehouseRepository Warehouse { get; }

        Task BeginTransactionAsync(CancellationToken cancellationToken = default);

        Task CommitTransactionAsync(CancellationToken cancellationToken = default);

        Task RollbackTransactionAsync(CancellationToken cancellationToken = default);

        Task<int> SaveChangesAsync(CancellationToken cancellationToken = default);
    }
}
