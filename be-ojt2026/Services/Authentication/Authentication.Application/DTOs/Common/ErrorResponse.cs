namespace Authentication.Application.DTOs.Common
{
    public class ErrorResponse
    {
        public string Message { get; set; } = string.Empty;
    }

    public class ValidationErrorResponse : ErrorResponse
    {
        public List<string> Errors { get; set; } = new List<string>();
    }
}
