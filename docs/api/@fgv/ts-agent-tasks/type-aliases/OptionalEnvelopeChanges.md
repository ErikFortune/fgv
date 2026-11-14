[**@fgv Monorepo API Documentation**](../../../README.md)

***

[@fgv Monorepo API Documentation](../../../README.md) / [@fgv/ts-agent-tasks](../README.md) / OptionalEnvelopeChanges

# Type Alias: OptionalEnvelopeChanges

> **OptionalEnvelopeChanges** = `{ readonly [K in OptionalEnvelopeField]?: ITaskEnvelope[K] }`

New values for optional envelope fields. A key that is present replaces the field; present
with `undefined`, it removes it. A key that is absent leaves the field as it was.
