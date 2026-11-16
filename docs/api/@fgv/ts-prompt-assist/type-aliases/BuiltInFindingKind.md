[**@fgv Monorepo API Documentation**](../../../README.md)

***

[@fgv Monorepo API Documentation](../../../README.md) / [@fgv/ts-prompt-assist](../README.md) / BuiltInFindingKind

# Type Alias: BuiltInFindingKind

> **BuiltInFindingKind** = `"max-length"` \| `"suspicious-pattern"` \| `"screening-skipped"` \| `"enforced-override-ignored"`

Built-in safeguard finding kinds the library itself emits. `'max-length'`
and `'suspicious-pattern'` describe rejections / matches; `'screening-skipped'`
and `'enforced-override-ignored'` are informational. Custom screeners may
emit additional kinds — see [SafeguardFindingKind](SafeguardFindingKind.md).
