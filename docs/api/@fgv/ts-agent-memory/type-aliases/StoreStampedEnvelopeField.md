[**@fgv Monorepo API Documentation**](../../../README.md)

***

[@fgv Monorepo API Documentation](../../../README.md) / [@fgv/ts-agent-memory](../README.md) / StoreStampedEnvelopeField

# Type Alias: StoreStampedEnvelopeField

> **StoreStampedEnvelopeField** = `"id"` \| `"seq"` \| `"contentHash"` \| `"created"` \| `"updated"`

The store-owned envelope fields fgv derives or stamps: `id` (from the codec),
and the transaction-time metadata (`seq` / `contentHash` / `created` /
`updated`). A [ICandidateRecord](../interfaces/ICandidateRecord.md) supplies everything EXCEPT these.
