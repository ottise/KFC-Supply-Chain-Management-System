using System.Globalization;
using System.Text;

namespace BuildingBlocks.Utils;

/// <summary>
/// Utility class for normalizing text to support Vietnamese search (diacritic-insensitive).
/// </summary>
public static class TextNormalizer
{
    /// <summary>
    /// Normalizes text for search by:
    /// - Converting to lowercase
    /// - Removing diacritics (Vietnamese accent marks)
    /// - Converting 'đ' to 'd'
    /// - Trimming whitespace
    /// </summary>
    /// <param name="value">The string to normalize</param>
    /// <returns>Normalized string suitable for comparison</returns>
    public static string NormalizeForSearch(string? value)
    {
        if (string.IsNullOrWhiteSpace(value))
            return string.Empty;

        var normalized = value.Trim().ToLowerInvariant().Normalize(NormalizationForm.FormD);
        var stringBuilder = new StringBuilder();

        foreach (var c in normalized)
        {
            var unicodeCategory = CharUnicodeInfo.GetUnicodeCategory(c);
            if (unicodeCategory != UnicodeCategory.NonSpacingMark)
            {
                // Convert 'đ' to 'd' for Vietnamese search
                stringBuilder.Append(c == 'đ' ? 'd' : c);
            }
        }

        return stringBuilder.ToString().Normalize(NormalizationForm.FormC);
    }

    /// <summary>
    /// Checks if a value contains a search term using normalized comparison.
    /// Both value and searchTerm are normalized before comparison.
    /// </summary>
    /// <param name="value">The string to search in</param>
    /// <param name="searchTerm">The term to search for</param>
    /// <returns>True if normalized value contains normalized search term</returns>
    public static bool ContainsNormalized(string? value, string? searchTerm)
    {
        if (string.IsNullOrWhiteSpace(searchTerm))
            return true;
        
        if (string.IsNullOrWhiteSpace(value))
            return false;

        var normalizedValue = NormalizeForSearch(value);
        var normalizedSearch = NormalizeForSearch(searchTerm);

        return normalizedValue.Contains(normalizedSearch, StringComparison.Ordinal);
    }
}
