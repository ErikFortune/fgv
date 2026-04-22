[**@fgv Monorepo API Documentation**](../../../../../README.md)

***

[@fgv Monorepo API Documentation](../../../../../README.md) / [@fgv/ts-res-ui-components](../../../README.md) / [ResolutionTools](../README.md) / getAvailableQualifiers

# Function: getAvailableQualifiers()

> **getAvailableQualifiers**(`processedResources`): `string`[]

Get available qualifiers from processed resources.

Extracts all qualifier names from the compiled resource collection, providing
a list of qualification dimensions available for context setting and resource
resolution. This is useful for building dynamic UI controls and validation.

## Parameters

| Parameter | Type | Description |
| ------ | ------ | ------ |
| `processedResources` | [`IProcessedResources`](../../ResourceTools/interfaces/IProcessedResources.md) | The processed resource system |

## Returns

`string`[]

Array of qualifier names available in the system

## Examples

```typescript
import { ResolutionTools } from '@fgv/ts-res-ui-components';

// Get all available qualifiers for UI generation
const availableQualifiers = ResolutionTools.getAvailableQualifiers(processedResources);
console.log('Available qualifiers:', availableQualifiers);
// Output: ['language', 'region', 'platform', 'deviceType']

// Use to build dynamic context controls
const contextControls = availableQualifiers.map(qualifierName => (
  <QualifierContextControl
    key={qualifierName}
    qualifierName={qualifierName}
    value={context[qualifierName]}
    onChange={handleContextChange}
  />
));
```

```typescript
// Validate context against available qualifiers
function validateResolutionContext(
  context: Record<string, string>,
  processedResources: IProcessedResources
): string[] {
  const availableQualifiers = ResolutionTools.getAvailableQualifiers(processedResources);
  const errors: string[] = [];

  // Check for unknown qualifiers
  Object.keys(context).forEach(key => {
    if (!availableQualifiers.includes(key)) {
      errors.push(`Unknown qualifier: ${key}`);
    }
  });

  return errors;
}
```

```typescript
// Build qualifier documentation
function generateQualifierDocs(processedResources: IProcessedResources) {
  const qualifiers = ResolutionTools.getAvailableQualifiers(processedResources);

  return qualifiers.map(name => {
    const qualifier = processedResources.system.qualifiers.validating.get(name).orThrow();
    return {
      name,
      type: qualifier.type.systemType,
      description: `Controls ${name} resolution behavior`
    };
  });
}
```
