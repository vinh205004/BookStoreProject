using System.Globalization;
using System.Net;
using System.Security.Cryptography;
using System.Text;
using BookStore.API.Models;
using Microsoft.Extensions.Primitives;

namespace BookStore.API.Services
{
    public class VnpayService
    {
        private readonly IConfiguration _configuration;

        public VnpayService(IConfiguration configuration)
        {
            _configuration = configuration;
        }

        public string CreatePaymentUrl(Order order, HttpContext httpContext)
        {
            return CreatePaymentUrl(order.OrderId, order.TotalAmount, httpContext);
        }

        public string CreatePaymentUrl(string orderId, decimal totalAmount, HttpContext httpContext)
        {
            var paymentUrl = GetRequiredConfig("Vnpay:PaymentUrl");
            var returnUrl = GetRequiredConfig("Vnpay:ReturnUrl");
            var tmnCode = GetRequiredConfig("Vnpay:TmnCode");

            var createdAt = DateTime.UtcNow.AddHours(7);
            var parameters = new SortedDictionary<string, string>(StringComparer.Ordinal)
            {
                ["vnp_Version"] = "2.1.0",
                ["vnp_Command"] = "pay",
                ["vnp_TmnCode"] = tmnCode,
                ["vnp_Amount"] = ((long)(totalAmount * 100)).ToString(CultureInfo.InvariantCulture),
                ["vnp_CreateDate"] = createdAt.ToString("yyyyMMddHHmmss", CultureInfo.InvariantCulture),
                ["vnp_CurrCode"] = "VND",
                ["vnp_IpAddr"] = GetClientIpAddress(httpContext),
                ["vnp_Locale"] = "vn",
                ["vnp_OrderInfo"] = $"Thanh toan don hang {orderId}",
                ["vnp_OrderType"] = "other",
                ["vnp_ReturnUrl"] = returnUrl,
                ["vnp_TxnRef"] = orderId
            };

            var hashData = BuildHashData(parameters);
            var secureHash = HmacSha512(GetRequiredConfig("Vnpay:HashSecret"), hashData);
            var query = BuildQuery(parameters);

            return $"{paymentUrl}?{query}&vnp_SecureHash={secureHash}";
        }

        public bool ValidateSignature(IQueryCollection query)
        {
            if (!query.TryGetValue("vnp_SecureHash", out var receivedHash) || StringValues.IsNullOrEmpty(receivedHash))
            {
                return false;
            }

            var parameters = new SortedDictionary<string, string>(StringComparer.Ordinal);
            foreach (var item in query)
            {
                if (item.Key.Equals("vnp_SecureHash", StringComparison.OrdinalIgnoreCase) ||
                    item.Key.Equals("vnp_SecureHashType", StringComparison.OrdinalIgnoreCase))
                {
                    continue;
                }

                if (!StringValues.IsNullOrEmpty(item.Value))
                {
                    parameters[item.Key] = item.Value.ToString();
                }
            }

            var hashData = BuildHashData(parameters);
            var calculatedHash = HmacSha512(GetRequiredConfig("Vnpay:HashSecret"), hashData);
            return calculatedHash.Equals(receivedHash.ToString(), StringComparison.OrdinalIgnoreCase);
        }

        public string GetClientReturnUrl(string orderId, bool success, string responseCode)
        {
            var clientReturnUrl = _configuration["Vnpay:ClientReturnUrl"] ?? "http://localhost:5173/orders";
            var separator = clientReturnUrl.Contains('?') ? "&" : "?";
            return $"{clientReturnUrl}{separator}payment={(success ? "success" : "failed")}&orderId={WebUtility.UrlEncode(orderId)}&code={WebUtility.UrlEncode(responseCode)}";
        }

        private string GetRequiredConfig(string key)
        {
            return _configuration[key] ?? throw new InvalidOperationException($"Thiếu cấu hình {key}");
        }

        private static string BuildHashData(SortedDictionary<string, string> parameters)
        {
            return string.Join("&", parameters.Select(p => $"{Encode(p.Key)}={Encode(p.Value)}"));
        }

        private static string BuildQuery(SortedDictionary<string, string> parameters)
        {
            return string.Join("&", parameters.Select(p => $"{Encode(p.Key)}={Encode(p.Value)}"));
        }

        private static string Encode(string value)
        {
            return Uri.EscapeDataString(value).Replace("%20", "+");
        }

        private static string HmacSha512(string key, string input)
        {
            var keyBytes = Encoding.UTF8.GetBytes(key);
            var inputBytes = Encoding.UTF8.GetBytes(input);
            using var hmac = new HMACSHA512(keyBytes);
            var hashBytes = hmac.ComputeHash(inputBytes);
            return Convert.ToHexString(hashBytes).ToLowerInvariant();
        }

        private static string GetClientIpAddress(HttpContext httpContext)
        {
            var forwardedFor = httpContext.Request.Headers["X-Forwarded-For"].FirstOrDefault();
            if (!string.IsNullOrWhiteSpace(forwardedFor))
            {
                return forwardedFor.Split(',')[0].Trim();
            }

            var remoteIp = httpContext.Connection.RemoteIpAddress?.ToString();
            return string.IsNullOrWhiteSpace(remoteIp) || remoteIp == "::1" ? "127.0.0.1" : remoteIp;
        }
    }
}
