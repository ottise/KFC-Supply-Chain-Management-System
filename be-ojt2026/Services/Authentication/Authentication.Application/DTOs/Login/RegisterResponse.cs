using System;
using System.Collections.Generic;
using System.Linq;
using System.Text;
using System.Threading.Tasks;

namespace Authentication.Application.DTOs.Login
{
    public class RegisterResponse
    {
        public int Id { get; set; }
        public string Username { get; set; } = null!;

        public string Email { get; set; } = null!;

        public string? Fullname { get; set; }

        public string? Phone { get; set; }

        public string? Role { get; set; }

        public int? ManagerId { get; set; }

        public bool? IsActiveMail { get; set; }
    }
}
