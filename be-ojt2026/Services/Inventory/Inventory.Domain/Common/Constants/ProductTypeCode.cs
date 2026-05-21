namespace Inventory.Domain.Common.Constants;

public static class ProductTypeCode
{
    public const string Raw = "Nguyên Liệu Thô";
    public const string Equipment = "Thiết Bị";
    public const string Packaging = "Bao Bì";

    public static readonly string[] AllowedTypes = { Raw, Equipment, Packaging };

    private static readonly Dictionary<string, string> TypeToCode = new(StringComparer.OrdinalIgnoreCase)
    {
        { Raw, "RAW" },
        { Equipment, "EQP" },
        { Packaging, "PKG" }
    };

    public static string? GetCode(string? typeName)
    {
        if (string.IsNullOrWhiteSpace(typeName)) return null;
        return TypeToCode.TryGetValue(typeName.Trim(), out var code) ? code : null;
    }

    public static bool IsValid(string? type)
    {
        if (string.IsNullOrWhiteSpace(type)) return false;
        return AllowedTypes.Any(t => t.Equals(type.Trim(), StringComparison.OrdinalIgnoreCase));
    }
}
