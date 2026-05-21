using System;
using System.Collections.Generic;
using System.ComponentModel.DataAnnotations;
using System.Linq;
using System.Text;
using System.Threading.Tasks;

namespace Authentication.Application.DTOs.Roles
{
    public class CreateRoleRequest
    {
        public string Name { get; set; } = string.Empty;
    }
}
