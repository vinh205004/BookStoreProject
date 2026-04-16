using BookStore.API.Data;
using BookStore.API.Hubs;
using BookStore.API.Repositories;
using BookStore.API.Services;
using BookStore.API.Utilities;
using Microsoft.AspNetCore.Authentication.JwtBearer;
using Microsoft.EntityFrameworkCore;
using Microsoft.IdentityModel.Tokens;
using Microsoft.OpenApi.Models;
using Microsoft.AspNetCore.SignalR;
using QuestPDF.Infrastructure;
using System.Text;

namespace BookStore.API
{
    public class Program
    {
        public static void Main(string[] args)
        {
            QuestPDF.Settings.License = LicenseType.Community;

            var builder = WebApplication.CreateBuilder(args);


            builder.Services.AddControllers()
                .AddJsonOptions(options =>
                {
                    options.JsonSerializerOptions.PropertyNamingPolicy = System.Text.Json.JsonNamingPolicy.CamelCase;
                });
            
            builder.Services.AddEndpointsApiExplorer();
            builder.Services.AddSwaggerGen();
            builder.Services.AddSignalR();
            builder.Services.AddSingleton<IUserIdProvider, SignalRUserIdProvider>();
              // Add Scoped Services
              builder.Services.AddScoped<BookStore.API.Data.AppDbSeeder>();            builder.Services.AddDbContext<AppDbContext>(options =>
            options.UseNpgsql(builder.Configuration.GetConnectionString("DefaultConnection")));
            // 1. Đăng ký DI Container
            builder.Services.AddScoped<IAuthService, AuthService>();
            builder.Services.AddScoped<ICategoryRepository, CategoryRepository>();
            builder.Services.AddScoped<ICategoryService, CategoryService>();
            builder.Services.AddScoped<IBookRepository, BookRepository>();
            builder.Services.AddScoped<IBookService, BookService>();
            builder.Services.AddScoped<IAuthorRepository, AuthorRepository>();
            builder.Services.AddScoped<IAuthorService, AuthorService>();
            builder.Services.AddScoped<IVoucherRepository, VoucherRepository>();
            builder.Services.AddScoped<IVoucherService, VoucherService>();
            builder.Services.AddScoped<IUserRepository, UserRepository>();
            builder.Services.AddScoped<IUserService, UserService>();
            builder.Services.AddScoped<IOrderRepository, OrderRepository>();
            builder.Services.AddScoped<IOrderService, OrderService>();
            builder.Services.AddScoped<PhotoService>();
            builder.Services.AddScoped<IPublisherRepository, PublisherRepository>();
            builder.Services.AddScoped<IPublisherService, PublisherService>();
            builder.Services.AddScoped<IProductRepository, ProductRepository>();
            builder.Services.AddScoped<IProductService, ProductService>();
            builder.Services.AddScoped<IAccountService, AccountService>();
            builder.Services.AddScoped<ICartService, CartService>();
            builder.Services.AddScoped<ICartRepository, CartRepository>();
            builder.Services.AddScoped<IBannerRepository, BannerRepository>();
            builder.Services.AddScoped<IBannerService, BannerService>();
            builder.Services.AddScoped<IDashboardRepository, DashboardRepository>();
            builder.Services.AddScoped<IDashboardService, DashboardService>();
            builder.Services.AddScoped<IReviewRepository, ReviewRepository>();
            builder.Services.AddScoped<IReviewService, ReviewService>();
            builder.Services.AddScoped<IReviewReplyRepository, ReviewReplyRepository>();
            builder.Services.AddScoped<IReviewReplyService, ReviewReplyService>();
            builder.Services.AddScoped<IChatbotService, ChatbotService>();
            builder.Services.AddScoped<VnpayService>();
            builder.Services.AddScoped<IPaymentService, PaymentService>();
            builder.Services.AddScoped<IInvoiceService, InvoiceService>();
            
            builder.Services.AddHttpClient("ChatAnywhere", client =>
            {
                client.Timeout = TimeSpan.FromSeconds(30);
            });

            // 2. Cấu hình xác thực JWT
            builder.Services.AddAuthentication(JwtBearerDefaults.AuthenticationScheme)
                .AddJwtBearer(options =>
                {
                    options.TokenValidationParameters = new TokenValidationParameters
                    {
                        ValidateIssuer = true,
                        ValidateAudience = true,
                        ValidateLifetime = true,
                        ValidateIssuerSigningKey = true,
                        ValidIssuer = builder.Configuration["Jwt:Issuer"],
                        ValidAudience = builder.Configuration["Jwt:Audience"],
                        IssuerSigningKey = new SymmetricSecurityKey(Encoding.UTF8.GetBytes(builder.Configuration["Jwt:Key"]!))
                    };
                    options.Events = new JwtBearerEvents
                    {
                        OnMessageReceived = context =>
                        {
                            var accessToken = context.Request.Query["access_token"];
                            var path = context.HttpContext.Request.Path;

                            if (!string.IsNullOrEmpty(accessToken) && path.StartsWithSegments("/hubs/notifications"))
                            {
                                context.Token = accessToken;
                            }

                            return Task.CompletedTask;
                        }
                    };
                });
            builder.Services.AddSwaggerGen(c =>
            {
                c.SwaggerDoc("v1", new OpenApiInfo { Title = "BookStore API", Version = "v1" });

                // 1. Định nghĩa Security Scheme
                c.AddSecurityDefinition("Bearer", new OpenApiSecurityScheme
                {
                    Description = "Nhập token theo chuẩn: Bearer {token_của_bạn}. Ví dụ: Bearer eyJhbGci...",
                    Name = "Authorization",
                    In = ParameterLocation.Header,
                    Type = SecuritySchemeType.ApiKey,
                    Scheme = "Bearer"
                });
                c.AddSecurityRequirement(new OpenApiSecurityRequirement()
    {
        {
            new OpenApiSecurityScheme
            {
                Reference = new OpenApiReference
                {
                    Type = ReferenceType.SecurityScheme,
                    Id = "Bearer"
                },
                Scheme = "oauth2",
                Name = "Bearer",
                In = ParameterLocation.Header,
            },
            new List<string>()
        }
    });
            });

            // Cấu hình CORS cho phép Frontend gọi API
            builder.Services.AddCors(options =>
            {
                options.AddPolicy("AllowAll",
                    b => b.SetIsOriginAllowed(_ => true)
                          .AllowAnyMethod()
                          .AllowAnyHeader()
                          .AllowCredentials());
            });

            var app = builder.Build();
            
            app.UseCors("AllowAll");
            
            // Initialize ID Generator to fix the duplicate keys error
            BookStore.API.Utilities.IdGenerator.Initialize(app.Services);

            using (var scope = app.Services.CreateScope())
            {
                var context = scope.ServiceProvider.GetRequiredService<BookStore.API.Data.AppDbContext>();

                if (!context.Users.Any(u => u.Role == "Admin"))
                {
                    var adminUser = new BookStore.API.Models.User
                    {
                        UserId = IdGenerator.GenerateUserId(),
                        Username = "admin_tientho",
                        FullName = "Quản Trị Viên",
                        Email = "admin@tientho.vn",
                        PasswordHash = BCrypt.Net.BCrypt.HashPassword("Admin@123"),
                        PhoneNumber = "0987654321",
                        Address = "Hà Nội",
                        Role = "Admin",
                        IsLocked = false,
                        CreatedAt = DateTime.UtcNow
                    };
                    context.Users.Add(adminUser);
                    context.SaveChanges();
                }
            }

            // Configure the HTTP request pipeline.
            if (app.Environment.IsDevelopment())
            {
                app.UseSwagger();
                app.UseSwaggerUI();
            }

            app.UseHttpsRedirection();

            app.UseAuthentication();

            app.Use(async (context, next) =>
            {
                if (context.User.Identity?.IsAuthenticated == true)
                {
                    var userId = context.User.FindFirst("UserId")?.Value;
                    if (!string.IsNullOrWhiteSpace(userId))
                    {
                        using var scope = app.Services.CreateScope();
                        var dbContext = scope.ServiceProvider.GetRequiredService<AppDbContext>();
                        var isLocked = await dbContext.Users
                            .AsNoTracking()
                            .Where(u => u.UserId == userId)
                            .Select(u => (bool?)u.IsLocked)
                            .FirstOrDefaultAsync();

                        if (isLocked == true)
                        {
                            context.Response.StatusCode = StatusCodes.Status401Unauthorized;
                            await context.Response.WriteAsJsonAsync(new { error = "Tài khoản đã bị khóa. Vui lòng liên hệ quản trị viên!" });
                            return;
                        }
                    }
                }

                await next();
            });

            app.UseAuthorization();

            if (app.Environment.IsDevelopment())
            {
                app.MapGet("/api/dev/seed", async (BookStore.API.Data.AppDbSeeder seeder) =>
                {
                    try
                    {
                        await seeder.SeedAsync();
                        return Results.Ok(new { message = "Database seeded successfully." });
                    }
                    catch (Exception ex)
                    {
                        return Results.BadRequest(ex.Message);
                    }
                });
            }

            app.MapControllers();
            app.MapHub<NotificationHub>("/hubs/notifications");
            app.Run();
        }
    }
}
