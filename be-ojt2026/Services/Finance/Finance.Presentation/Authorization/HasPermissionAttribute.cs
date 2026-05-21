using Microsoft.AspNetCore.Authorization;

namespace Finance.Presentation.Authorization;

public class HasPermissionAttribute : AuthorizeAttribute
{
    public HasPermissionAttribute(string permission)
        : base(policy: permission)
    {
    }
}
