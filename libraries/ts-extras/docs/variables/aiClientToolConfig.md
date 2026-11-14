[Home](../README.md) > aiClientToolConfig

# Variable: aiClientToolConfig

Converter for AiAssist.IAiClientToolConfig. Validates the wrapper shape: `type`,
`name`, `description`, the presence of a usable `parametersSchema`, and optional
host-advisory `annotations`.
Does not inspect the inner JSON Schema structure — `JsonSchema.object(...)` already
guarantees the schema is valid.

## Type

`Converter<IAiClientToolConfig>`
