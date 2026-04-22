using BookStore.API.Data;
using BookStore.API.Models;
using Microsoft.EntityFrameworkCore;
using QuestPDF.Fluent;
using QuestPDF.Helpers;
using QuestPDF.Infrastructure;

namespace BookStore.API.Services
{
    public class InvoiceService : IInvoiceService
    {
        private readonly AppDbContext _context;

        public InvoiceService(AppDbContext context)
        {
            _context = context;
        }

        public async Task<InvoicePdfResult?> GenerateAdminInvoiceAsync(string orderId)
        {
            var order = await GetOrderAsync(orderId);
            if (order == null)
                return null;

            return BuildInvoice(order);
        }

        public async Task<InvoicePdfResult?> GenerateUserInvoiceAsync(string userId, string orderId)
        {
            var order = await GetOrderAsync(orderId, userId);
            if (order == null)
                return null;

            return BuildInvoice(order);
        }

        private async Task<Order?> GetOrderAsync(string orderId, string? userId = null)
        {
            var query = _context.Orders
                .Include(o => o.User)
                .Include(o => o.OrderItems)
                    .ThenInclude(oi => oi.Book)
                .AsQueryable();

            if (!string.IsNullOrWhiteSpace(userId))
            {
                query = query.Where(o => o.UserId == userId);
            }

            return await query.FirstOrDefaultAsync(o => o.OrderId == orderId && o.Status != "PaymentPending");
        }

        private static InvoicePdfResult BuildInvoice(Order order)
        {
            if (order.Status == "Cancelled")
            {
                throw new InvalidOperationException("Đơn hàng đã hủy, không thể xuất hóa đơn.");
            }

            var isFinalInvoice = order.Status == "Delivered";
            var documentTitle = isFinalInvoice ? "HÓA ĐƠN BÁN HÀNG" : "PHIẾU ĐẶT HÀNG";
            var filePrefix = isFinalInvoice ? "hoa-don" : "phieu-dat-hang";
            var paymentMethod = order.PaymentMethod == "VNPAY" ? "VNPAY" : "COD";
            var createdAt = order.OrderDate.ToLocalTime();
            var appliedVoucherCode = order.AppliedVoucherCode ?? ExtractVoucherCode(order.Note);
            var cleanNote = RemoveVoucherMarker(order.Note);

            var pdf = Document.Create(container =>
            {
                container.Page(page =>
                {
                    page.Size(PageSizes.A4);
                    page.Margin(32);
                    page.DefaultTextStyle(x => x.FontSize(10).FontFamily("Arial"));

                    page.Header().Column(column =>
                    {
                        column.Item().Row(row =>
                        {
                            row.RelativeItem().Column(info =>
                            {
                                info.Item().Text("Tiến Thọ BookStore").Bold().FontSize(20).FontColor(Colors.Orange.Darken2);
                                info.Item().Text("Cửa hàng sách trực tuyến").FontSize(10).FontColor(Colors.Grey.Darken1);
                            });

                            row.ConstantItem(190).AlignRight().Column(info =>
                            {
                                info.Item().Text(documentTitle).Bold().FontSize(18);
                                info.Item().Text($"Mã đơn: {order.OrderId}").FontSize(10);
                                info.Item().Text($"Ngày tạo: {createdAt:dd/MM/yyyy HH:mm}").FontSize(10);
                            });
                        });

                        column.Item().PaddingTop(12).LineHorizontal(1).LineColor(Colors.Grey.Lighten2);
                    });

                    page.Content().PaddingVertical(18).Column(column =>
                    {
                        column.Spacing(16);

                        column.Item().Row(row =>
                        {
                            row.RelativeItem().Element(section =>
                            {
                                section.Column(info =>
                                {
                                    info.Item().Text("Thông tin khách hàng").Bold().FontSize(12);
                                    info.Item().PaddingTop(5).Text($"Khách hàng: {order.User?.FullName ?? "Khách vãng lai"}");
                                    info.Item().Text($"Email: {order.User?.Email ?? "-"}");
                                    info.Item().Text($"Điện thoại: {order.PhoneNumber}");
                                    info.Item().Text($"Địa chỉ: {order.ShippingAddress}");
                                });
                            });

                            row.ConstantItem(205).Element(section =>
                            {
                                section.Column(info =>
                                {
                                    info.Item().Text("Thông tin đơn hàng").Bold().FontSize(12);
                                    info.Item().PaddingTop(5).Text($"Trạng thái: {GetStatusLabel(order.Status)}");
                                    info.Item().Text($"Thanh toán: {paymentMethod}");
                                    info.Item().Text($"Số sản phẩm: {order.OrderItems.Sum(i => i.Quantity)}");

                                    if (!string.IsNullOrWhiteSpace(appliedVoucherCode))
                                    {
                                        info.Item().Text($"Mã voucher đơn hàng: {appliedVoucherCode}").FontColor(Colors.Green.Darken2);
                                    }
                                });
                            });
                        });

                        column.Item().Table(table =>
                        {
                            table.ColumnsDefinition(columns =>
                            {
                                columns.ConstantColumn(34);
                                columns.RelativeColumn(4);
                                columns.ConstantColumn(42);
                                columns.ConstantColumn(118);
                                columns.ConstantColumn(92);
                            });

                            table.Header(header =>
                            {
                                header.Cell().Element(HeaderCell).Text("STT");
                                header.Cell().Element(HeaderCell).Text("Tên sách");
                                header.Cell().Element(HeaderCell).AlignRight().Text("SL");
                                header.Cell().Element(HeaderCell).AlignRight().Text("Đơn giá");
                                header.Cell().Element(HeaderCell).AlignRight().Text("Thành tiền");
                            });

                            var index = 1;
                            foreach (var item in order.OrderItems)
                            {
                                var lineTotal = item.Quantity * item.UnitPrice;
                                var hasHardcodedDiscount = item.Book != null && item.UnitPrice < item.Book.Price;

                                table.Cell().Element(BodyCell).Text(index.ToString());
                                table.Cell().Element(BodyCell).Text(item.Book?.Title ?? "Sách không tồn tại");
                                table.Cell().Element(BodyCell).AlignRight().Text(item.Quantity.ToString());
                                table.Cell().Element(BodyCell).AlignRight().Column(priceColumn =>
                                {
                                    if (hasHardcodedDiscount)
                                    {
                                        priceColumn.Item().Text($"Giá gốc: {FormatCurrency(item.Book!.Price)}").FontSize(8).FontColor(Colors.Grey.Darken1);
                                        priceColumn.Item().Text($"Sau ưu đãi: {FormatCurrency(item.UnitPrice)}").Bold().FontColor(Colors.Red.Darken1);
                                    }
                                    else
                                    {
                                        priceColumn.Item().Text(FormatCurrency(item.UnitPrice));
                                    }
                                });
                                table.Cell().Element(BodyCell).AlignRight().Text(FormatCurrency(lineTotal));
                                index++;
                            }
                        });

                        column.Item().AlignRight().Width(250).Column(total =>
                        {
                            total.Item().Row(row =>
                            {
                                row.RelativeItem().Text("Tạm tính:");
                                row.ConstantItem(130).AlignRight().Text(FormatCurrency(order.OrderItems.Sum(i => i.Quantity * i.UnitPrice)));
                            });
                            total.Item().Row(row =>
                            {
                                row.RelativeItem().Text("Vận chuyển:");
                                row.ConstantItem(130).AlignRight().Text("Miễn phí");
                            });
                            if (!string.IsNullOrWhiteSpace(appliedVoucherCode))
                            {
                                total.Item().Row(row =>
                                {
                                    row.RelativeItem().Text("Voucher đơn hàng:");
                                    row.ConstantItem(130).AlignRight().Text(appliedVoucherCode).FontColor(Colors.Green.Darken2);
                                });
                            }
                            total.Item().PaddingTop(6).LineHorizontal(1).LineColor(Colors.Grey.Lighten2);
                            total.Item().PaddingTop(6).Row(row =>
                            {
                                row.RelativeItem().Text("Tổng thanh toán:").Bold().FontSize(12);
                                row.ConstantItem(130).AlignRight().Text(FormatCurrency(order.TotalAmount)).Bold().FontSize(12).FontColor(Colors.Red.Darken1);
                            });
                        });

                        if (!string.IsNullOrWhiteSpace(cleanNote))
                        {
                            column.Item().Background(Colors.Grey.Lighten4).Padding(8).Text($"Ghi chú: {cleanNote}").FontSize(9);
                        }
                    });

                    page.Footer().AlignCenter().Text(text =>
                    {
                        text.Span("Trang ");
                        text.CurrentPageNumber();
                        text.Span(" / ");
                        text.TotalPages();
                    });
                });
            }).GeneratePdf();

            return new InvoicePdfResult
            {
                Content = pdf,
                FileName = $"{filePrefix}-{order.OrderId}.pdf",
            };
        }

        private static IContainer HeaderCell(IContainer container)
        {
            return container
                .DefaultTextStyle(x => x.Bold().FontColor(Colors.White))
                .Background(Colors.Orange.Darken2)
                .PaddingVertical(6)
                .PaddingHorizontal(5);
        }

        private static IContainer BodyCell(IContainer container)
        {
            return container
                .BorderBottom(1)
                .BorderColor(Colors.Grey.Lighten2)
                .PaddingVertical(7)
                .PaddingHorizontal(5);
        }

        private static string FormatCurrency(decimal amount)
        {
            return $"{amount:N0} VND";
        }

        private static string? ExtractVoucherCode(string? note)
        {
            const string marker = "[VoucherCode:";
            if (string.IsNullOrWhiteSpace(note))
                return null;

            var start = note.IndexOf(marker, StringComparison.OrdinalIgnoreCase);
            if (start < 0)
                return null;

            start += marker.Length;
            var end = note.IndexOf(']', start);
            return end > start ? note[start..end] : null;
        }

        private static string RemoveVoucherMarker(string note)
        {
            const string marker = "[VoucherCode:";
            var start = note.IndexOf(marker, StringComparison.OrdinalIgnoreCase);
            if (start < 0)
                return note;

            var end = note.IndexOf(']', start);
            if (end < start)
                return note;

            return (note[..start] + note[(end + 1)..]).Trim();
        }

        private static string GetStatusLabel(string status)
        {
            return status switch
            {
                "Pending" => "Chờ xác nhận",
                "Processing" => "Đang xử lý",
                "Shipped" => "Đang giao hàng",
                "Delivered" => "Đã giao",
                "Cancelled" => "Đã hủy",
                _ => status,
            };
        }
    }
}
