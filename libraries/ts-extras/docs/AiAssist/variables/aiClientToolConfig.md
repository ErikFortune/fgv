[Home](../../README.md) > [AiAssist](../README.md) > aiClientToolConfig

# Variable: aiClientToolConfig

Converter for AiAssist.IAiClientToolConfig. Validates the wrapper shape: `type`,
`name`, `description`, and the presence of a usable `parametersSchema`.
Does not inspect the inner JSON Schema structure — `JsonSchema.object(...)` already
guarantees the schema is valid.

## Type

`Converter<IAiClientToolConfig>`
