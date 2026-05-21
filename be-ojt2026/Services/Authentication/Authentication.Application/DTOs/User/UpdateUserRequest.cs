using System;
using System.Collections.Generic;
using System.ComponentModel.DataAnnotations;
using System.Linq;
using System.Text;
using System.Threading.Tasks;

namespace Authentication.Application.DTOs.User
{
    public class UpdateUserRequest
    {
        public string Fullname { get; set; } = string.Empty;
        public string Phone { get; set; } = string.Empty;
    }
}
