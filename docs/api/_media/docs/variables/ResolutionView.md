[Home](../README.md) > ResolutionView

# Variable: ResolutionView

ResolutionView component for resource resolution testing and editing.

Provides a comprehensive interface for testing resource resolution with different
qualifier contexts, viewing resolution results, and editing resource values with
custom editors. Supports real-time resolution testing and conflict detection.

**Key Features:**
- **Context management**: Set and update resolution context (qualifier values)
- **Real-time resolution**: See how resources resolve with current context
- **Resource editing**: Edit resource values with custom type-specific editors
- **Conflict detection**: Detect when edits would conflict with existing resources
- **Preview mode**: See how edits affect resolution without committing changes
- **Custom editors**: Support for type-specific resource editors via factory pattern
- **Fallback editing**: JSON editor fallback when custom editors aren't available

## Type

`React.FC<IResolutionViewProps>`
