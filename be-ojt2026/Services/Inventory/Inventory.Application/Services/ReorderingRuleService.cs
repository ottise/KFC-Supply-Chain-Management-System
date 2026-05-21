using Inventory.Application.DTOs;
using Inventory.Application.DTOs.ReorderingRule;
using Inventory.Application.IRepositories;
using Inventory.Application.IServices;
using Inventory.Domain.Common.Constants;
using Inventory.Domain.Entities;

namespace Inventory.Application.Services
{
    public class ReorderingRuleService : IReorderingRuleService
    {
        private readonly IUnitOfWork _unitOfWork;

        public ReorderingRuleService(IUnitOfWork unitOfWork) 
        {
            _unitOfWork = unitOfWork;
        }
        public async Task<ReOrderingRuleDto> CreateReOrderingRuleAsync(CreateReorderingRuleRequest request, int? managerId = null, int? userId = null)
        {
            // Validate product warehouse exists
            var productWarehouse = await _unitOfWork.ProductWarehouse.GetByIdAsync(request.ProductWarehouseId);
            if (productWarehouse == null)
            {
                throw new KeyNotFoundException($"Không tìm thấy sản phẩm trong kho với ID {request.ProductWarehouseId}");
            }

            if (productWarehouse.Warehouse.ManagerId != managerId && productWarehouse.Warehouse.ManagerId != userId)
                throw new UnauthorizedAccessException("Bạn không có quyền thao tác trên kho này.");

             // Check if rule already exists for this product warehouse
             var existingRule = await _unitOfWork.ReorderingRule.CheckExistingReorderRuleAsync(request.ProductWarehouseId);
             if (existingRule != null) 
             {
                throw new InvalidOperationException($"Quy tắc đặt hàng đã tồn tại cho sản phẩm kho ID {request.ProductWarehouseId}");
             }


            // Validate trigger type
            if (!string.IsNullOrEmpty(request.TriggerType))
            {
                var validTriggerTypes = Enum.GetNames(typeof(ReorderingRuleTrigger));
                var triggerTypeValues = validTriggerTypes.Select(name => 
                {
                    var enumValue = (ReorderingRuleTrigger)Enum.Parse(typeof(ReorderingRuleTrigger), name);
                    return enumValue.ToString();
                }).ToList();

                if (!triggerTypeValues.Contains(request.TriggerType))
                {
                    throw new InvalidOperationException($"Loại kích hoạt không hợp lệ. Các loại hợp lệ là: {string.Join(", ", triggerTypeValues)}");
                }
            }

            // Validate quantities
            if (request.MinQty.HasValue && request.MinQty.Value <= 0)
            {
                throw new InvalidOperationException("Số lượng tối thiểu phải lớn hơn 0");
            }
            if (request.MaxQty.HasValue && request.MinQty.HasValue && request.MaxQty.Value <= request.MinQty.Value)
            {
                throw new InvalidOperationException("Số lượng tối đa phải lớn hơn số lượng tối thiểu");
            }

            // Create new reordering rule
            var reorderingRule = new ReorderingRule
            {
                ProductWarehouseId = request.ProductWarehouseId,
                MinQty = request.MinQty,
                MaxQty = request.MaxQty,
                TriggerType = request.TriggerType ?? ReorderingRuleTrigger.Manual.ToString(),
                IsActive =  true,
                CreatedAt = DateTime.UtcNow
            };

            var createdRule = await _unitOfWork.ReorderingRule.CreateReOrderingRuleAsync(reorderingRule);
            await _unitOfWork.SaveChangesAsync();

            return new ReOrderingRuleDto
            {
                Id = createdRule.Id,
                ProductWarehouseId = createdRule.ProductWarehouseId,
                MinQty = createdRule.MinQty,
                MaxQty = createdRule.MaxQty,
                TriggerType = createdRule.TriggerType,
                IsActive = createdRule.IsActive,
                CreatedAt = createdRule.CreatedAt
            };
        }

        public async Task<bool> DeleteReOrderingRuleAsync(int productWarehouseId, int? managerId = null, int? userId = null)
        {
            var productWarehouse = await _unitOfWork.ProductWarehouse.GetByIdAsync(productWarehouseId);
            if (productWarehouse != null && productWarehouse.Warehouse.ManagerId != managerId && productWarehouse.Warehouse.ManagerId != userId)
                throw new UnauthorizedAccessException("Bạn không có quyền thao tác trên kho này.");

            var reorderRule = await _unitOfWork.ReorderingRule.DeleteReorderingRuleAsync(productWarehouseId);
            if (reorderRule == null)
            {
                throw new KeyNotFoundException("Không tìm thấy quy tắc đặt hàng này");
            }
            await _unitOfWork.SaveChangesAsync();
            return true;
        }

        public async Task<PagedResultDto<ReOrderingRuleDto>> GetPaginatedAsync(int page, int pageSize, bool? isActive = null, string? search = null, int? productWarehouseId = null, int? managerId = null, int? warehouseId = null)
        {
            if (page < 1)
                throw new InvalidOperationException("Trang phải lớn hơn 0.");
            if (pageSize < 1 || pageSize > 100)
                throw new InvalidOperationException("Kích thước trang phải từ 1 đến 100.");

            var (reorderingRules, totalCount) = await _unitOfWork.ReorderingRule.GetPaginatedAsync(page, pageSize, isActive, search, productWarehouseId, managerId, warehouseId);
            
            var data = reorderingRules.Select(rule => new ReOrderingRuleDto
            {
                Id = rule.Id,
                ProductWarehouseId = rule.ProductWarehouseId,
                MinQty = rule.MinQty,
                MaxQty = rule.MaxQty,
                TriggerType = rule.TriggerType,
                IsActive = rule.IsActive,
                CreatedAt = rule.CreatedAt
            }).ToList();

            var totalPages = totalCount == 0 ? 0 : (int)Math.Ceiling(totalCount / (double)pageSize);

            return new PagedResultDto<ReOrderingRuleDto>
            {
                Items = data,
                Page = page,
                PageSize = pageSize,
                TotalItems = totalCount,
                TotalPages = totalPages,
                HasNext = page < totalPages,
                HasPrevious = page > 1 && totalCount > 0
            };
        }



        public async Task<bool> ChangeStatusAsync(int productWarehouseId, bool isActive, int? managerId = null, int? userId = null)
        {
            var productWarehouse = await _unitOfWork.ProductWarehouse.GetByIdAsync(productWarehouseId);
            if (productWarehouse != null && productWarehouse.Warehouse.ManagerId != managerId && productWarehouse.Warehouse.ManagerId != userId)
                throw new UnauthorizedAccessException("Bạn không có quyền thao tác trên kho này.");

            var reorderRule = await _unitOfWork.ReorderingRule.ChangeStatusAsync(productWarehouseId, isActive);
            if (reorderRule == null)
            {
                throw new KeyNotFoundException("Không tìm thấy quy tắc đặt hàng này");
            }
            await _unitOfWork.SaveChangesAsync();
            return true;
        }

        public async Task<ReOrderingRuleDto> UpdaReOrOrderingRuleAsync(UpdateReorderingRuleRequest request, int productWarehouseId, int? managerId = null, int? userId = null)
        {
            var productWarehouse = await _unitOfWork.ProductWarehouse.GetByIdAsync(productWarehouseId);
            if (productWarehouse != null && productWarehouse.Warehouse.ManagerId != managerId && productWarehouse.Warehouse.ManagerId != userId)
                throw new UnauthorizedAccessException("Bạn không có quyền thao tác trên kho này.");

            var reorderRule = await _unitOfWork.ReorderingRule.GetActiveReorderingRuleAsync(productWarehouseId);
            if (reorderRule == null)
            {
                throw new KeyNotFoundException("Quy tắc đặt hàng này không tồn tại.");
            }

            // Validate trigger type
            if (!string.IsNullOrEmpty(request.TriggerType))
            {
                var validTriggerTypes = Enum.GetNames(typeof(ReorderingRuleTrigger));
                var triggerTypeValues = validTriggerTypes.Select(name =>
                {
                    var enumValue = (ReorderingRuleTrigger)Enum.Parse(typeof(ReorderingRuleTrigger), name);
                    return enumValue.ToString();
                }).ToList();

                if (!triggerTypeValues.Contains(request.TriggerType))
                {
                    throw new InvalidOperationException($"Loại kích hoạt không hợp lệ. Các loại hợp lệ là: {string.Join(", ", triggerTypeValues)}");
                }
            }

            // Validate quantities
            if (request.MinQty.HasValue && request.MinQty.Value <= 0)
            {
                throw new InvalidOperationException("Số lượng tối thiểu phải lớn hơn 0");
            }
            if (request.MaxQty.HasValue && request.MinQty.HasValue && request.MaxQty.Value <= request.MinQty.Value)
            {
                throw new InvalidOperationException("Số lượng tối đa phải lớn hơn số lượng tối thiểu");
            }

            reorderRule.MinQty = request.MinQty;
            reorderRule.MaxQty = request.MaxQty;
            reorderRule.TriggerType = request.TriggerType;

            await _unitOfWork.ReorderingRule.UpdateReOrderingRuleAsync(reorderRule);
            await _unitOfWork.SaveChangesAsync();

            return new ReOrderingRuleDto
            {
                Id = reorderRule.Id,
                ProductWarehouseId = reorderRule.ProductWarehouseId,
                MinQty = reorderRule.MinQty,
                MaxQty = reorderRule.MaxQty,
                TriggerType = reorderRule.TriggerType,
                IsActive = reorderRule.IsActive,
                CreatedAt = reorderRule.CreatedAt
            };
        }

        public async Task<PagedResultDto<ReorderingRuleWarningDto>> GetWarningsAsync(int page, int pageSize, int? managerId = null, int? warehouseId = null)
        {
            if (page < 1)
                throw new InvalidOperationException("Trang phải lớn hơn 0.");
            if (pageSize < 1 || pageSize > 100)
                throw new InvalidOperationException("Kích thước trang phải từ 1 đến 100.");

            var (warnings, totalCount) = await _unitOfWork.ReorderingRule.GetRulesBelowMinQtyAsync(page, pageSize, managerId, warehouseId);

            var data = warnings.Select(w => new ReorderingRuleWarningDto
            {
                RuleId = w.Rule.Id,
                ProductWarehouseId = w.Rule.ProductWarehouseId ?? 0,
                ProductId = w.Rule.ProductWarehouse.ProductId,
                ProductName = w.Rule.ProductWarehouse.Product.Name,
                WarehouseId = w.Rule.ProductWarehouse.WarehouseId,
                WarehouseName = w.Rule.ProductWarehouse.Warehouse.Name,
                MinQty = w.Rule.MinQty!.Value,
                MaxQty = w.Rule.MaxQty,
                CurrentAvailableQty = w.AvailableQty,
                Message = "Tồn kho thực tế đang dưới mức an toàn (MinQty)",
                BaseUomName = w.Rule.ProductWarehouse.Product.BaseUom.Name
            }).ToList();

            var totalPages = totalCount == 0 ? 0 : (int)Math.Ceiling(totalCount / (double)pageSize);

            return new PagedResultDto<ReorderingRuleWarningDto>
            {
                Items = data,
                Page = page,
                PageSize = pageSize,
                TotalItems = totalCount,
                TotalPages = totalPages,
                HasNext = page < totalPages,
                HasPrevious = page > 1 && totalCount > 0
            };
        }
    }
}
