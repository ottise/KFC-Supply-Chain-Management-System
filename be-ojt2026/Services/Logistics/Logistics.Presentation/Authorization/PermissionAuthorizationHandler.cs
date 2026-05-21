using Microsoft.AspNetCore.Authorization;
using System.Security.Claims;

namespace Logistics.Presentation.Authorization;

public class PermissionAuthorizationHandler : AuthorizationHandler<HasPermissionRequirement>
{
    protected override Task HandleRequirementAsync(AuthorizationHandlerContext context, HasPermissionRequirement requirement)
    {
        throw new NotImplementedException();
    }
}
