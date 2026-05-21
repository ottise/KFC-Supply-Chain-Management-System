using Authentication.Domain.Entities;

namespace Authentication.Application.IServices;

public interface IJwtService
{
    string GenerateToken(User user);
    bool ValidateToken(string token);
    string? GetUsernameFromToken(string token);
}
