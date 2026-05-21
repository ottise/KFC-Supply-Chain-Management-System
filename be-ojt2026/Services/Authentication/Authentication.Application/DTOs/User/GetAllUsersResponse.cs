namespace Authentication.Application.DTOs.User;

public class GetAllUsersResponse
{
    public int Id { get; set; }
    public string Username { get; set; } = string.Empty;
    public string Email { get; set; } = string.Empty;
    public string? Fullname { get; set; }
    public string? Phone { get; set; }
    public string Role { get; set; } = string.Empty;
    public string Status { get; set; } = string.Empty;
    public DateTime? CreatedAt { get; set; }
    public int? ManagerId { get; set; }
    public bool? isActiveEmail { get; set; }
}
