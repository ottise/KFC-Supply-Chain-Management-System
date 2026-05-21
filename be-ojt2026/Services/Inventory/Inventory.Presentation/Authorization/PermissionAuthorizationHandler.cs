using Microsoft.AspNetCore.Authorization;
using System.Runtime.InteropServices;
using System.Security.Claims;

namespace Inventory.Presentation.Authorization;

public class PermissionAuthorizationHandler : AuthorizationHandler<HasPermissionRequirement>
{
    protected override Task HandleRequirementAsync(AuthorizationHandlerContext context, HasPermissionRequirement requirement)
    {
        throw new NotImplementedException();
    }
}

