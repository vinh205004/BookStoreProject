using Microsoft.EntityFrameworkCore.Migrations;

#nullable disable

namespace BookStore.API.Migrations
{
    /// <inheritdoc />
    public partial class UseSequenceBackedEntityIds : Migration
    {
        /// <inheritdoc />
        protected override void Up(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.CreateSequence<int>(
                name: "author_id_seq");

            migrationBuilder.CreateSequence<int>(
                name: "book_id_seq");

            migrationBuilder.CreateSequence<int>(
                name: "category_id_seq");

            migrationBuilder.CreateSequence<int>(
                name: "publisher_id_seq");

            migrationBuilder.CreateSequence<int>(
                name: "voucher_id_seq");

            migrationBuilder.DropForeignKey(
                name: "FK_Books_Authors_AuthorId",
                table: "Books");

            migrationBuilder.DropForeignKey(
                name: "FK_Books_Categories_CategoryId",
                table: "Books");

            migrationBuilder.DropForeignKey(
                name: "FK_Books_Publishers_PublisherId",
                table: "Books");

            migrationBuilder.DropForeignKey(
                name: "FK_BookImages_Books_BookId",
                table: "BookImages");

            migrationBuilder.DropForeignKey(
                name: "FK_CartItems_Books_BookId",
                table: "CartItems");

            migrationBuilder.DropForeignKey(
                name: "FK_OrderItems_Books_BookId",
                table: "OrderItems");

            migrationBuilder.DropForeignKey(
                name: "FK_Reviews_Books_BookId",
                table: "Reviews");

            migrationBuilder.Sql(
                """
                DO $$
                DECLARE
                    max_category integer;
                    max_author integer;
                    max_publisher integer;
                    max_book integer;
                    max_voucher integer;
                BEGIN
                    CREATE TEMP TABLE category_id_map (
                        old_id text PRIMARY KEY,
                        new_id text NOT NULL UNIQUE
                    ) ON COMMIT DROP;

                    CREATE TEMP TABLE author_id_map (
                        old_id text PRIMARY KEY,
                        new_id text NOT NULL UNIQUE
                    ) ON COMMIT DROP;

                    CREATE TEMP TABLE publisher_id_map (
                        old_id text PRIMARY KEY,
                        new_id text NOT NULL UNIQUE
                    ) ON COMMIT DROP;

                    CREATE TEMP TABLE book_id_map (
                        old_id text PRIMARY KEY,
                        new_id text NOT NULL UNIQUE
                    ) ON COMMIT DROP;

                    CREATE TEMP TABLE voucher_id_map (
                        old_id text PRIMARY KEY,
                        new_id text NOT NULL UNIQUE
                    ) ON COMMIT DROP;

                    SELECT COALESCE(MAX(SUBSTRING("CategoryId" FROM 2)::integer), 0)
                    INTO max_category
                    FROM "Categories"
                    WHERE "CategoryId" ~ '^C[0-9]+$';

                    INSERT INTO category_id_map (old_id, new_id)
                    SELECT old_id, 'C' || LPAD((max_category + rn)::text, 3, '0')
                    FROM (
                        SELECT "CategoryId" AS old_id,
                               ROW_NUMBER() OVER (ORDER BY "CategoryId") AS rn
                        FROM "Categories"
                        WHERE "CategoryId" !~ '^C[0-9]+$'
                    ) src;

                    SELECT COALESCE(MAX(SUBSTRING("AuthorId" FROM 2)::integer), 0)
                    INTO max_author
                    FROM "Authors"
                    WHERE "AuthorId" ~ '^A[0-9]+$';

                    INSERT INTO author_id_map (old_id, new_id)
                    SELECT old_id, 'A' || LPAD((max_author + rn)::text, 3, '0')
                    FROM (
                        SELECT "AuthorId" AS old_id,
                               ROW_NUMBER() OVER (ORDER BY "AuthorId") AS rn
                        FROM "Authors"
                        WHERE "AuthorId" !~ '^A[0-9]+$'
                    ) src;

                    SELECT COALESCE(MAX(SUBSTRING("PublisherId" FROM 2)::integer), 0)
                    INTO max_publisher
                    FROM "Publishers"
                    WHERE "PublisherId" ~ '^N[0-9]+$';

                    INSERT INTO publisher_id_map (old_id, new_id)
                    SELECT old_id, 'N' || LPAD((max_publisher + rn)::text, 3, '0')
                    FROM (
                        SELECT "PublisherId" AS old_id,
                               ROW_NUMBER() OVER (ORDER BY "PublisherId") AS rn
                        FROM "Publishers"
                        WHERE "PublisherId" !~ '^N[0-9]+$'
                    ) src;

                    SELECT COALESCE(MAX(SUBSTRING("BookId" FROM 2)::integer), 0)
                    INTO max_book
                    FROM "Books"
                    WHERE "BookId" ~ '^S[0-9]+$';

                    INSERT INTO book_id_map (old_id, new_id)
                    SELECT old_id, 'S' || LPAD((max_book + rn)::text, 3, '0')
                    FROM (
                        SELECT "BookId" AS old_id,
                               ROW_NUMBER() OVER (ORDER BY "BookId") AS rn
                        FROM "Books"
                        WHERE "BookId" !~ '^S[0-9]+$'
                    ) src;

                    SELECT COALESCE(MAX(SUBSTRING("VoucherId" FROM 2)::integer), 0)
                    INTO max_voucher
                    FROM "Vouchers"
                    WHERE "VoucherId" ~ '^V[0-9]+$';

                    INSERT INTO voucher_id_map (old_id, new_id)
                    SELECT old_id, 'V' || LPAD((max_voucher + rn)::text, 3, '0')
                    FROM (
                        SELECT "VoucherId" AS old_id,
                               ROW_NUMBER() OVER (ORDER BY "VoucherId") AS rn
                        FROM "Vouchers"
                        WHERE "VoucherId" !~ '^V[0-9]+$'
                    ) src;

                    UPDATE "Books" b
                    SET "AuthorId" = m.new_id
                    FROM author_id_map m
                    WHERE b."AuthorId" = m.old_id;

                    UPDATE "Books" b
                    SET "CategoryId" = m.new_id
                    FROM category_id_map m
                    WHERE b."CategoryId" = m.old_id;

                    UPDATE "Books" b
                    SET "PublisherId" = m.new_id
                    FROM publisher_id_map m
                    WHERE b."PublisherId" = m.old_id;

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

                    UPDATE "Vouchers" v
                    SET "ApplicableCategoryId" = m.new_id
                    FROM category_id_map m
                    WHERE v."ApplicableCategoryId" = m.old_id;

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

                    UPDATE "Authors" a
                    SET "AuthorId" = m.new_id
                    FROM author_id_map m
                    WHERE a."AuthorId" = m.old_id;

                    UPDATE "Categories" c
                    SET "CategoryId" = m.new_id
                    FROM category_id_map m
                    WHERE c."CategoryId" = m.old_id;

                    UPDATE "Publishers" p
                    SET "PublisherId" = m.new_id
                    FROM publisher_id_map m
                    WHERE p."PublisherId" = m.old_id;

                    UPDATE "Books" b
                    SET "BookId" = m.new_id
                    FROM book_id_map m
                    WHERE b."BookId" = m.old_id;

                    UPDATE "Vouchers" v
                    SET "VoucherId" = m.new_id
                    FROM voucher_id_map m
                    WHERE v."VoucherId" = m.old_id;

                    SELECT COALESCE(MAX(SUBSTRING("CategoryId" FROM 2)::integer), 0)
                    INTO max_category
                    FROM "Categories"
                    WHERE "CategoryId" ~ '^C[0-9]+$';
                    PERFORM setval('category_id_seq', GREATEST(max_category, 1), max_category > 0);

                    SELECT COALESCE(MAX(SUBSTRING("AuthorId" FROM 2)::integer), 0)
                    INTO max_author
                    FROM "Authors"
                    WHERE "AuthorId" ~ '^A[0-9]+$';
                    PERFORM setval('author_id_seq', GREATEST(max_author, 1), max_author > 0);

                    SELECT COALESCE(MAX(SUBSTRING("PublisherId" FROM 2)::integer), 0)
                    INTO max_publisher
                    FROM "Publishers"
                    WHERE "PublisherId" ~ '^N[0-9]+$';
                    PERFORM setval('publisher_id_seq', GREATEST(max_publisher, 1), max_publisher > 0);

                    SELECT COALESCE(MAX(SUBSTRING("BookId" FROM 2)::integer), 0)
                    INTO max_book
                    FROM "Books"
                    WHERE "BookId" ~ '^S[0-9]+$';
                    PERFORM setval('book_id_seq', GREATEST(max_book, 1), max_book > 0);

                    SELECT COALESCE(MAX(SUBSTRING("VoucherId" FROM 2)::integer), 0)
                    INTO max_voucher
                    FROM "Vouchers"
                    WHERE "VoucherId" ~ '^V[0-9]+$';
                    PERFORM setval('voucher_id_seq', GREATEST(max_voucher, 1), max_voucher > 0);
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
                name: "FK_Books_Authors_AuthorId",
                table: "Books",
                column: "AuthorId",
                principalTable: "Authors",
                principalColumn: "AuthorId",
                onDelete: ReferentialAction.Cascade);

            migrationBuilder.AddForeignKey(
                name: "FK_Books_Categories_CategoryId",
                table: "Books",
                column: "CategoryId",
                principalTable: "Categories",
                principalColumn: "CategoryId",
                onDelete: ReferentialAction.Cascade);

            migrationBuilder.AddForeignKey(
                name: "FK_Books_Publishers_PublisherId",
                table: "Books",
                column: "PublisherId",
                principalTable: "Publishers",
                principalColumn: "PublisherId",
                onDelete: ReferentialAction.Cascade);

            migrationBuilder.AddForeignKey(
                name: "FK_CartItems_Books_BookId",
                table: "CartItems",
                column: "BookId",
                principalTable: "Books",
                principalColumn: "BookId",
                onDelete: ReferentialAction.Cascade);

            migrationBuilder.AddForeignKey(
                name: "FK_OrderItems_Books_BookId",
                table: "OrderItems",
                column: "BookId",
                principalTable: "Books",
                principalColumn: "BookId",
                onDelete: ReferentialAction.Cascade);

            migrationBuilder.AddForeignKey(
                name: "FK_Reviews_Books_BookId",
                table: "Reviews",
                column: "BookId",
                principalTable: "Books",
                principalColumn: "BookId",
                onDelete: ReferentialAction.Cascade);
        }

        /// <inheritdoc />
        protected override void Down(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.DropSequence(
                name: "author_id_seq");

            migrationBuilder.DropSequence(
                name: "book_id_seq");

            migrationBuilder.DropSequence(
                name: "category_id_seq");

            migrationBuilder.DropSequence(
                name: "publisher_id_seq");

            migrationBuilder.DropSequence(
                name: "voucher_id_seq");
        }
    }
}
