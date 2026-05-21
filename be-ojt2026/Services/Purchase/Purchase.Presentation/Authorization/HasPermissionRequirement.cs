using Microsoft.AspNetCore.Authorization;

namespace Purchase.Presentation.Authorization;

public class HasPermissionRequirement : IAuthorizationRequirement
{
    public string Permisssion { get; }

    public HasPermissionRequirement(string permission)
    {
        Permisssion = permission;
    }
}
