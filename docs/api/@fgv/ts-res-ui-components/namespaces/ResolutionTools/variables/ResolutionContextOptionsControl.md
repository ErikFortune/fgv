[**@fgv Monorepo API Documentation**](../../../../../README.md)

***

[@fgv Monorepo API Documentation](../../../../../README.md) / [@fgv/ts-res-ui-components](../../../README.md) / [ResolutionTools](../README.md) / ResolutionContextOptionsControl

# Variable: ResolutionContextOptionsControl

> `const` **ResolutionContextOptionsControl**: `React.FC`\<[`IResolutionContextOptionsControlProps`](../interfaces/IResolutionContextOptionsControlProps.md)\>

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

## Example

```tsx
import { ResolutionContextOptionsControl } from '@fgv/ts-res-ui-components';

function ContextConfiguration() {
  const [contextOptions, setContextOptions] = useState<IResolutionContextOptions>({});

  return (
    <ResolutionContextOptionsControl
      options={contextOptions}
      onOptionsChange={setContextOptions}
      availableQualifiers={['language', 'platform', 'env']}
      presentation="collapsible"
      title="Context Configuration"
    />
  );
}
```
