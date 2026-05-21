using BuildingBlocks.Exceptions;
using Inventory.Application.DTOs;
using Inventory.Application.DTOs.Common;
using Inventory.Application.DTOs.Customer;
using Inventory.Application.IRepositories;
using Inventory.Application.IServices;
using Inventory.Domain.Entities;

namespace Inventory.Application.Services;

public class CustomerService : ICustomerService
{
    private readonly IUnitOfWork _unitOfWork;

    public CustomerService(IUnitOfWork unitOfWork)
    {
        _unitOfWork = unitOfWork;
    }

    public async Task<CustomerDto> CreateCustomerAsync(CreateCustomerRequest request)
    {
        //check if customer phone already exists
        var existingCustomerByPhone = await _unitOfWork.Customer.CustomerPhoneExistAsync(request.phone);
        if (existingCustomerByPhone != null)
            throw new InvalidOperationException($"Số điện thoại {request.phone} đã tồn tại trong hệ thống");

        //check if customer email already exists
        var existingCustomerByEmail = await _unitOfWork.Customer.CustomerEmailExistAsync(request.email);
        if (existingCustomerByEmail != null)
            throw new InvalidOperationException($"Email {request.email} đã tồn tại trong hệ thống");


        var customer = new Customer 
        {
            CustomerName = request.customerName,
            Phone = request.phone,
            Email = request.email,
            Address = request.address,
            IsActive = true,
            CreatedAt = DateTime.UtcNow,
            UpdatedAt = null
        };
        
        await _unitOfWork.Customer.CreateCustomerAsync(customer);
        await _unitOfWork.SaveChangesAsync();

        return new CustomerDto
        {
            Id = customer.Id,
            CustomerName = customer.CustomerName,
            Phone = customer.Phone,
            Email = customer.Email,
            Address = customer.Address,
            IsActive = customer.IsActive,
            CreatedAt = customer.CreatedAt,
            UpdatedAt = customer.UpdatedAt
        };
    }

    public async Task<bool> ReactivateCustomerAsync(int id)
    {
        var customer = await _unitOfWork.Customer.ReactivateCustomerAsync(id);
        if (customer == null)
            throw new KeyNotFoundException($"Không tìm thấy khách hàng với ID {id}");

        await _unitOfWork.SaveChangesAsync();
        return await Task.FromResult(true);
    }

    public async Task<bool> SoftDeleteCustomerAsync(int id)
    {
        var customer = await _unitOfWork.Customer.SoftDeleteCustomerAsync(id);
        if (customer == null)
            throw new KeyNotFoundException($"Không tìm thấy khách hàng với ID {id}");

        await _unitOfWork.SaveChangesAsync();
        return await Task.FromResult(true);
    }

    public async Task<CustomerDto> UpdateCustomerAsync(UpdateCustomerRequest request, int id)
    {
        var customer = await _unitOfWork.Customer.GetCustomerByIdAsync(id) ?? throw new KeyNotFoundException($"Không tìm thấy khách hàng với ID {id}");

        //check if new phone already exists
        var existingCustomerByPhone = await _unitOfWork.Customer.CustomerPhoneExistAsync(request.phone);
        if (existingCustomerByPhone != null && existingCustomerByPhone.Id != customer.Id)
            throw new InvalidOperationException($"Số điện thoại {request.phone} đã tồn tại trong hệ thống");
        //check if new email already exists
        var existingCustomerByEmail = await _unitOfWork.Customer.CustomerEmailExistAsync(request.email);
        if (existingCustomerByEmail != null && existingCustomerByEmail.Id != customer.Id)
            throw new InvalidOperationException($"Email {request.email} đã tồn tại trong hệ thống");

        customer.CustomerName = request.customerName;
        customer.Phone = request.phone;
        customer.Email = request.email;
        customer.Address = request.address;
        customer.UpdatedAt = DateTime.UtcNow;

        await _unitOfWork.Customer.UpdateCustomerAsync(customer);
        await _unitOfWork.SaveChangesAsync();

        return new CustomerDto
        {
            Id = customer.Id,
            CustomerName = customer.CustomerName,
            Phone = customer.Phone,
            Email = customer.Email,
            Address = customer.Address,
            IsActive = customer.IsActive,
            CreatedAt = customer.CreatedAt,
            UpdatedAt = customer.UpdatedAt
        };
    }

    public async Task<PagedResultDto<CustomerDto>> GetPaginatedAsync(int page, int pageSize, bool? isActive = null, string? search = null)
    {
        if (page < 1)
            throw new InvalidOperationException("Page must be greater than 0.");
        if (pageSize < 1 || pageSize > 100)
            throw new InvalidOperationException("PageSize must be between 1 and 100.");

        var (customers, totalCount) = await _unitOfWork.Customer.GetPaginatedAsync(page, pageSize, isActive, search);
        
        var data = customers.Select(customer => new CustomerDto
        {
            Id = customer.Id,
            CustomerName = customer.CustomerName,
            Phone = customer.Phone,
            Email = customer.Email,
            Address = customer.Address,
            IsActive = customer.IsActive,
            CreatedAt = customer.CreatedAt,
            UpdatedAt = customer.UpdatedAt
        }).ToList();

        var totalPages = totalCount == 0 ? 0 : (int)Math.Ceiling(totalCount / (double)pageSize);

        return new PagedResultDto<CustomerDto>
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

    public async Task<CustomerDto> GetCustomerByIdAsync(int id)
    {
        var customer = await _unitOfWork.Customer.GetCustomerByIdAsync(id);
        if (customer == null)
            throw new KeyNotFoundException($"Không tìm thấy khách hàng với id {id}");

        return new CustomerDto
        {
            Id = customer.Id,
            CustomerName = customer.CustomerName,
            Phone = customer.Phone,
            Email = customer.Email,
            Address = customer.Address,
            IsActive = customer.IsActive,
            CreatedAt = customer.CreatedAt,
            UpdatedAt = customer.UpdatedAt
        };
    }
}
