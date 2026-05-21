namespace Inventory.Application.DTOs.Customer;

public class CustomerDto
{
    public int Id { get; set; }
    public string CustomerName { get; set; } = null!;
    public string? Phone { get; set; }
    public string? Email { get; set; }
    public string? Address { get; set; }
    public bool? IsActive { get; set; }
    public DateTime? CreatedAt { get; set; }
    public DateTime? UpdatedAt { get; set; }
}
