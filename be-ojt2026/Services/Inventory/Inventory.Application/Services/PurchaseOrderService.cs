using Inventory.Application.DTOs;
using Inventory.Application.DTOs.PurchaseOrder;
using Inventory.Application.IRepositories;
using Inventory.Application.IServices;
using Inventory.Domain.Entities;
using StackExchange.Redis;

namespace Inventory.Application.Services
{
    public class PurchaseOrderService : IPurchaseOrderService
    {
        private readonly IUnitOfWork _unitOfWork;

        public PurchaseOrderService(IUnitOfWork unitOfWork)
        {
            _unitOfWork = unitOfWork ?? throw new ArgumentNullException(nameof(unitOfWork));
        }

        public async Task<IEnumerable<PurchaseOrder>> GetAllAsync()
        {
            var orders = await _unitOfWork.PurchaseOrder.GetAllAsync();
            if (orders == null || !orders.Any())
                throw new Exception("No purchase orders found.");
            return orders;
        }

        public async Task<PurchaseOrder> GetByIdAsync(int id)
        {
            if (id <= 0) throw new ArgumentException("Id must be greater than zero.");
            var order = await _unitOfWork.PurchaseOrder.GetByIdAsync(id);
            if (order == null)
                throw new Exception($"PurchaseOrder with id {id} not found.");
            return order;
        }

        public async Task<List<PurchaseOrder>> GetBySupplierIdAsync(int supplierId)
        {
            if (supplierId <= 0) throw new ArgumentException("SupplierId must be greater than zero.");
            var orders = await _unitOfWork.PurchaseOrder.GetBySupplierIdAsync(supplierId);
            if (orders == null || orders.Count == 0)
                throw new Exception($"No purchase orders found for SupplierId {supplierId}.");
            return orders;
        }

        public async Task<List<PurchaseOrder>> GetByStatusAsync(string status)
        {
            if (string.IsNullOrWhiteSpace(status)) throw new ArgumentException("Status cannot be empty.");
            var orders = await _unitOfWork.PurchaseOrder.GetByStatusAsync(status);
            if (orders == null || orders.Count == 0)
                throw new Exception($"No purchase orders found with status {status}.");
            return orders;
        }

        public async Task<List<PurchaseOrder>> GetByCreatedAtAsync(DateTime createdAt)
        {
            var orders = await _unitOfWork.PurchaseOrder.GetByCreatedAtAsync(createdAt);
            if (orders == null || orders.Count == 0)
                throw new Exception($"No purchase orders found created at {createdAt}.");
            return orders;
        }

        public async Task<List<PurchaseOrder>> GetByConfirmedAtAsync(DateTime confirmedAt)
        {
            var orders = await _unitOfWork.PurchaseOrder.GetByConfirmedAtAsync(confirmedAt);
            if (orders == null || orders.Count == 0)
                throw new Exception($"No purchase orders found confirmed at {confirmedAt}.");
            return orders;
        }

        public async Task<List<PurchaseOrder>> GetByCompletedAtAsync(DateTime completedAt)
        {
            var orders = await _unitOfWork.PurchaseOrder.GetByCompletedAtAsync(completedAt);
            if (orders == null || orders.Count == 0)
                throw new Exception($"No purchase orders found completed at {completedAt}.");
            return orders;
        }

        public async Task AddAsync(CreatePurchaseOrderDto dto)
        {
            if (dto == null)
                throw new ArgumentNullException(nameof(dto));

            if (dto.SupplierId <= 0)
                throw new ArgumentException("SupplierId must be greater than zero.");

            if (dto.ProductId <= 0)
                throw new ArgumentException("ProductId must be greater than zero.");

            if (dto.OrderedQty <= 0)
                throw new ArgumentException("OrderedQty must be greater than zero.");

            if (dto.ReceivedQty < 0)
                throw new ArgumentException("ReceivedQty cannot be negative.");

            if (dto.ReceivedQty > dto.OrderedQty)
                throw new ArgumentException("ReceivedQty cannot be greater than OrderedQty.");

            if (dto.UnitPrice < 0)
                throw new ArgumentException("UnitPrice cannot be negative.");

            if (dto.UnitPrice > 0 && dto.OrderedQty > 0)
            {
                var subtotal = dto.UnitPrice * dto.OrderedQty;
                if (subtotal <= 0)
                    throw new ArgumentException("Subtotal must be greater than zero.");
            }

            await _unitOfWork.PurchaseOrder.AddAsync(dto);

            await _unitOfWork.SaveChangesAsync();
        }


        public async Task UpdateSupplierAsync(int id, int supplierId)
        {
            if (id <= 0) throw new ArgumentException("Id must be greater than zero.");
            if (supplierId <= 0) throw new ArgumentException("SupplierId must be greater than zero.");

            await _unitOfWork.PurchaseOrder.UpdateSupplierAsync(id, supplierId);
            await _unitOfWork.SaveChangesAsync();
        }

        public async Task UpdateStatusAsync(int id, string status)
        {
            if (id <= 0) throw new ArgumentException("Id must be greater than zero.");
            if (string.IsNullOrWhiteSpace(status)) throw new ArgumentException("Status cannot be empty.");

            await _unitOfWork.PurchaseOrder.UpdateStatusAsync(id, status);
            await _unitOfWork.SaveChangesAsync();
        }



        public async Task<PurchaseOrder> CreatePurchaseOrder(PurchaseOrder order)
        {
            if (order == null) throw new ArgumentNullException(nameof(order));
            if (order.SupplierId <= 0) throw new ArgumentException("Invalid SupplierId");

            await _unitOfWork.PurchaseOrder.CreatePurchaseOrder(order);
            await _unitOfWork.SaveChangesAsync();
            return order;
        }
        public async Task UpdatePurchaseOrder(PurchaseOrder po)
        {
            if (po == null) throw new ArgumentNullException(nameof(po));

            await _unitOfWork.PurchaseOrder.UpdatePurchaseOrder(po);
            await _unitOfWork.SaveChangesAsync();
        }

        public async Task<PagedResultDto<PurchaseOrderResponseDto>> SearchAsync(PurchaseOrderSearchDto searchDto)
        {
            if (searchDto == null) throw new ArgumentNullException(nameof(searchDto));

            var (items, totalCount) = await _unitOfWork.PurchaseOrder.SearchAsync(searchDto);

            var totalPages = (int)Math.Ceiling(totalCount / (double)searchDto.PageSize);

            return new PagedResultDto<PurchaseOrderResponseDto>
            {
                Items = items,
                Page = searchDto.Page,
                PageSize = searchDto.PageSize,
                TotalItems = totalCount,
                TotalPages = totalPages,
                HasNext = searchDto.Page < totalPages,
                HasPrevious = searchDto.Page > 1 && totalCount > 0
            };
        }

        public async Task<PurchaseOrderResponseDto?> GetDetailByIdAsync(int id)
        {
            if (id <= 0) throw new ArgumentException("Id must be greater than zero.");
            return await _unitOfWork.PurchaseOrder.GetDetailByIdAsync(id);
        }

        public async Task DeleteAsync(int id)
        {
            if (id <= 0) throw new ArgumentException("Id must be greater than zero.");
            var order = await _unitOfWork.PurchaseOrder.GetByIdAsync(id);
            if (order == null) throw new KeyNotFoundException($"PurchaseOrder {id} not found.");

            await _unitOfWork.PurchaseOrder.DeleteAsync(order);
            await _unitOfWork.SaveChangesAsync();
        }
    }
}

