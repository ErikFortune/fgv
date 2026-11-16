[**@fgv Monorepo API Documentation**](../../../../../README.md)

***

[@fgv Monorepo API Documentation](../../../../../README.md) / [@fgv/ts-json-base](../../../README.md) / [FileTree](../README.md) / atomicWriteGuarantees

# Variable: atomicWriteGuarantees

> `const` **atomicWriteGuarantees**: readonly \[`"session"`, `"process-crash"`, `"os-crash"`, `"power-loss"`\]

Every [atomic write guarantee](../type-aliases/AtomicWriteGuarantee.md), ordered
weakest to strongest, so a consumer can rank one against another.
