[**@fgv Monorepo API Documentation**](../../../../../README.md)

***

[@fgv Monorepo API Documentation](../../../../../README.md) / [@fgv/ts-res-ui-components](../../../README.md) / [ResolutionTools](../README.md) / QualifierContextControl

# Variable: QualifierContextControl

> `const` **QualifierContextControl**: `React.FC`\<`IQualifierContextControlProps`\>

A control component for managing individual qualifier context values.

QualifierContextControl provides an interface for setting and modifying qualifier values
used in resource resolution context. It can optionally suggest values based on available
resources and supports both manual input and selection from predefined options.

## Examples

```tsx
import { ResolutionTools } from '@fgv/ts-res-ui-components';

function QualifierSettings() {
  const [context, setContext] = useState<Record<string, string | undefined>>({
    language: 'en-US',
    platform: undefined
  });

  const handleQualifierChange = (name: string, value: string | undefined) => {
    setContext(prev => ({ ...prev, [name]: value }));
  };

  return (
    <div>
      <ResolutionTools.QualifierContextControl
        qualifierName="language"
        value={context.language}
        onChange={handleQualifierChange}
        placeholder="Select language..."
      />
      <ResolutionTools.QualifierContextControl
        qualifierName="platform"
        value={context.platform}
        onChange={handleQualifierChange}
        placeholder="Select platform..."
      />
    </div>
  );
}
```

```tsx
// Using with processed resources for value suggestions
import { ResolutionTools, ResourceTools } from '@fgv/ts-res-ui-components';

function SmartQualifierControl() {
  const { state } = ResourceTools.useResourceData();
  const [qualifierValue, setQualifierValue] = useState<string | undefined>();

  return (
    <ResolutionTools.QualifierContextControl
      qualifierName="region"
      value={qualifierValue}
      onChange={(name, value) => setQualifierValue(value)}
      resources={state.resources}
      placeholder="Auto-suggested regions..."
      className="w-full"
    />
  );
}
```

```tsx
// Using with host-managed values and custom options
import { ResolutionTools } from '@fgv/ts-res-ui-components';

function HostControlledQualifier() {
  return (
    <ResolutionTools.QualifierContextControl
      qualifierName="platform"
      value={undefined} // Ignored when hostValue is set
      onChange={() => {}} // Called only when editable
      options={{
        editable: false,
        hostValue: 'web',
        showHostValue: true,
        placeholder: 'Platform controlled by application',
        className: 'border-blue-300'
      }}
    />
  );
}
```

```tsx
// Using for selective visibility and editability
function ConditionalQualifierControls() {
  const [userRole, setUserRole] = useState<'admin' | 'user'>('user');

  return (
    <div>
      <ResolutionTools.QualifierContextControl
        qualifierName="environment"
        value={envValue}
        onChange={handleEnvChange}
        options={{
          visible: userRole === 'admin', // Only visible to admins
          editable: true,
          placeholder: 'Select environment...'
        }}
      />
      <ResolutionTools.QualifierContextControl
        qualifierName="language"
        value={langValue}
        onChange={handleLangChange}
        options={{
          visible: true,
          editable: userRole === 'admin', // Only editable by admins
          placeholder: userRole === 'admin' ? 'Select language...' : 'Language locked'
        }}
      />
    </div>
  );
}
```
