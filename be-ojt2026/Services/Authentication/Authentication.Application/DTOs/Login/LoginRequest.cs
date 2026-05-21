using System.ComponentModel.DataAnnotations;

namespace Authentication.Application.DTOs.Login;

public class LoginRequest
{
    public string EmailOrUsername { get; set; } = string.Empty;

    public string Password { get; set; } = string.Empty;
}
