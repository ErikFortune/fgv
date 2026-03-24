[**@fgv/ts-web-extras**](../README.md)

***

[@fgv/ts-web-extras](../README.md) / parseQualifierDefaults

# Function: parseQualifierDefaults()

> **parseQualifierDefaults**(`qualifierDefaults`): `Record`\<`string`, `string`[]\>

Converts qualifier defaults token to structured format
Example: "language=en-US,en-CA|territory=US" -\> { language: ["en-US", "en-CA"], territory: ["US"] }

## Parameters

| Parameter | Type |
| ------ | ------ |
| `qualifierDefaults` | `string` |

## Returns

`Record`\<`string`, `string`[]\>
