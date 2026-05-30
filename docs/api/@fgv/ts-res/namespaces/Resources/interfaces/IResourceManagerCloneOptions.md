[**@fgv Monorepo API Documentation**](../../../../../README.md)

***

[@fgv Monorepo API Documentation](../../../../../README.md) / [@fgv/ts-res](../../../README.md) / [Resources](../README.md) / IResourceManagerCloneOptions

# Interface: IResourceManagerCloneOptions

Options for ResourceManagerBuilder clone operations.
Extends IDeclarationOptions to include support for applying edits when cloning.

## Extends

- [`IResourceDeclarationOptions`](IResourceDeclarationOptions.md)

## Properties

| Property | Modifier | Type | Default value | Description |
| ------ | ------ | ------ | ------ | ------ |
| <a id="candidates"></a> `candidates?` | `readonly` | readonly [`ILooseResourceCandidateDecl`](../../ResourceJson/namespaces/Json/interfaces/ILooseResourceCandidateDecl.md)[] | `undefined` | Optional array of loose condition declarations to be applied as edits during the clone operation. These conditions can modify or extend the resource candidates in the cloned manager. |
| <a id="filterforcontext"></a> `filterForContext?` | `public` | [`IValidatedContextDecl`](../../Context/type-aliases/IValidatedContextDecl.md) | `undefined` | If provided, filters resource candidates to only include those that can match the specified validated context. This provides strongly-typed context filtering. Use resourceManager.validateContext() to create a validated context from an IContextDecl. |
| <a id="includemetadata"></a> `includeMetadata?` | `public` | `boolean` | `false` | Whether to include metadata in compiled outputs. Metadata includes human-readable information like semantic keys that can be useful for debugging or tooling. |
| <a id="normalized"></a> `normalized?` | `public` | `boolean` | `undefined` | If `true`, the output will be normalized using hash-based ordering for consistent structure. If omitted or `false`, no normalization will be applied. Defaults to `false`. |
| <a id="qualifiers"></a> `qualifiers?` | `readonly` | [`IReadOnlyQualifierCollector`](../../Qualifiers/interfaces/IReadOnlyQualifierCollector.md) | `undefined` | Optional qualifier collector to use for the cloned manager. If not provided, uses the same qualifiers as the original manager. This allows creating clones with different qualifier configurations. |
| <a id="reducequalifiers"></a> `reduceQualifiers?` | `public` | `boolean` | `false` | If true, reduces the qualifiers of the resource candidates by removing qualifiers that are made irrelevant by the filterForContext. |
| <a id="resourcetypes"></a> `resourceTypes?` | `readonly` | [`ReadOnlyResourceTypeCollector`](../../ResourceTypes/type-aliases/ReadOnlyResourceTypeCollector.md) | `undefined` | Optional resource type collector to use for the cloned manager. If not provided, uses the same resource types as the original manager. This allows creating clones with different resource type configurations. |
| <a id="showdefaults"></a> `showDefaults?` | `public` | `boolean` | `undefined` | If `true`, properties with default values will be included in the output. If omitted or `false`, properties with default values will be omitted. |
