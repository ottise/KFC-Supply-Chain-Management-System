using System;
using System.Collections.Generic;
using System.Linq;
using System.Text;
using System.Threading.Tasks;

namespace Authentication.Application.DTOs.Login
{
    public class SendVerificationEmailRequest
    {
        public string Email { get; set; } = string.Empty;
    }
}
