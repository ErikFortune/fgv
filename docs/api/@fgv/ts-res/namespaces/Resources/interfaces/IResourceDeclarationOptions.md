[**@fgv Monorepo API Documentation**](../../../../../README.md)

***

[@fgv Monorepo API Documentation](../../../../../README.md) / [@fgv/ts-res](../../../README.md) / [Resources](../README.md) / IResourceDeclarationOptions

# Interface: IResourceDeclarationOptions

Options for resource declaration operations with strongly-typed context filtering.
Extends the base IDeclarationOptions with proper type safety for context filtering.

## Example

```typescript
// Preferred Result pattern with onSuccess chaining
resourceManager.validateContext({ language: 'en' })
  .onSuccess((validatedContext) => {
    return resourceManager.clone({ filterForContext: validatedContext });
  })
  .onSuccess((clonedManager) => {
    return clonedManager.getResourceCollectionDecl();
  })
  .onFailure((error) => {
    console.error('Failed to create filtered clone:', error);
  });
```

## Extends

- [`IDeclarationOptions`](../../ResourceJson/namespaces/Helpers/interfaces/IDeclarationOptions.md)

## Extended by

- [`IResourceManagerCloneOptions`](IResourceManagerCloneOptions.md)

## Properties

| Property | Type | Default value | Description |
| ------ | ------ | ------ | ------ |
| <a id="filterforcontext"></a> `filterForContext?` | [`IValidatedContextDecl`](../../Context/type-aliases/IValidatedContextDecl.md) | `undefined` | If provided, filters resource candidates to only include those that can match the specified validated context. This provides strongly-typed context filtering. Use resourceManager.validateContext() to create a validated context from an IContextDecl. |
| <a id="includemetadata"></a> `includeMetadata?` | `boolean` | `false` | Whether to include metadata in compiled outputs. Metadata includes human-readable information like semantic keys that can be useful for debugging or tooling. |
| <a id="normalized"></a> `normalized?` | `boolean` | `undefined` | If `true`, the output will be normalized using hash-based ordering for consistent structure. If omitted or `false`, no normalization will be applied. Defaults to `false`. |
| <a id="reducequalifiers"></a> `reduceQualifiers?` | `boolean` | `false` | If true, reduces the qualifiers of the resource candidates by removing qualifiers that are made irrelevant by the filterForContext. |
| <a id="showdefaults"></a> `showDefaults?` | `boolean` | `undefined` | If `true`, properties with default values will be included in the output. If omitted or `false`, properties with default values will be omitted. |
