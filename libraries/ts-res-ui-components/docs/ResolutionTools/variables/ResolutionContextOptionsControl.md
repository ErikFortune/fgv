[Home](../../README.md) > [ResolutionTools](../README.md) > ResolutionContextOptionsControl

# Variable: ResolutionContextOptionsControl

Reusable control for configuring ResolutionView context options.

Provides a clean interface for adjusting context behavior including:
- Visibility of context controls, current context display, and action buttons
- Per-qualifier options (visibility, editability, host values)
- Global defaults and appearance customization

Can be rendered in multiple presentation modes:
- 'hidden': Not displayed (default for production)
- 'inline': Always expanded with full controls visible
- 'collapsible': Expandable/collapsible section
- 'popover': Small dropdown overlay
- 'popup': Full modal dialog

## Type

`React.FC<IResolutionContextOptionsControlProps>`
