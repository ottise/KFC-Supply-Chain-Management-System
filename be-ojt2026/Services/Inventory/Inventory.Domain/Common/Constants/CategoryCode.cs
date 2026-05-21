namespace Inventory.Domain.Common.Constants;

public static class CategoryCode
{
    private static readonly Dictionary<string, string> NameToCode = new(StringComparer.OrdinalIgnoreCase)
    {
        { "Thịt & Gia Cầm", "MEA" },
        { "Hải Sản", "SEA" },
        { "Rau Củ Quả", "VEG" },
        { "Gia Vị & Sốt", "SPI" },
        { "Đồ Uống", "BEV" },
        { "Bánh & Đồ ngọt", "BAK" },
        { "Vật Tư Vệ Sinh", "CLN" },
        { "Đồ Dùng Một Lần", "DIS" },
        { "Công Cụ Dụng Cụ", "EQU" }
    };

    public static string? GetCode(string? categoryName)
    {
        if (string.IsNullOrWhiteSpace(categoryName)) return null;
        return NameToCode.TryGetValue(categoryName.Trim(), out var code) ? code : null;
    }

    public static bool IsSupported(string? categoryName)
    {
        if (string.IsNullOrWhiteSpace(categoryName)) return false;
        return NameToCode.ContainsKey(categoryName.Trim());
    }
}
