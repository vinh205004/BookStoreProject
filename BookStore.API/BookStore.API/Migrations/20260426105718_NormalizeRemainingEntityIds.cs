using Microsoft.EntityFrameworkCore.Migrations;

#nullable disable

namespace BookStore.API.Migrations
{
    /// <inheritdoc />
    public partial class NormalizeRemainingEntityIds : Migration
    {
        /// <inheritdoc />
        protected override void Up(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.CreateSequence<int>(
                name: "banner_id_seq");

            migrationBuilder.CreateSequence<int>(
                name: "cart_id_seq");

            migrationBuilder.CreateSequence<int>(
                name: "cart_item_id_seq");

            migrationBuilder.CreateSequence<int>(
                name: "image_id_seq");

            migrationBuilder.CreateSequence<int>(
                name: "order_id_seq");

            migrationBuilder.CreateSequence<int>(
                name: "order_item_id_seq");

            migrationBuilder.CreateSequence<int>(
                name: "review_id_seq");

            migrationBuilder.CreateSequence<int>(
                name: "review_reply_id_seq");

            migrationBuilder.CreateSequence<int>(
                name: "user_id_seq");

            migrationBuilder.DropForeignKey(
                name: "FK_BookImages_Books_BookId",
                table: "BookImages");

            migrationBuilder.DropForeignKey(
                name: "FK_Carts_Users_UserId",
                table: "Carts");

            migrationBuilder.DropForeignKey(
                name: "FK_CartItems_Books_BookId",
                table: "CartItems");

            migrationBuilder.DropForeignKey(
                name: "FK_CartItems_Carts_CartId",
                table: "CartItems");

            migrationBuilder.DropForeignKey(
                name: "FK_Orders_Users_UserId",
                table: "Orders");

            migrationBuilder.DropForeignKey(
                name: "FK_OrderItems_Books_BookId",
                table: "OrderItems");

            migrationBuilder.DropForeignKey(
                name: "FK_OrderItems_Orders_OrderId",
                table: "OrderItems");

            migrationBuilder.DropForeignKey(
                name: "FK_Reviews_Books_BookId",
                table: "Reviews");

            migrationBuilder.DropForeignKey(
                name: "FK_Reviews_Users_UserId",
                table: "Reviews");

            migrationBuilder.DropForeignKey(
                name: "FK_ReviewReplies_Reviews_ReviewId",
                table: "ReviewReplies");

            migrationBuilder.DropForeignKey(
                name: "FK_ReviewReplies_Users_UserId",
                table: "ReviewReplies");

            migrationBuilder.Sql(
                """
                DO $$
                DECLARE
                    max_book integer;
                    max_user integer;
                    max_order integer;
                    max_image integer;
                    max_cart integer;
                    max_cart_item integer;
                    max_order_item integer;
                    max_banner integer;
                    max_review integer;
                    max_review_reply integer;
                BEGIN
                    CREATE TEMP TABLE book_id_map (
                        old_id text PRIMARY KEY,
                        new_id text NOT NULL UNIQUE
                    ) ON COMMIT DROP;

                    CREATE TEMP TABLE user_id_map (
                        old_id text PRIMARY KEY,
                        new_id text NOT NULL UNIQUE
                    ) ON COMMIT DROP;

                    CREATE TEMP TABLE order_id_map (
                        old_id text PRIMARY KEY,
                        new_id text NOT NULL UNIQUE
                    ) ON COMMIT DROP;

                    CREATE TEMP TABLE image_id_map (
                        old_id text PRIMARY KEY,
                        new_id text NOT NULL UNIQUE
                    ) ON COMMIT DROP;

                    CREATE TEMP TABLE cart_id_map (
                        old_id text PRIMARY KEY,
                        new_id text NOT NULL UNIQUE
                    ) ON COMMIT DROP;

                    CREATE TEMP TABLE cart_item_id_map (
                        old_id text PRIMARY KEY,
                        new_id text NOT NULL UNIQUE
                    ) ON COMMIT DROP;

                    CREATE TEMP TABLE order_item_id_map (
                        old_id text PRIMARY KEY,
                        new_id text NOT NULL UNIQUE
                    ) ON COMMIT DROP;

                    CREATE TEMP TABLE banner_id_map (
                        old_id text PRIMARY KEY,
                        new_id text NOT NULL UNIQUE
                    ) ON COMMIT DROP;

                    CREATE TEMP TABLE review_id_map (
                        old_id text PRIMARY KEY,
                        new_id text NOT NULL UNIQUE
                    ) ON COMMIT DROP;

                    CREATE TEMP TABLE review_reply_id_map (
                        old_id text PRIMARY KEY,
                        new_id text NOT NULL UNIQUE
                    ) ON COMMIT DROP;

                    SELECT COALESCE(MAX(SUBSTRING("BookId" FROM 2)::integer), 0)
                    INTO max_book
                    FROM "Books"
                    WHERE "BookId" ~ '^B[0-9]+$';

                    INSERT INTO book_id_map (old_id, new_id)
                    SELECT old_id, 'B' || LPAD((max_book + rn)::text, 3, '0')
                    FROM (
                        SELECT "BookId" AS old_id,
                               ROW_NUMBER() OVER (ORDER BY "BookId") AS rn
                        FROM "Books"
                        WHERE "BookId" !~ '^B[0-9]+$'
                    ) src;

                    SELECT COALESCE(MAX(SUBSTRING("UserId" FROM 2)::integer), 0)
                    INTO max_user
                    FROM "Users"
                    WHERE "UserId" ~ '^U[0-9]+$';

                    INSERT INTO user_id_map (old_id, new_id)
                    SELECT old_id, 'U' || LPAD((max_user + rn)::text, 3, '0')
                    FROM (
                        SELECT "UserId" AS old_id,
                               ROW_NUMBER() OVER (ORDER BY "UserId") AS rn
                        FROM "Users"
                        WHERE "UserId" !~ '^U[0-9]+$'
                    ) src;

                    SELECT COALESCE(MAX(SUBSTRING("OrderId" FROM 2)::integer), 0)
                    INTO max_order
                    FROM "Orders"
                    WHERE "OrderId" ~ '^O[0-9]+$';

                    INSERT INTO order_id_map (old_id, new_id)
                    SELECT old_id, 'O' || LPAD((max_order + rn)::text, 3, '0')
                    FROM (
                        SELECT "OrderId" AS old_id,
                               ROW_NUMBER() OVER (ORDER BY "OrderId") AS rn
                        FROM "Orders"
                        WHERE "OrderId" !~ '^O[0-9]+$'
                    ) src;

                    SELECT COALESCE(MAX(SUBSTRING("ImageId" FROM 2)::integer), 0)
                    INTO max_image
                    FROM "BookImages"
                    WHERE "ImageId" ~ '^I[0-9]+$';

                    INSERT INTO image_id_map (old_id, new_id)
                    SELECT old_id, 'I' || LPAD((max_image + rn)::text, 3, '0')
                    FROM (
                        SELECT "ImageId" AS old_id,
                               ROW_NUMBER() OVER (ORDER BY "ImageId") AS rn
                        FROM "BookImages"
                        WHERE "ImageId" !~ '^I[0-9]+$'
                    ) src;

                    SELECT COALESCE(MAX(SUBSTRING("CartId" FROM 3)::integer), 0)
                    INTO max_cart
                    FROM "Carts"
                    WHERE "CartId" ~ '^CT[0-9]+$';

                    INSERT INTO cart_id_map (old_id, new_id)
                    SELECT old_id, 'CT' || LPAD((max_cart + rn)::text, 3, '0')
                    FROM (
                        SELECT "CartId" AS old_id,
                               ROW_NUMBER() OVER (ORDER BY "CartId") AS rn
                        FROM "Carts"
                        WHERE "CartId" !~ '^CT[0-9]+$'
                    ) src;

                    SELECT COALESCE(MAX(SUBSTRING("CartItemId" FROM 3)::integer), 0)
                    INTO max_cart_item
                    FROM "CartItems"
                    WHERE "CartItemId" ~ '^CI[0-9]+$';

                    INSERT INTO cart_item_id_map (old_id, new_id)
                    SELECT old_id, 'CI' || LPAD((max_cart_item + rn)::text, 3, '0')
                    FROM (
                        SELECT "CartItemId" AS old_id,
                               ROW_NUMBER() OVER (ORDER BY "CartItemId") AS rn
                        FROM "CartItems"
                        WHERE "CartItemId" !~ '^CI[0-9]+$'
                    ) src;

                    SELECT COALESCE(MAX(SUBSTRING("OrderItemId" FROM 3)::integer), 0)
                    INTO max_order_item
                    FROM "OrderItems"
                    WHERE "OrderItemId" ~ '^OI[0-9]+$';

                    INSERT INTO order_item_id_map (old_id, new_id)
                    SELECT old_id, 'OI' || LPAD((max_order_item + rn)::text, 3, '0')
                    FROM (
                        SELECT "OrderItemId" AS old_id,
                               ROW_NUMBER() OVER (ORDER BY "OrderItemId") AS rn
                        FROM "OrderItems"
                        WHERE "OrderItemId" !~ '^OI[0-9]+$'
                    ) src;

                    SELECT COALESCE(MAX(SUBSTRING("BannerId" FROM 3)::integer), 0)
                    INTO max_banner
                    FROM "Banners"
                    WHERE "BannerId" ~ '^BA[0-9]+$';

                    INSERT INTO banner_id_map (old_id, new_id)
                    SELECT old_id, 'BA' || LPAD((max_banner + rn)::text, 3, '0')
                    FROM (
                        SELECT "BannerId" AS old_id,
                               ROW_NUMBER() OVER (ORDER BY "BannerId") AS rn
                        FROM "Banners"
                        WHERE "BannerId" !~ '^BA[0-9]+$'
                    ) src;

                    SELECT COALESCE(MAX(SUBSTRING("ReviewId" FROM 2)::integer), 0)
                    INTO max_review
                    FROM "Reviews"
                    WHERE "ReviewId" ~ '^R[0-9]+$';

                    INSERT INTO review_id_map (old_id, new_id)
                    SELECT old_id, 'R' || LPAD((max_review + rn)::text, 3, '0')
                    FROM (
                        SELECT "ReviewId" AS old_id,
                               ROW_NUMBER() OVER (ORDER BY "ReviewId") AS rn
                        FROM "Reviews"
                        WHERE "ReviewId" !~ '^R[0-9]+$'
                    ) src;

                    SELECT COALESCE(MAX(SUBSTRING("ReplyId" FROM 3)::integer), 0)
                    INTO max_review_reply
                    FROM "ReviewReplies"
                    WHERE "ReplyId" ~ '^RR[0-9]+$';

                    INSERT INTO review_reply_id_map (old_id, new_id)
                    SELECT old_id, 'RR' || LPAD((max_review_reply + rn)::text, 3, '0')
                    FROM (
                        SELECT "ReplyId" AS old_id,
                               ROW_NUMBER() OVER (ORDER BY "ReplyId") AS rn
                        FROM "ReviewReplies"
                        WHERE "ReplyId" !~ '^RR[0-9]+$'
                    ) src;

                    UPDATE "Orders" o
                    SET "UserId" = m.new_id
                    FROM user_id_map m
                    WHERE o."UserId" = m.old_id;

                    UPDATE "Carts" c
                    SET "UserId" = m.new_id
                    FROM user_id_map m
                    WHERE c."UserId" = m.old_id;

                    UPDATE "Reviews" r
                    SET "UserId" = m.new_id
                    FROM user_id_map m
                    WHERE r."UserId" = m.old_id;

                    UPDATE "ReviewReplies" rr
                    SET "UserId" = m.new_id
                    FROM user_id_map m
                    WHERE rr."UserId" = m.old_id;

                    UPDATE "OrderItems" oi
                    SET "OrderId" = m.new_id
                    FROM order_id_map m
                    WHERE oi."OrderId" = m.old_id;

                    UPDATE "BookImages" bi
                    SET "BookId" = m.new_id
                    FROM book_id_map m
                    WHERE bi."BookId" = m.old_id;

                    UPDATE "CartItems" ci
                    SET "BookId" = m.new_id
                    FROM book_id_map m
                    WHERE ci."BookId" = m.old_id;

                    UPDATE "OrderItems" oi
                    SET "BookId" = m.new_id
                    FROM book_id_map m
                    WHERE oi."BookId" = m.old_id;

                    UPDATE "Reviews" r
                    SET "BookId" = m.new_id
                    FROM book_id_map m
                    WHERE r."BookId" = m.old_id;

                    UPDATE "CartItems" ci
                    SET "CartId" = m.new_id
                    FROM cart_id_map m
                    WHERE ci."CartId" = m.old_id;

                    UPDATE "ReviewReplies" rr
                    SET "ReviewId" = m.new_id
                    FROM review_id_map m
                    WHERE rr."ReviewId" = m.old_id;

                    UPDATE "Vouchers" v
                    SET "ApplicableProductId" = mapped.new_value
                    FROM (
                        SELECT v0."VoucherId",
                               string_agg(COALESCE(m.new_id, NULLIF(BTRIM(p.part), '')), ',' ORDER BY p.ordinality) AS new_value
                        FROM "Vouchers" v0
                        CROSS JOIN LATERAL UNNEST(string_to_array(COALESCE(v0."ApplicableProductId", ''), ',')) WITH ORDINALITY AS p(part, ordinality)
                        LEFT JOIN book_id_map m ON m.old_id = BTRIM(p.part)
                        WHERE COALESCE(v0."ApplicableProductId", '') <> ''
                        GROUP BY v0."VoucherId"
                    ) mapped
                    WHERE v."VoucherId" = mapped."VoucherId";

                    UPDATE "Users" u
                    SET "UserId" = m.new_id
                    FROM user_id_map m
                    WHERE u."UserId" = m.old_id;

                    UPDATE "Orders" o
                    SET "OrderId" = m.new_id
                    FROM order_id_map m
                    WHERE o."OrderId" = m.old_id;

                    UPDATE "BookImages" bi
                    SET "ImageId" = m.new_id
                    FROM image_id_map m
                    WHERE bi."ImageId" = m.old_id;

                    UPDATE "Carts" c
                    SET "CartId" = m.new_id
                    FROM cart_id_map m
                    WHERE c."CartId" = m.old_id;

                    UPDATE "CartItems" ci
                    SET "CartItemId" = m.new_id
                    FROM cart_item_id_map m
                    WHERE ci."CartItemId" = m.old_id;

                    UPDATE "OrderItems" oi
                    SET "OrderItemId" = m.new_id
                    FROM order_item_id_map m
                    WHERE oi."OrderItemId" = m.old_id;

                    UPDATE "Banners" b
                    SET "BannerId" = m.new_id
                    FROM banner_id_map m
                    WHERE b."BannerId" = m.old_id;

                    UPDATE "Books" b
                    SET "BookId" = m.new_id
                    FROM book_id_map m
                    WHERE b."BookId" = m.old_id;

                    UPDATE "Reviews" r
                    SET "ReviewId" = m.new_id
                    FROM review_id_map m
                    WHERE r."ReviewId" = m.old_id;

                    UPDATE "ReviewReplies" rr
                    SET "ReplyId" = m.new_id
                    FROM review_reply_id_map m
                    WHERE rr."ReplyId" = m.old_id;

                    SELECT COALESCE(MAX(SUBSTRING("BookId" FROM 2)::integer), 0)
                    INTO max_book
                    FROM "Books"
                    WHERE "BookId" ~ '^B[0-9]+$';
                    PERFORM setval('book_id_seq', GREATEST(max_book, 1), max_book > 0);

                    SELECT COALESCE(MAX(SUBSTRING("UserId" FROM 2)::integer), 0)
                    INTO max_user
                    FROM "Users"
                    WHERE "UserId" ~ '^U[0-9]+$';
                    PERFORM setval('user_id_seq', GREATEST(max_user, 1), max_user > 0);

                    SELECT COALESCE(MAX(SUBSTRING("OrderId" FROM 2)::integer), 0)
                    INTO max_order
                    FROM "Orders"
                    WHERE "OrderId" ~ '^O[0-9]+$';
                    PERFORM setval('order_id_seq', GREATEST(max_order, 1), max_order > 0);

                    SELECT COALESCE(MAX(SUBSTRING("ImageId" FROM 2)::integer), 0)
                    INTO max_image
                    FROM "BookImages"
                    WHERE "ImageId" ~ '^I[0-9]+$';
                    PERFORM setval('image_id_seq', GREATEST(max_image, 1), max_image > 0);

                    SELECT COALESCE(MAX(SUBSTRING("CartId" FROM 3)::integer), 0)
                    INTO max_cart
                    FROM "Carts"
                    WHERE "CartId" ~ '^CT[0-9]+$';
                    PERFORM setval('cart_id_seq', GREATEST(max_cart, 1), max_cart > 0);

                    SELECT COALESCE(MAX(SUBSTRING("CartItemId" FROM 3)::integer), 0)
                    INTO max_cart_item
                    FROM "CartItems"
                    WHERE "CartItemId" ~ '^CI[0-9]+$';
                    PERFORM setval('cart_item_id_seq', GREATEST(max_cart_item, 1), max_cart_item > 0);

                    SELECT COALESCE(MAX(SUBSTRING("OrderItemId" FROM 3)::integer), 0)
                    INTO max_order_item
                    FROM "OrderItems"
                    WHERE "OrderItemId" ~ '^OI[0-9]+$';
                    PERFORM setval('order_item_id_seq', GREATEST(max_order_item, 1), max_order_item > 0);

                    SELECT COALESCE(MAX(SUBSTRING("BannerId" FROM 3)::integer), 0)
                    INTO max_banner
                    FROM "Banners"
                    WHERE "BannerId" ~ '^BA[0-9]+$';
                    PERFORM setval('banner_id_seq', GREATEST(max_banner, 1), max_banner > 0);

                    SELECT COALESCE(MAX(SUBSTRING("ReviewId" FROM 2)::integer), 0)
                    INTO max_review
                    FROM "Reviews"
                    WHERE "ReviewId" ~ '^R[0-9]+$';
                    PERFORM setval('review_id_seq', GREATEST(max_review, 1), max_review > 0);

                    SELECT COALESCE(MAX(SUBSTRING("ReplyId" FROM 3)::integer), 0)
                    INTO max_review_reply
                    FROM "ReviewReplies"
                    WHERE "ReplyId" ~ '^RR[0-9]+$';
                    PERFORM setval('review_reply_id_seq', GREATEST(max_review_reply, 1), max_review_reply > 0);
                END
                $$;
                """);

            migrationBuilder.AddForeignKey(
                name: "FK_BookImages_Books_BookId",
                table: "BookImages",
                column: "BookId",
                principalTable: "Books",
                principalColumn: "BookId",
                onDelete: ReferentialAction.Cascade);

            migrationBuilder.AddForeignKey(
                name: "FK_Carts_Users_UserId",
                table: "Carts",
                column: "UserId",
                principalTable: "Users",
                principalColumn: "UserId",
                onDelete: ReferentialAction.Cascade);

            migrationBuilder.AddForeignKey(
                name: "FK_CartItems_Books_BookId",
                table: "CartItems",
                column: "BookId",
                principalTable: "Books",
                principalColumn: "BookId",
                onDelete: ReferentialAction.Cascade);

            migrationBuilder.AddForeignKey(
                name: "FK_CartItems_Carts_CartId",
                table: "CartItems",
                column: "CartId",
                principalTable: "Carts",
                principalColumn: "CartId",
                onDelete: ReferentialAction.Cascade);

            migrationBuilder.AddForeignKey(
                name: "FK_Orders_Users_UserId",
                table: "Orders",
                column: "UserId",
                principalTable: "Users",
                principalColumn: "UserId",
                onDelete: ReferentialAction.Cascade);

            migrationBuilder.AddForeignKey(
                name: "FK_OrderItems_Books_BookId",
                table: "OrderItems",
                column: "BookId",
                principalTable: "Books",
                principalColumn: "BookId",
                onDelete: ReferentialAction.Cascade);

            migrationBuilder.AddForeignKey(
                name: "FK_OrderItems_Orders_OrderId",
                table: "OrderItems",
                column: "OrderId",
                principalTable: "Orders",
                principalColumn: "OrderId",
                onDelete: ReferentialAction.Cascade);

            migrationBuilder.AddForeignKey(
                name: "FK_Reviews_Books_BookId",
                table: "Reviews",
                column: "BookId",
                principalTable: "Books",
                principalColumn: "BookId",
                onDelete: ReferentialAction.Cascade);

            migrationBuilder.AddForeignKey(
                name: "FK_Reviews_Users_UserId",
                table: "Reviews",
                column: "UserId",
                principalTable: "Users",
                principalColumn: "UserId",
                onDelete: ReferentialAction.Cascade);

            migrationBuilder.AddForeignKey(
                name: "FK_ReviewReplies_Reviews_ReviewId",
                table: "ReviewReplies",
                column: "ReviewId",
                principalTable: "Reviews",
                principalColumn: "ReviewId",
                onDelete: ReferentialAction.Cascade);

            migrationBuilder.AddForeignKey(
                name: "FK_ReviewReplies_Users_UserId",
                table: "ReviewReplies",
                column: "UserId",
                principalTable: "Users",
                principalColumn: "UserId",
                onDelete: ReferentialAction.Cascade);
        }

        /// <inheritdoc />
        protected override void Down(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.DropSequence(
                name: "banner_id_seq");

            migrationBuilder.DropSequence(
                name: "cart_id_seq");

            migrationBuilder.DropSequence(
                name: "cart_item_id_seq");

            migrationBuilder.DropSequence(
                name: "image_id_seq");

            migrationBuilder.DropSequence(
                name: "order_id_seq");

            migrationBuilder.DropSequence(
                name: "order_item_id_seq");

            migrationBuilder.DropSequence(
                name: "review_id_seq");

            migrationBuilder.DropSequence(
                name: "review_reply_id_seq");

            migrationBuilder.DropSequence(
                name: "user_id_seq");
        }
    }
}
