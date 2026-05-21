namespace Inventory.Domain.Common.Constants;

/// <summary>
/// Danh mục đơn vị đo lường (UOM).
/// Mỗi category có đúng một base unit; các UOM khác quy đổi về base unit.
/// </summary>
public enum UomCategory
{
    Count,
    Weight,
    Volume,
    Length,
    Area
}
