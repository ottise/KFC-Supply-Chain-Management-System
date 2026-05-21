using Authentication.Application.DTOs;
using Authentication.Application.IRepositories;
using MailKit;
using MailKit.Net.Smtp;
using MailKit.Security;
using Microsoft.Extensions.Options;
using MimeKit;
using IMailService = Authentication.Application.IServices.IMailService;

namespace Authentication.Application.Services
{
    public class MailService : IMailService
    {
        private MailSetting _setting;
        private readonly IUnitOfWork _unitOfWork;

        public MailService(
            IOptions<MailSetting> setting,
            IUnitOfWork unitOfWork)
        {
            _setting = setting?.Value ?? throw new ArgumentNullException(nameof(setting));
            _unitOfWork = unitOfWork;
        }


        private MimeMessage CreateMessage(string toEmail, string subject, string body)
        {
            if (string.IsNullOrWhiteSpace(toEmail)) throw new ArgumentException("Recipient email cannot be empty.", nameof(toEmail));
            if (string.IsNullOrWhiteSpace(subject)) throw new ArgumentException("Email subject cannot be empty.", nameof(subject));
            if (string.IsNullOrWhiteSpace(body)) throw new ArgumentException("Email body cannot be empty.", nameof(body));

            var message = new MimeMessage();
            message.From.Add(new MailboxAddress(_setting.SenderName, _setting.SenderEmail));
            message.To.Add(MailboxAddress.Parse(toEmail));
            message.Subject = subject;
            message.Body = new TextPart("html") { Text = body };
            return message;
        }

        private async Task SendEmailAsync(MimeMessage message)
        {
            using var client = new SmtpClient(new ProtocolLogger("smtp.log"));
            try
            {
                await client.ConnectAsync(_setting.SmtpServer, _setting.Port, SecureSocketOptions.StartTls);
                await client.AuthenticateAsync(_setting.SenderEmail, _setting.SenderPassword);
                await client.SendAsync(message);
            }
            catch (Exception ex)
            {
                throw new InvalidOperationException(
                    $"Failed to send email to {string.Join(", ", message.To)}. Reason: {ex.Message}", ex);
            }
            finally
            {
                await client.DisconnectAsync(true);
            }
        }


        public async Task SendOtpMailAsync(string toEmail, string otp)
        {
            if (string.IsNullOrWhiteSpace(toEmail))
                throw new ArgumentException("Recipient email cannot be empty.", nameof(toEmail));

            if (string.IsNullOrWhiteSpace(otp))
                throw new ArgumentException("OTP cannot be empty.", nameof(otp));

            var template = await _unitOfWork.EmailRepository.GetForgotPasswordTemplate(
                email: toEmail,
                to: toEmail,
                otp: otp
            ) ?? throw new InvalidOperationException("Forgot password email template not found.");

            var message = CreateMessage(toEmail, "Reset Your Password - KFC System Management", template);
            await SendEmailAsync(message);
        }

        public async Task SendPasswordChangedMailAsync(string toEmail)
        {
            if (string.IsNullOrWhiteSpace(toEmail))
                throw new ArgumentException("Recipient email cannot be empty.", nameof(toEmail));

            var template = await _unitOfWork.EmailRepository.GetPasswordChangedTemplate(
                email: toEmail,
                to: toEmail
            ) ?? throw new InvalidOperationException("Password changed email template not found.");

            var message = CreateMessage(toEmail, "Your Password Has Been Changed", template);
            await SendEmailAsync(message);
        }

        public async Task SendEmailVerificationMailAsync(string toEmail, string otp, string? password = null)
        {
            if (string.IsNullOrWhiteSpace(toEmail))
                throw new ArgumentException("Recipient email cannot be empty.", nameof(toEmail));

            if (string.IsNullOrWhiteSpace(otp))
                throw new ArgumentException("Verification code cannot be empty.", nameof(otp));


            var template = await _unitOfWork.EmailRepository.GetEmailVerificationTemplate(
                email: toEmail,
                to: toEmail,
                otp: otp,
                password: password
                ) ?? throw new InvalidOperationException("Email verification template not found.");

            var message = CreateMessage(toEmail, "Verify Your Email - KFC System Management", template);
            await SendEmailAsync(message);
        }
    }
}
