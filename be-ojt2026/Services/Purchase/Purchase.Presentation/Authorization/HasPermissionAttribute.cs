using Microsoft.AspNetCore.Authorization;

namespace Purchase.Presentation.Authorization;

public class HasPermissionAttribute : AuthorizeAttribute
{
    public HasPermissionAttribute(string permission)
        : base(policy: permission)
    {
    }
}
