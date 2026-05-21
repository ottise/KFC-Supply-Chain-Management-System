namespace Authentication.Application.DTOs.Login
{
    public class VerifyOtpResponse
    {
        public bool Valid { get; set; }
        public string Message { get; set; } = string.Empty;
    }
}
