namespace Inventory.Presentation.Extensions;

using Inventory.Application.IRepositories;
using Inventory.Application.IServices;
using Inventory.Application.Services;
using Inventory.Infrastructure.Repositories;
using Microsoft.Extensions.DependencyInjection;

public static class DependencyInjectionExtensions
{
    public static IServiceCollection AddApplicationServices(this IServiceCollection services)
    {
        // repo
        services.AddScoped<ICategoryRepository, CategoryRepository>();
        services.AddScoped<ICurrentInventoryRepository, CurrentInventoryRepository>();
        services.AddScoped<ICustomerRepository, CustomerRepository>();
        services.AddScoped<IInventoryAdjustmentRepository, InventoryAdjustmentRepository>();
        services.AddScoped<IInventoryAdjustmentItemRepository, InventoryAdjustmentItemRepository>();
        services.AddScoped<ILocationRepository, LocationRepository>();
        services.AddScoped<IProductRepository, ProductRepository>();
        services.AddScoped<IProductWarehouseRepository, ProductWarehouseRepository>();
        services.AddScoped<IProductLotRepository, ProductLotRepository>();
        services.AddScoped<IPurchaseOrderRepository, PurchaseOrderRepository>();
        services.AddScoped<IPurchaseOrderItemRepository, PurchaseOrderItemRepository>();
        services.AddScoped<IScrapOrderRepository, ScrapOrderRepository>();
        services.AddScoped<IReorderingRuleRepository, ReorderingRuleRepository>();
        services.AddScoped<ISaleOrderRepository, SaleOrderRepository>();
        services.AddScoped<ISaleOrderItemRepository, SaleOrderItemRepository>();
        services.AddScoped<IStockDocumentRepository, StockDocumentRepository>();
        services.AddScoped<IStockTransactionRepository, StockTransactionRepository>();
        services.AddScoped<ISupplierRepository, SupplierRepository>();
        services.AddScoped<ITransferOrderRepository, TransferOrderRepository>();
        services.AddScoped<ITransferOrderItemRepository, TransferOrderItemRepository>();
        services.AddScoped<IUomRepository, UomRepository>();
        services.AddScoped<IWarehouseRepository, WarehouseRepository>();


        // service
        services.AddScoped<ICategoryService, CategoryService>();
        services.AddScoped<ICurrentInventoryService, CurrentInventoryService>();
        services.AddScoped<ICustomerService, CustomerService>();
        services.AddScoped<IInventoryAdjustmentService, InventoryAdjustmentService>();
        services.AddScoped<IInventoryAdjustmentItemService, InventoryAdjustmentItemService>();
        services.AddScoped<ILocationService, LocationService>();
        services.AddScoped<IProductService, ProductService>();
        services.AddScoped<IProductWarehouseService, ProductWarehouseService>();
        services.AddScoped<IProductLotService, ProductLotService>();
        services.AddScoped<IPurchaseOrderService, PurchaseOrderService>();
        services.AddScoped<IPurchaseOrderItemService, PurchaseOrderItemService>();
        services.AddScoped<IScrapOrderService, ScrapOrderService>();
        services.AddScoped<IReorderingRuleService, ReorderingRuleService>();
        services.AddScoped<ISaleOrderService, SaleOrderService>();
        services.AddScoped<ISaleOrderItemService, SaleOrderItemService>();
        services.AddScoped<IStockDocumentService, StockDocumentService>();
        services.AddScoped<IStockTransactionService, StockTransactionService>();
        services.AddScoped<ISupplierService, SupplierService>();
        services.AddScoped<ITransferOrderService, TransferOrderService>();
        services.AddScoped<ITransferOrderItemService, TransferOrderItemService>();
        services.AddScoped<IUomService, UomService>();
        services.AddScoped<IWarehouseService, WarehouseService>();
        services.AddScoped<IInventoryVoucherService, InventoryVoucherService>();
        services.AddScoped<IPurchaseOrderOrchestrate, PurchaseOrderOrchestrate>();
        services.AddScoped<IDashBoardService, DashBoardService>();

        //unit of work
        services.AddScoped<IUnitOfWork, UnitOfWork>();

        return services;
    }
}