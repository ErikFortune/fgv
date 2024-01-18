<!-- Do not edit this file. It is automatically generated by API Documenter. -->

[Home](./index.md) &gt; [@fgv/ts-utils](./ts-utils.md) &gt; [Experimental](./ts-utils.experimental.md) &gt; [RangeOf](./ts-utils.experimental.rangeof.md) &gt; [check](./ts-utils.experimental.rangeof.check.md)

## Experimental.RangeOf.check() method

Checks if a supplied value is within this range.

**Signature:**

```typescript
check(t: T): 'less' | 'included' | 'greater';
```

## Parameters

|  Parameter | Type | Description |
|  --- | --- | --- |
|  t | T | The value to be tested. |

**Returns:**

'less' \| 'included' \| 'greater'

`'included'` if `t` falls within the range, `'less'` if `t` falls below the minimum extent of the range and `'greater'` if `t` is above the maximum extent.
