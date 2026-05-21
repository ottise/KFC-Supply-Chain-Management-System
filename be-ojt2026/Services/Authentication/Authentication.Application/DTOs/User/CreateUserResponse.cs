namespace Authentication.Application.DTOs.User;

public class CreateUserResponse
{
    public int Id { get; set; }
    public string Username { get; set; } = null!;

    public string Email { get; set; } = null!;

    public string? Fullname { get; set; }

    public string? Phone { get; set; }

    public string? Role { get; set; }
}
