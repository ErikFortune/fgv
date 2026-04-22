[**@fgv Monorepo API Documentation**](../../../../../README.md)

***

[@fgv Monorepo API Documentation](../../../../../README.md) / [@fgv/ts-res-ui-components](../../../README.md) / [PickerTools](../README.md) / ResourcePickerOptionsControl

# Variable: ResourcePickerOptionsControl

> `const` **ResourcePickerOptionsControl**: `React.FC`\<[`IResourcePickerOptionsControlProps`](../interfaces/IResourcePickerOptionsControlProps.md)\>

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
