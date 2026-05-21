using Microsoft.AspNetCore.Authorization;

namespace Notification.Presentation.Authorization;

public class HasPermissionRequirement : IAuthorizationRequirement
{
    public string Permisssion { get; }

    public HasPermissionRequirement(string permission)
    {
        Permisssion = permission;
    }
}
