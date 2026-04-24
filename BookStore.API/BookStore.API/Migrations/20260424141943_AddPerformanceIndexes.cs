using Microsoft.EntityFrameworkCore.Migrations;

#nullable disable

namespace BookStore.API.Migrations
{
    /// <inheritdoc />
    public partial class AddPerformanceIndexes : Migration
    {
        /// <inheritdoc />
        protected override void Up(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.DropIndex(
                name: "IX_Reviews_BookId",
                table: "Reviews");

            migrationBuilder.DropIndex(
                name: "IX_ReviewReplies_ReviewId",
                table: "ReviewReplies");

            migrationBuilder.DropIndex(
                name: "IX_Orders_UserId",
                table: "Orders");

            migrationBuilder.DropIndex(
                name: "IX_Carts_UserId",
                table: "Carts");

            migrationBuilder.DropIndex(
                name: "IX_CartItems_CartId",
                table: "CartItems");

            migrationBuilder.CreateIndex(
                name: "IX_Vouchers_ApplicableCategoryId",
                table: "Vouchers",
                column: "ApplicableCategoryId");

            migrationBuilder.CreateIndex(
                name: "IX_Vouchers_Code",
                table: "Vouchers",
                column: "Code",
                unique: true);

            migrationBuilder.CreateIndex(
                name: "IX_Vouchers_IsActive_IsHidden_StartDate_ExpirationDate",
                table: "Vouchers",
                columns: new[] { "IsActive", "IsHidden", "StartDate", "ExpirationDate" });

            migrationBuilder.CreateIndex(
                name: "IX_Users_CreatedAt",
                table: "Users",
                column: "CreatedAt");

            migrationBuilder.CreateIndex(
                name: "IX_Users_Email",
                table: "Users",
                column: "Email",
                unique: true);

            migrationBuilder.CreateIndex(
                name: "IX_Users_Role_IsLocked",
                table: "Users",
                columns: new[] { "Role", "IsLocked" });

            migrationBuilder.CreateIndex(
                name: "IX_Users_Username",
                table: "Users",
                column: "Username",
                unique: true);

            migrationBuilder.CreateIndex(
                name: "IX_Reviews_BookId_CreatedAt",
                table: "Reviews",
                columns: new[] { "BookId", "CreatedAt" });

            migrationBuilder.CreateIndex(
                name: "IX_Reviews_BookId_UserId",
                table: "Reviews",
                columns: new[] { "BookId", "UserId" },
                unique: true);

            migrationBuilder.CreateIndex(
                name: "IX_ReviewReplies_ReviewId_CreatedAt",
                table: "ReviewReplies",
                columns: new[] { "ReviewId", "CreatedAt" });

            migrationBuilder.CreateIndex(
                name: "IX_Orders_AppliedVoucherCode",
                table: "Orders",
                column: "AppliedVoucherCode");

            migrationBuilder.CreateIndex(
                name: "IX_Orders_PaymentMethod_Status",
                table: "Orders",
                columns: new[] { "PaymentMethod", "Status" });

            migrationBuilder.CreateIndex(
                name: "IX_Orders_Status_OrderDate",
                table: "Orders",
                columns: new[] { "Status", "OrderDate" });

            migrationBuilder.CreateIndex(
                name: "IX_Orders_UserId_OrderDate",
                table: "Orders",
                columns: new[] { "UserId", "OrderDate" });

            migrationBuilder.CreateIndex(
                name: "IX_Orders_UserId_Status",
                table: "Orders",
                columns: new[] { "UserId", "Status" });

            migrationBuilder.CreateIndex(
                name: "IX_Carts_UserId",
                table: "Carts",
                column: "UserId",
                unique: true);

            migrationBuilder.CreateIndex(
                name: "IX_CartItems_CartId_BookId",
                table: "CartItems",
                columns: new[] { "CartId", "BookId" },
                unique: true);

            migrationBuilder.CreateIndex(
                name: "IX_Books_IsHidden_AuthorId",
                table: "Books",
                columns: new[] { "IsHidden", "AuthorId" });

            migrationBuilder.CreateIndex(
                name: "IX_Books_IsHidden_CategoryId",
                table: "Books",
                columns: new[] { "IsHidden", "CategoryId" });

            migrationBuilder.CreateIndex(
                name: "IX_Books_IsHidden_CreatedAt",
                table: "Books",
                columns: new[] { "IsHidden", "CreatedAt" });

            migrationBuilder.CreateIndex(
                name: "IX_Books_IsHidden_PublisherId",
                table: "Books",
                columns: new[] { "IsHidden", "PublisherId" });

            migrationBuilder.CreateIndex(
                name: "IX_Books_IsHidden_TargetAudience",
                table: "Books",
                columns: new[] { "IsHidden", "TargetAudience" });

            migrationBuilder.CreateIndex(
                name: "IX_Banners_IsActive_DisplayOrder",
                table: "Banners",
                columns: new[] { "IsActive", "DisplayOrder" });
        }

        /// <inheritdoc />
        protected override void Down(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.DropIndex(
                name: "IX_Vouchers_ApplicableCategoryId",
                table: "Vouchers");

            migrationBuilder.DropIndex(
                name: "IX_Vouchers_Code",
                table: "Vouchers");

            migrationBuilder.DropIndex(
                name: "IX_Vouchers_IsActive_IsHidden_StartDate_ExpirationDate",
                table: "Vouchers");

            migrationBuilder.DropIndex(
                name: "IX_Users_CreatedAt",
                table: "Users");

            migrationBuilder.DropIndex(
                name: "IX_Users_Email",
                table: "Users");

            migrationBuilder.DropIndex(
                name: "IX_Users_Role_IsLocked",
                table: "Users");

            migrationBuilder.DropIndex(
                name: "IX_Users_Username",
                table: "Users");

            migrationBuilder.DropIndex(
                name: "IX_Reviews_BookId_CreatedAt",
                table: "Reviews");

            migrationBuilder.DropIndex(
                name: "IX_Reviews_BookId_UserId",
                table: "Reviews");

            migrationBuilder.DropIndex(
                name: "IX_ReviewReplies_ReviewId_CreatedAt",
                table: "ReviewReplies");

            migrationBuilder.DropIndex(
                name: "IX_Orders_AppliedVoucherCode",
                table: "Orders");

            migrationBuilder.DropIndex(
                name: "IX_Orders_PaymentMethod_Status",
                table: "Orders");

            migrationBuilder.DropIndex(
                name: "IX_Orders_Status_OrderDate",
                table: "Orders");

            migrationBuilder.DropIndex(
                name: "IX_Orders_UserId_OrderDate",
                table: "Orders");

            migrationBuilder.DropIndex(
                name: "IX_Orders_UserId_Status",
                table: "Orders");

            migrationBuilder.DropIndex(
                name: "IX_Carts_UserId",
                table: "Carts");

            migrationBuilder.DropIndex(
                name: "IX_CartItems_CartId_BookId",
                table: "CartItems");

            migrationBuilder.DropIndex(
                name: "IX_Books_IsHidden_AuthorId",
                table: "Books");

            migrationBuilder.DropIndex(
                name: "IX_Books_IsHidden_CategoryId",
                table: "Books");

            migrationBuilder.DropIndex(
                name: "IX_Books_IsHidden_CreatedAt",
                table: "Books");

            migrationBuilder.DropIndex(
                name: "IX_Books_IsHidden_PublisherId",
                table: "Books");

            migrationBuilder.DropIndex(
                name: "IX_Books_IsHidden_TargetAudience",
                table: "Books");

            migrationBuilder.DropIndex(
                name: "IX_Banners_IsActive_DisplayOrder",
                table: "Banners");

            migrationBuilder.CreateIndex(
                name: "IX_Reviews_BookId",
                table: "Reviews",
                column: "BookId");

            migrationBuilder.CreateIndex(
                name: "IX_ReviewReplies_ReviewId",
                table: "ReviewReplies",
                column: "ReviewId");

            migrationBuilder.CreateIndex(
                name: "IX_Orders_UserId",
                table: "Orders",
                column: "UserId");

            migrationBuilder.CreateIndex(
                name: "IX_Carts_UserId",
                table: "Carts",
                column: "UserId");

            migrationBuilder.CreateIndex(
                name: "IX_CartItems_CartId",
                table: "CartItems",
                column: "CartId");
        }
    }
}
