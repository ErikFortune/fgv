[**@fgv Monorepo API Documentation**](../../../README.md)

***

[@fgv Monorepo API Documentation](../../../README.md) / [@fgv/ts-app-shell](../README.md) / IUrlSyncConfig

# Interface: IUrlSyncConfig\<TMode, TTab\>

Configuration for the URL sync hook.
Provides the validation tables and default values needed to
parse and validate URL hash segments.

## Type Parameters

| Type Parameter |
| ------ |
| `TMode` *extends* `string` |
| `TTab` *extends* `string` |

## Properties

| Property | Modifier | Type | Description |
| ------ | ------ | ------ | ------ |
| <a id="defaulttabs"></a> `defaultTabs` | `readonly` | `Record`\<`TMode`, `TTab`\> | Default tab for each mode (used when hash has a valid mode but no valid tab) |
| <a id="validmodes"></a> `validModes` | `readonly` | readonly `TMode`[] | All valid mode identifiers |
| <a id="validtabs"></a> `validTabs` | `readonly` | `Record`\<`TMode`, `ReadonlyArray`\<`TTab`\>\> | Valid tabs per mode |
