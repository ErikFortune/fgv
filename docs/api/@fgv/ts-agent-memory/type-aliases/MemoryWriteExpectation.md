[**@fgv Monorepo API Documentation**](../../../README.md)

***

[@fgv Monorepo API Documentation](../../../README.md) / [@fgv/ts-agent-memory](../README.md) / MemoryWriteExpectation

# Type Alias: MemoryWriteExpectation

> **MemoryWriteExpectation** = `number` \| `"absent"`

What a conditional write expects to find at its address: the `seq` of the record there (for a
versioned kind, of the entity's current version), or `'absent'` when it expects nothing there.
