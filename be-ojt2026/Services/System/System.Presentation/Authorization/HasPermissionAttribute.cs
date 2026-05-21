using Microsoft.AspNetCore.Authorization;

namespace System.Presentation.Authorization;

public class HasPermissionAttribute : AuthorizeAttribute
{
    public HasPermissionAttribute(string permission)
        : base(policy: permission)
    {
    }
}
