using Npgsql;
var cs = "Host=localhost;Database=BookStoreDb;Username=postgres;Password=123456";
await using var conn = new NpgsqlConnection(cs);
await conn.OpenAsync();
await using var cmd = new NpgsqlCommand("select \"Code\", \"DiscountType\", \"DiscountAmount\", \"MinOrderValue\", \"Quantity\", \"UsedCount\", \"IsActive\", \"IsHidden\", coalesce(\"ApplicableProductId\",''), coalesce(\"ApplicableCategoryId\",'') from \"Vouchers\" order by \"Code\"", conn);
await using var r = await cmd.ExecuteReaderAsync();
while (await r.ReadAsync())
  Console.WriteLine($"{r.GetString(0),-14} type={r.GetString(1),-10} amt={r.GetDecimal(2),8} min={r.GetDecimal(3),8} qty={r.GetInt32(4),4} used={r.GetInt32(5),3} active={r.GetBoolean(6),5} hidden={r.GetBoolean(7),5} products='{r.GetString(8)}' category='{r.GetString(9)}'");
