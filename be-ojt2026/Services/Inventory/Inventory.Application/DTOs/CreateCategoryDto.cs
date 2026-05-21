using System;
using System.Collections.Generic;
using System.Linq;
using System.Text;
using System.Threading.Tasks;

namespace Inventory.Application.DTOs
{
    public class CreateCategoryDto
    {
        public string Name { get; set; } = null!;
        public int? ParentId { get; set; } = null;
    }
}
