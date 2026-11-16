[**@fgv Monorepo API Documentation**](../../../../../README.md)

***

[@fgv Monorepo API Documentation](../../../../../README.md) / [@fgv/ts-extras](../../../README.md) / [AiAssist](../README.md) / aiClientToolConfig

# Variable: aiClientToolConfig

> `const` **aiClientToolConfig**: [`Converter`](https://github.com/ErikFortune/fgv/tree/main/libraries/ts-utils/docs)\<[`IAiClientToolConfig`](../interfaces/IAiClientToolConfig.md)\>

Converter for [AiAssist.IAiClientToolConfig](../interfaces/IAiClientToolConfig.md). Validates the wrapper shape: `type`,
`name`, `description`, the presence of a usable `parametersSchema`, and optional
host-advisory `annotations`.
Does not inspect the inner JSON Schema structure — `JsonSchema.object(...)` already
guarantees the schema is valid.
