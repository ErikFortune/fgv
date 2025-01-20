<!-- Do not edit this file. It is automatically generated by API Documenter. -->

[Home](./index.md) &gt; [@fgv/ts-utils](./ts-utils.md) &gt; [Collections](./ts-utils.collections.md) &gt; [ResultMap](./ts-utils.collections.resultmap.md) &gt; [setNew](./ts-utils.collections.resultmap.setnew.md)

## Collections.ResultMap.setNew() method

Sets a key/value pair in the map if the key does not already exist.

**Signature:**

```typescript
setNew(key: TK, value: TV): DetailedResult<ResultMap<TK, TV>, ResultMapResultDetail>;
```

## Parameters

<table><thead><tr><th>

Parameter


</th><th>

Type


</th><th>

Description


</th></tr></thead>
<tbody><tr><td>

key


</td><td>

TK


</td><td>

The key to set.


</td></tr>
<tr><td>

value


</td><td>

TV


</td><td>

The value to set.


</td></tr>
</tbody></table>
**Returns:**

[DetailedResult](./ts-utils.detailedresult.md)<!-- -->&lt;[ResultMap](./ts-utils.collections.resultmap.md)<!-- -->&lt;TK, TV&gt;, [ResultMapResultDetail](./ts-utils.collections.resultmapresultdetail.md)<!-- -->&gt;

`Success` with detail `added` if the key was added, `Failure` with detail `exists` if the key already exists.
