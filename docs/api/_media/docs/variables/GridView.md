[Home](../README.md) > GridView

# Variable: GridView

GridView component for displaying multiple resources in a tabular format.

Provides a grid-based interface for viewing and editing multiple resources
simultaneously, with configurable column mappings and shared context management.
Leverages the same state management and batch processing as ResolutionView.

**Key Features:**
- **Multi-resource display**: View multiple resources in rows with configurable columns
- **Column mapping**: Host-defined extraction of properties from resolved resources
- **Batch editing**: Edit multiple resource values with unified batch application
- **Context integration**: Same context management as ResolutionView
- **Resource filtering**: Flexible resource selection via built-in and custom selectors
- **Change management**: Leverages existing UnifiedChangeControls for batch operations

## Type

`React.FC<IGridViewProps>`
