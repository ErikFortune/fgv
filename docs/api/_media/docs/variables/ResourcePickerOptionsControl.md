[Home](../README.md) > ResourcePickerOptionsControl

# Variable: ResourcePickerOptionsControl

Reusable control for configuring ResourcePicker options.

Provides a clean interface for adjusting picker behavior including:
- View mode selection (list/tree)
- Search and view toggle settings
- Branch isolation configuration
- Quick path selection buttons

Can be rendered in multiple presentation modes:
- 'hidden': Not displayed (default for production)
- 'inline': Always expanded with full controls visible
- 'collapsible': Expandable/collapsible section
- 'popover': Small dropdown overlay
- 'popup': Full modal dialog

## Type

`React.FC<IResourcePickerOptionsControlProps>`
