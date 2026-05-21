using BuildingBlocks.Exceptions;
using Inventory.Application.DTOs.Dashboard;
using Inventory.Application.DTOs.DashBoard;
using Inventory.Application.IRepositories;
using Inventory.Application.IServices;
using Inventory.Domain.Common.Constants;
using Inventory.Domain.Entities;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using System.Security.Claims;

namespace Inventory.Application.Services
{
    public class DashBoardService : IDashBoardService
    {
        private readonly IUnitOfWork _unitOfWork;

        public DashBoardService(
            IUnitOfWork unitOfWork) 
        {
            _unitOfWork = unitOfWork;
        }

        public async Task<DashboardTrendResponseDto> GetInventoryTrendAsync(DateTime startDate, DateTime endDate, IEnumerable<int>? warehouseIds = null)
        {
            string typeReceipt = StockDocumentType.PurchaseOrder.ToString();
            string typeSale = StockDocumentType.SaleOrder.ToString();
            string typeScrap = "scrap_order";
            string typeTransfer = StockDocumentType.TransferOrder.ToString();
            string typeAdjustment = StockDocumentType.Adjustment.ToString(); // "Adjustment"

            // 1. Fetch COMPLETED documents via Repository for Trend
            var trendDocsRaw = await _unitOfWork.StockDocument.GetDashboardTrendDataAsync(startDate, endDate);

            var completedDocs = trendDocsRaw
                .Where(t => t.CompletedAt.HasValue &&
                           (t.Status == "Completed" || t.Status == "done" || t.Status == "Done"))
                .Select(t => new
                {
                    Type = t.DocumentType,
                    CompletedAt = t.CompletedAt!.Value,
                    ToWarehouseId = t.ToLocation != null ? (int?)t.ToLocation.WarehouseId : null,
                    FromWarehouseId = t.FromLocation != null ? (int?)t.FromLocation.WarehouseId : null
                }).ToList();

            // 2. Fetch PENDING & NO-DATE documents via Repository (where CompletedAt is NULL)
            var pendingRaw = await _unitOfWork.StockDocument.GetDashboardPendingDataAsync();

            var allNullDateDocs = pendingRaw.Select(t => new
            {
                Type = t.DocumentType,
                Status = t.Status,
                ToWarehouseId = t.ToLocation != null ? (int?)t.ToLocation.WarehouseId : null,
                FromWarehouseId = t.FromLocation != null ? (int?)t.FromLocation.WarehouseId : null
            }).ToList();

            // Filter in-memory by warehouse IDs if provided
            if (warehouseIds != null && warehouseIds.Any())
            {
                var idSet = warehouseIds.ToHashSet();
                completedDocs = completedDocs.Where(t =>
                    (t.ToWarehouseId.HasValue && idSet.Contains(t.ToWarehouseId.Value)) ||
                    (t.FromWarehouseId.HasValue && idSet.Contains(t.FromWarehouseId.Value))).ToList();

                allNullDateDocs = allNullDateDocs.Where(t =>
                    (t.ToWarehouseId.HasValue && idSet.Contains(t.ToWarehouseId.Value)) ||
                    (t.FromWarehouseId.HasValue && idSet.Contains(t.FromWarehouseId.Value))).ToList();
            }

            // --- Categorization ---
            var pendingDocsData = allNullDateDocs.ToList();
            var noDateDocsData = allNullDateDocs.Where(t =>
                !string.IsNullOrEmpty(t.Status) &&
                (t.Status.Trim().Equals("Confirmed", StringComparison.OrdinalIgnoreCase) ||
                 t.Status.Trim().Equals("done", StringComparison.OrdinalIgnoreCase))).ToList();

            // Generate daily trend
            var dateRange = Enumerable.Range(0, (int)(endDate.Date - startDate.Date).TotalDays + 1)
                .Select(d => startDate.Date.AddDays(d))
                .ToList();

            var trend = dateRange.Select(date =>
            {
                var onDate = completedDocs.Where(t => t.CompletedAt.Date == date).ToList();

                var receiptCount = onDate.Count(t => !string.IsNullOrEmpty(t.Type) && t.Type.Trim().Equals(typeReceipt, StringComparison.OrdinalIgnoreCase));
                var saleOrderCount = onDate.Count(t => !string.IsNullOrEmpty(t.Type) && t.Type.Trim().Equals(typeSale, StringComparison.OrdinalIgnoreCase));
                var scrapOrderCount = onDate.Count(t => !string.IsNullOrEmpty(t.Type) && t.Type.Trim().Equals(typeScrap, StringComparison.OrdinalIgnoreCase));
                var transferOrderCount = onDate.Count(t => !string.IsNullOrEmpty(t.Type) && t.Type.Trim().Equals(typeTransfer, StringComparison.OrdinalIgnoreCase));
                var adjustmentCount = onDate.Count(t => !string.IsNullOrEmpty(t.Type) && t.Type.Trim().Equals(typeAdjustment, StringComparison.OrdinalIgnoreCase));

                var dow = date.DayOfWeek;
                var dayOfWeekVi = dow == DayOfWeek.Sunday ? "CN" : "T" + ((int)dow + 1);

                return new InventoryTrendItemDto
                {
                    Date = date.ToString("yyyy-MM-dd"),
                    DayOfWeek = dayOfWeekVi,
                    ReceiptCount = receiptCount,
                    SaleOrderCount = saleOrderCount,
                    ScrapOrderCount = scrapOrderCount,
                    TransferOrderCount = transferOrderCount,
                    AdjustmentCount = adjustmentCount,
                    TotalInbound = receiptCount,
                    TotalOutbound = saleOrderCount + scrapOrderCount + transferOrderCount // Not including adjustment as per user request
                };
            }).ToList();

            // Generate Pending Summary
            var pendingSummary = new PendingSummaryDto
            {
                Receipt = pendingDocsData.Count(t => !string.IsNullOrEmpty(t.Type) && t.Type.Trim().Equals(typeReceipt, StringComparison.OrdinalIgnoreCase)),
                SaleOrder = pendingDocsData.Count(t => !string.IsNullOrEmpty(t.Type) && t.Type.Trim().Equals(typeSale, StringComparison.OrdinalIgnoreCase)),
                ScrapOrder = pendingDocsData.Count(t => !string.IsNullOrEmpty(t.Type) && t.Type.Trim().Equals(typeScrap, StringComparison.OrdinalIgnoreCase)),
                TransferOrder = pendingDocsData.Count(t => !string.IsNullOrEmpty(t.Type) && t.Type.Trim().Equals(typeTransfer, StringComparison.OrdinalIgnoreCase)),
                Adjustment = pendingDocsData.Count(t => !string.IsNullOrEmpty(t.Type) && t.Type.Trim().Equals(typeAdjustment, StringComparison.OrdinalIgnoreCase))
            };

            // Generate NoDate Summary
            var noDateSummary = new NoDateSummaryDto
            {
                Receipt = noDateDocsData.Count(t => !string.IsNullOrEmpty(t.Type) && t.Type.Trim().Equals(typeReceipt, StringComparison.OrdinalIgnoreCase)),
                SaleOrder = noDateDocsData.Count(t => !string.IsNullOrEmpty(t.Type) && t.Type.Trim().Equals(typeSale, StringComparison.OrdinalIgnoreCase)),
                ScrapOrder = noDateDocsData.Count(t => !string.IsNullOrEmpty(t.Type) && t.Type.Trim().Equals(typeScrap, StringComparison.OrdinalIgnoreCase)),
                TransferOrder = noDateDocsData.Count(t => !string.IsNullOrEmpty(t.Type) && t.Type.Trim().Equals(typeTransfer, StringComparison.OrdinalIgnoreCase)),
                Adjustment = noDateDocsData.Count(t => !string.IsNullOrEmpty(t.Type) && t.Type.Trim().Equals(typeAdjustment, StringComparison.OrdinalIgnoreCase))
            };

            return new DashboardTrendResponseDto
            {
                Trend = trend,
                Pending = pendingSummary,
                NoDate = noDateSummary
            };
        }

        public async Task<List<ParentCategoryGroupDto>> GetProductCountByParentCategoryAsync()
        {
            var parentCategory = await _unitOfWork.Category.GetParentCategoriesAsync();
            var result = new List<ParentCategoryGroupDto>();

            foreach (var parent in parentCategory)
            {
                var subCategoryCount = await _unitOfWork.Category.GetProductCountByParentIdAsync(parent.Id);

                var totalProductCount = subCategoryCount.Sum(sc => sc.ProductCount);

                result.Add(new ParentCategoryGroupDto
                {
                    ParentCategoryId = parent.Id,
                    ParentCategoryName = parent.Name,
                    SubCategories = subCategoryCount,
                    TotalProductCount = totalProductCount
                });
            }
            
            return result;
        }

        public async Task<List<WarehouseInventoryDto>> GetWarehouseInventoryAsync(int? warehouseId = null)
        {
            // Get all active warehouses with their locations
            var warehouses = await _unitOfWork.Warehouse.GetAllAsync();
            var activeWarehouses = warehouses.Where(w => w.IsActive == true).ToList();

            // Filter by warehouseId if provided
            if (warehouseId.HasValue)
            {
                activeWarehouses = activeWarehouses.Where(w => w.Id == warehouseId.Value).ToList();
                
                if (!activeWarehouses.Any())
                {
                    throw new NotFoundException($"Warehouse with ID {warehouseId.Value} not found");
                }
            }

            // Get all locations for active warehouses
            var warehouseIds = activeWarehouses.Select(w => w.Id).ToList();
            var allLocations = new List<Location>();

            foreach (var warehouse in warehouseIds)
            {
                var locations = await _unitOfWork.Location.GetLocationByWarehouseIdAsync(warehouse);
                allLocations.AddRange(locations.Where(l => l.IsActive == true));
            }

            // Get all inventories for all locations
            var locationIds = allLocations.Select(l => l.Id).ToList();
            var allInventories = await _unitOfWork.CurrentInventory.GetCurrentInventoriesByLocationIdsAsync(locationIds);
            var activeInventories = allInventories.Where(i => i.Product?.IsActive == true).ToList();

            // Get all product types
            var allProductTypes = await _unitOfWork.CurrentInventory.GetDistinctProductTypesAsync();

            var result = new List<WarehouseInventoryDto>();

            foreach (var warehouse in activeWarehouses)
            {
                var warehouseLocations = allLocations.Where(l => l.WarehouseId == warehouse.Id).ToList();

                // Calculate product type totals for this warehouse
                var warehouseProductTypeGroups = activeInventories
                    .Where(i => warehouseLocations.Any(l => l.Id == i.LocationId))
                    .Where(i => !string.IsNullOrWhiteSpace(i.Product?.ProductType))
                    .GroupBy(i => i.Product!.ProductType!, StringComparer.OrdinalIgnoreCase)
                    .ToDictionary(g => g.Key, g => g.Sum(i => (int)(i.Quantity ?? 0)), StringComparer.OrdinalIgnoreCase);

                var warehouseTotalCount = warehouseProductTypeGroups.Values.Sum();

                //calc %
                var productTypeBreakdown = allProductTypes.Select(productType =>
                {
                    var count = warehouseProductTypeGroups.TryGetValue(productType, out var c) ? c : 0;
                    var percentage = warehouseTotalCount > 0 ? Math.Round((double)count / warehouseTotalCount * 100, 1) : 0.00;

                    return new ProductTypePercentageDto
                    {
                        ProductType = productType,
                        Count = count,
                        Percentage = percentage
                    };
                }).ToList();

                result.Add(new WarehouseInventoryDto
                {
                    WarehouseId = warehouse.Id,
                    WarehouseName = warehouse.Name,
                    TotalCount = warehouseTotalCount,
                    ProductTypeBreakdown = productTypeBreakdown
                });
            }

            return result;
        }

        public async Task<ManagerInventoryDashboardDto> GetManagerWarehouseInventoryAsync(int managerId, int? warehouseId = null)
        {
            // Get all active warehouses for this manager
            var warehouses = await _unitOfWork.Warehouse.GetAllAsync();
            var query = warehouses.Where(w => w.IsActive == true && w.ManagerId == managerId);

            if (warehouseId.HasValue)
            {
                query = query.Where(w => w.Id == warehouseId.Value);
            }

            var activeWarehouses = query.ToList();
            
            if (!activeWarehouses.Any())
            {
                if (warehouseId.HasValue)
                {
                    throw new NotFoundException($"Không tìm thấy kho có ID {warehouseId.Value} được quản lý bởi người dùng này.");
                }
                throw new NotFoundException("Không tìm thấy kho nào được quản lý bởi người dùng này");
            }

            var warehouseList = new List<WarehouseInventoryDto>();

            foreach (var warehouse in activeWarehouses)
            {
                var warehouseDto = await ProcessWarehouseToDtoAsync(warehouse);
                warehouseList.Add(warehouseDto);
            }

            // Aggregate results for the summary
            var allProductTypes = await _unitOfWork.CurrentInventory.GetDistinctProductTypesAsync();
            var grandTotalCount = warehouseList.Sum(w => (long)w.TotalCount);
            
            var summaryBreakdown = allProductTypes.Select(productType =>
            {
                long totalCount = warehouseList.Sum(w => (long)(w.ProductTypeBreakdown.FirstOrDefault(pt => string.Equals(pt.ProductType, productType, StringComparison.OrdinalIgnoreCase))?.Count ?? 0));
                double percentage = grandTotalCount > 0 ? Math.Round((double)totalCount / grandTotalCount * 100, 2) : 0.00;

                return new SummaryBreakdownDto
                {
                    ProductType = productType,
                    TotalCount = totalCount,
                    Percentage = percentage
                };
            }).OrderByDescending(s => s.TotalCount).ToList();

            return new ManagerInventoryDashboardDto
            {
                Summary = new InventorySummaryDto
                {
                    GrandTotalCount = grandTotalCount,
                    TotalWarehouses = activeWarehouses.Count,
                    SummaryBreakdown = summaryBreakdown
                },
                Warehouses = warehouseList
            };
        }

        private async Task<WarehouseInventoryDto> ProcessWarehouseToDtoAsync(Warehouse warehouse)
        {
            // Get all locations for this specific warehouse
            var locations = await _unitOfWork.Location.GetLocationByWarehouseIdAsync(warehouse.Id);
            var activeLocations = locations.Where(l => l.IsActive == true).ToList();

            // Get all inventories for these locations
            var locationIds = activeLocations.Select(l => l.Id).ToList();
            var allInventories = await _unitOfWork.CurrentInventory.GetCurrentInventoriesByLocationIdsAsync(locationIds);
            var activeInventories = allInventories.Where(i => i.Product?.IsActive == true).ToList();

            // Get all product types
            var allProductTypes = await _unitOfWork.CurrentInventory.GetDistinctProductTypesAsync();

            // Calculate product type totals for this warehouse
            var warehouseProductTypeGroups = activeInventories
                .Where(i => !string.IsNullOrWhiteSpace(i.Product?.ProductType))
                .GroupBy(i => i.Product!.ProductType!, StringComparer.OrdinalIgnoreCase)
                .ToDictionary(g => g.Key, g => g.Sum(i => (long)(i.Quantity ?? 0)), StringComparer.OrdinalIgnoreCase);

            var warehouseTotalCount = warehouseProductTypeGroups.Values.Sum();

            // Calculate percentages
            var productTypeBreakdown = allProductTypes.Select(productType =>
            {
                var count = warehouseProductTypeGroups.TryGetValue(productType, out var c) ? c : 0;
                var percentage = warehouseTotalCount > 0 ? Math.Round((double)count / warehouseTotalCount * 100, 1) : 0.00;

                return new ProductTypePercentageDto
                {
                    ProductType = productType,
                    Count = count,
                    Percentage = percentage
                };
            }).ToList();

            return new WarehouseInventoryDto
            {
                WarehouseId = warehouse.Id,
                WarehouseName = warehouse.Name,
                TotalCount = warehouseTotalCount,
                ProductTypeBreakdown = productTypeBreakdown
            };
        }
    }
}
