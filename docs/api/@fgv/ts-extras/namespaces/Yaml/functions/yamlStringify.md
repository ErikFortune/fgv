[**@fgv Monorepo API Documentation**](../../../../../README.md)

***

[@fgv Monorepo API Documentation](../../../../../README.md) / [@fgv/ts-extras](../../../README.md) / [Yaml](../README.md) / yamlStringify

# Function: yamlStringify()

> **yamlStringify**(`value`, `options?`): [`Result`](../../../../ts-res-ui-components/type-aliases/Result.md)\<`string`\>

Serializes a value to a YAML string.

## Parameters

| Parameter | Type | Description |
| ------ | ------ | ------ |
| `value` | `unknown` | The value to serialize (must be an object or array) |
| `options?` | [`IYamlSerializeOptions`](../interfaces/IYamlSerializeOptions.md) | Optional serialization options |

## Returns

[`Result`](../../../../ts-res-ui-components/type-aliases/Result.md)\<`string`\>

`Success` with YAML string, or `Failure` with error
