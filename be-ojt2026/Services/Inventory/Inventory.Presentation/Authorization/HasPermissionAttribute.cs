using Microsoft.AspNetCore.Authorization;

namespace Inventory.Presentation.Authorization;

public class HasPermissionAttribute : AuthorizeAttribute
{
    public HasPermissionAttribute(string permission)
        : base(policy: permission)
    {
    }
}
