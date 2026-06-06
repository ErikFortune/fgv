[**@fgv Monorepo API Documentation**](../../../../../README.md)

***

[@fgv Monorepo API Documentation](../../../../../README.md) / [@fgv/ts-res-ui-components](../../../README.md) / [ResolutionTools](../README.md) / createResolverWithContext

# Function: createResolverWithContext()

> **createResolverWithContext**(`processedResources`, `contextValues`, `options`): [`Result`](../../../type-aliases/Result.md)\<[`ResourceResolver`](https://github.com/ErikFortune/fgv/tree/main/libraries/ts-res/docs)\>

Create a resolver with context for resource resolution.

Creates a fully configured ResourceResolver with the specified context values
and options. The resolver can be used to resolve resources based on the provided
qualification context, with optional caching and debugging features.

## Parameters

| Parameter | Type | Description |
| ------ | ------ | ------ |
| `processedResources` | [`IProcessedResources`](../../ResourceTools/interfaces/IProcessedResources.md) | The processed resource system containing all resources and configuration |
| `contextValues` | `Record`\<`string`, `string` \| `undefined`\> | Context values for qualification (e.g., language, region, platform) |
| `options` | [`IResolutionOptions`](../interfaces/IResolutionOptions.md) | Configuration options for resolution behavior |

## Returns

[`Result`](../../../type-aliases/Result.md)\<[`ResourceResolver`](https://github.com/ErikFortune/fgv/tree/main/libraries/ts-res/docs)\>

A Result containing the configured ResourceResolver or an error message

## Examples

```typescript
import { ResolutionTools } from '@fgv/ts-res-ui-components';

// Basic resolver creation for web platform
const webResolver = ResolutionTools.createResolverWithContext(
  processedResources,
  {
    language: 'en-US',
    platform: 'web',
    region: 'US'
  }
);

if (webResolver.isSuccess()) {
  const resolver = webResolver.value;
  // Use resolver to resolve resources...
}
```

```typescript
// Resolver with caching for performance-critical scenarios
const performanceResolver = ResolutionTools.createResolverWithContext(
  processedResources,
  {
    language: 'fr-CA',
    platform: 'mobile',
    deviceType: 'tablet'
  },
  { enableCaching: true }
);
```

```typescript
// Resolver with debugging for troubleshooting resolution issues
const debugResolver = ResolutionTools.createResolverWithContext(
  processedResources,
  {
    language: 'es-MX',
    region: 'MX',
    platform: 'desktop'
  },
  { enableDebugLogging: true }
).onSuccess((resolver) => {
  // Debug output will show context creation and resolver setup
  console.log('Resolver created with debug logging enabled');
  return succeed(resolver);
});
```
