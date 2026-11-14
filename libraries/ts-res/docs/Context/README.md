[Home](../README.md) > Context

# Namespace: Context

## Classes

<table><thead><tr><th>

Name

</th><th>

Description

</th></tr></thead>
<tbody>
<tr><td>

[ContextQualifierProvider](./classes/ContextQualifierProvider.md)

</td><td>

Abstract base class for implementing context qualifier providers.

</td></tr>
<tr><td>

[ReadOnlyContextQualifierProviderValidator](./classes/ReadOnlyContextQualifierProviderValidator.md)

</td><td>

A validator for read-only context qualifier providers that accepts string inputs
and converts them to strongly-typed values before calling the wrapped provider.

</td></tr>
<tr><td>

[MutableContextQualifierProviderValidator](./classes/MutableContextQualifierProviderValidator.md)

</td><td>

A validator for mutable context qualifier providers that accepts string inputs
and converts them to strongly-typed values before calling the wrapped provider.

</td></tr>
</tbody></table>

## Interfaces

<table><thead><tr><th>

Name

</th><th>

Description

</th></tr></thead>
<tbody>
<tr><td>

[IContextQualifierProviderBase](./interfaces/IContextQualifierProviderBase.md)

</td><td>

Base interface for providing qualifier values in an optimized runtime context.

</td></tr>
<tr><td>

[IReadOnlyContextQualifierProvider](./interfaces/IReadOnlyContextQualifierProvider.md)

</td><td>

Read-only interface for providing qualifier values in an optimized runtime context.

</td></tr>
<tr><td>

[IMutableContextQualifierProvider](./interfaces/IMutableContextQualifierProvider.md)

</td><td>

Mutable interface for providing qualifier values in an optimized runtime context.

</td></tr>
<tr><td>

[IContextQualifierProviderValidatorBase](./interfaces/IContextQualifierProviderValidatorBase.md)

</td><td>

Base interface for shared operations between read-only and mutable context qualifier provider validators.

</td></tr>
<tr><td>

[IReadOnlyContextQualifierProviderValidator](./interfaces/IReadOnlyContextQualifierProviderValidator.md)

</td><td>

A read-only interface for validators wrapping read-only context qualifier providers.

</td></tr>
<tr><td>

[IMutableContextQualifierProviderValidator](./interfaces/IMutableContextQualifierProviderValidator.md)

</td><td>

A mutable interface for validators wrapping mutable context qualifier providers.

</td></tr>
<tr><td>

[IReadOnlyContextQualifierProviderValidatorCreateParams](./interfaces/IReadOnlyContextQualifierProviderValidatorCreateParams.md)

</td><td>

Parameters for constructing a read-only context qualifier provider validator.

</td></tr>
<tr><td>

[IMutableContextQualifierProviderValidatorCreateParams](./interfaces/IMutableContextQualifierProviderValidatorCreateParams.md)

</td><td>

Parameters for constructing a mutable context qualifier provider validator.

</td></tr>
</tbody></table>

## Type Aliases

<table><thead><tr><th>

Name

</th><th>

Description

</th></tr></thead>
<tbody>
<tr><td>

[IContextQualifierProvider](./type-aliases/IContextQualifierProvider.md)

</td><td>

Union type for context qualifier providers that can be either read-only or mutable.

</td></tr>
<tr><td>

[IContextQualifierProviderValidatorCreateParams](./type-aliases/IContextQualifierProviderValidatorCreateParams.md)

</td><td>

Union type for validator constructor parameters.

</td></tr>
</tbody></table>
