using System;
using System.Collections.Generic;
using System.Linq;
using System.Text;
using System.Threading.Tasks;

namespace Authentication.Infrastructure.Ulties
{
    public class EmailVerificationTemplate
    {
        public static string Build(string userName, string to, string otp, string? password = null)
        {
            Console.WriteLine($"[DEBUG] EmailVerificationTemplate.Build called with userName={userName}, password={(string.IsNullOrEmpty(password) ? "NULL_OR_EMPTY" : "PRESENT")}");
            
            var credentialsSection = string.IsNullOrEmpty(password)
                ? ""
                : $@"
                    <div style='margin-top:30px; padding:20px; background:#f8f9fa; border-left:4px solid #E4002B; border-radius:4px;'>
                        <h3 style='margin-top:0; color:#E4002B;'>Tài Khoản Đăng Nhập</h3>
                        <p style='margin:10px 0;'><strong>Tên đăng nhập:</strong> <span style='font-family:monospace; background:#fff; padding:3px 8px; border:1px solid #ddd;'>{userName}</span></p>
                        <p style='margin:10px 0;'><strong>Mật khẩu:</strong> <span style='font-family:monospace; background:#fff; padding:3px 8px; border:1px solid #ddd;'>{password}</span></p>
                        <p style='font-size:12px; color:#666; margin-top:15px;'>Vui lòng đăng nhập và đổi mật khẩu sau khi xác thực email.</p>
                    </div>";

            return $@"
            <!DOCTYPE html>
            <html lang='en'>
            <head>
                <meta charset='UTF-8'>
                <title>Verify Your Email</title>
            </head>
            <body style='font-family: Arial, sans-serif; color: #333;'>
                <div style='max-width:600px; margin:auto; padding:20px; border:1px solid #ddd; border-radius:8px;'>
                    <h2 style='color:#E4002B;'>Xác Thực Email Của Bạn</h2>
                    <p>Chào <strong>{userName}</strong>,</p>
                    <p>Tài khoản của bạn đã được tạo trong <b>KFC System Management</b>.</p>
                    <p>Mã xác thực email của bạn là:</p>
                    <h1 style='letter-spacing:5px; background:#f1f1f1; padding:10px; display:inline-block; color:#E4002B;'>{otp}</h1>
                    <p>Mã này sẽ hết hạn sau 30 phút.</p>
                    <p>Nếu bạn không tạo tài khoản này, vui lòng bỏ qua email.</p>
                    {credentialsSection}
                    <p style='margin-top:20px; font-size:12px; color:#888;'>© {DateTime.Now.Year} KFC System Management</p>
                </div>
            </body>
            </html>";
        }
    }
}
