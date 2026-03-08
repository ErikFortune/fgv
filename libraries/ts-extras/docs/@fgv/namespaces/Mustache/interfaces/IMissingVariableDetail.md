[**@fgv/ts-extras**](../../../../README.md)

***

[@fgv/ts-extras](../../../../README.md) / [Mustache](../README.md) / IMissingVariableDetail

# Interface: IMissingVariableDetail

Details about a missing variable in context validation.

## Properties

| Property | Modifier | Type | Description |
| ------ | ------ | ------ | ------ |
| <a id="existingpath"></a> `existingPath` | `readonly` | readonly `string`[] | The parent path that exists (e.g., ['user'] if 'user' exists but 'user.profile' does not) |
| <a id="failedatsegment"></a> `failedAtSegment?` | `readonly` | `string` | The path segment where the lookup failed (e.g., for 'user.profile.name' if 'profile' is missing, this would be 'profile') |
| <a id="variable"></a> `variable` | `readonly` | [`IVariableRef`](IVariableRef.md) | The variable reference that is missing |
