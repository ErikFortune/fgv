<!-- Do not edit this file. It is automatically generated by API Documenter. -->

[Home](./index.md) &gt; [@fgv/ts-utils](./ts-utils.md) &gt; [Normalizer](./ts-utils.normalizer.md) &gt; [normalizeEntries](./ts-utils.normalizer.normalizeentries.md)

## Normalizer.normalizeEntries() method

Normalizes an array of object property entries (e.g. as returned by `Object.entries()`<!-- -->).

**Signature:**

```typescript
normalizeEntries<T = unknown>(entries: Iterable<Entry<T>>): Entry<T>[];
```

## Parameters

|  Parameter | Type | Description |
|  --- | --- | --- |
|  entries | Iterable&lt;Entry&lt;T&gt;&gt; | The entries to be normalized. |

**Returns:**

Entry&lt;T&gt;\[\]

A normalized sorted array of entries.

## Remarks

Converts property names (entry key) to string and then sorts as string.

