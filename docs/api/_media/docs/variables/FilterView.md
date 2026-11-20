[Home](../README.md) > FilterView

# Variable: FilterView

FilterView component for context-based resource filtering and analysis.

Provides a comprehensive interface for filtering resources based on qualifier values,
displaying filtered results with candidate count comparisons, and exporting filtered
resource collections. Supports partial context matching and qualifier reduction.

**Key Features:**
- **Context-based filtering**: Filter resources using qualifier values (language, territory, etc.)
- **Candidate analysis**: Compare original vs filtered candidate counts for each resource
- **Visual indicators**: Highlight resources with reduced candidates or warnings
- **Export functionality**: Export filtered resource collections as JSON
- **Dual resource comparison**: View original and filtered resource details side-by-side
- **Qualifier reduction**: Option to remove perfectly matching qualifiers from results

## Type

`React.FC<IFilterViewProps>`
