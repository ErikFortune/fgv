[**@fgv Monorepo API Documentation**](../../../../../README.md)

***

[@fgv Monorepo API Documentation](../../../../../README.md) / [@fgv/ts-res-ui-components](../../../README.md) / [ResolutionTools](../README.md) / IResolutionOptions

# Interface: IResolutionOptions

Configuration options for resource resolution operations.

ResolutionOptions provides control over performance and debugging features
during resource resolution operations. These options affect resolver creation,
resolution processing, and diagnostic output.

## Example

```typescript
import { ResolutionTools } from '@fgv/ts-res-ui-components';

// Basic resolution with default options
const basicResolver = ResolutionTools.createResolverWithContext(
  processedResources,
  { language: 'en-US', platform: 'web' }
);

// Resolution with caching enabled for performance
const cachedResolver = ResolutionTools.createResolverWithContext(
  processedResources,
  { language: 'en-US', region: 'US' },
  { enableCaching: true }
);

// Resolution with debugging for troubleshooting
const debugResolver = ResolutionTools.createResolverWithContext(
  processedResources,
  { language: 'fr-CA', platform: 'mobile' },
  { enableDebugLogging: true }
);

// Full-featured resolution with both caching and debugging
const fullResolver = ResolutionTools.createResolverWithContext(
  processedResources,
  { language: 'es-MX', region: 'MX', platform: 'desktop' },
  { enableCaching: true, enableDebugLogging: true }
);
```

## Properties

| Property | Type | Description |
| ------ | ------ | ------ |
| <a id="enablecaching"></a> `enableCaching?` | `boolean` | Enable caching for improved performance during repeated resolutions |
| <a id="enabledebuglogging"></a> `enableDebugLogging?` | `boolean` | Enable detailed console logging for debugging resolution processes |
