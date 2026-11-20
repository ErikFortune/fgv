[Home](../../README.md) > [ResolutionTools](../README.md) > resolveResourceDetailed

# Function: resolveResourceDetailed

Resolve a resource and create detailed resolution result with comprehensive analysis.

Performs complete resource resolution including best candidate selection, all candidate
analysis, composed value resolution, and detailed condition evaluation for each candidate.
This provides the most comprehensive view of how resource resolution works for a given
resource and context.

## Signature

```typescript
function resolveResourceDetailed(resolver: ResourceResolver, resourceId: string, processedResources: IProcessedResources, options: IResolutionOptions): Result<IResolutionResult<unknown, JsonValue>>
```
