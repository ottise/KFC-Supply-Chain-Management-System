using System.ComponentModel.DataAnnotations;

namespace Authentication.Application.DTOs.User;

public class CreateUserRequest
{
    public string Username { get; set; } = string.Empty;

    public string Password { get; set; } = string.Empty;

    public string Email { get; set; } = string.Empty;

    public string Fullname { get; set; } = string.Empty;

    public string Phone { get; set; } = string.Empty;
    public int RoleId { get; set; }
}
