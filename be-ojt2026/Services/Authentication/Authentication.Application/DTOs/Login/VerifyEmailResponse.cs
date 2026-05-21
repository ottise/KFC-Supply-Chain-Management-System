using System;
using System.Collections.Generic;
using System.Linq;
using System.Text;
using System.Threading.Tasks;

namespace Authentication.Application.DTOs.Login
{
    public class VerifyEmailResponse
    {
        public bool Valid { get; set; }
        public string Message { get; set; } = string.Empty;
    }
}
