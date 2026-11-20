[Home](../README.md) > createResolverWithContext

# Function: createResolverWithContext

Create a resolver with context for resource resolution.

Creates a fully configured ResourceResolver with the specified context values
and options. The resolver can be used to resolve resources based on the provided
qualification context, with optional caching and debugging features.

## Signature

```typescript
function createResolverWithContext(processedResources: IProcessedResources, contextValues: Record<string, string | undefined>, options: IResolutionOptions): Result<ResourceResolver>
```
