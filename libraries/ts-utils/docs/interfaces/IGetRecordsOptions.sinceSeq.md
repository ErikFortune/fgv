[Home](../README.md) > [IGetRecordsOptions](./IGetRecordsOptions.md) > sinceSeq

## IGetRecordsOptions.sinceSeq property

If supplied, only records with `seq > sinceSeq` are returned, enabling
incremental paging from a previously-held cursor.

**Signature:**

```typescript
readonly sinceSeq: number;
```
