<!-- Do not edit this file. It is automatically generated by API Documenter. -->

[Home](./index.md) &gt; [@fgv/ts-utils](./ts-utils.md) &gt; [Collections](./ts-utils.collections.md) &gt; [ConvertingCollector](./ts-utils.collections.convertingcollector.md) &gt; [createConvertingCollector](./ts-utils.collections.convertingcollector.createconvertingcollector.md)

## Collections.ConvertingCollector.createConvertingCollector() method

Creates a new [ConvertingCollector](./ts-utils.collections.convertingcollector.md)<!-- -->.

**Signature:**

```typescript
static createConvertingCollector<TITEM extends ICollectible<any, any>, TSRC = TITEM>(params: IConvertingCollectorConstructorParams<TITEM, TSRC>): Result<ConvertingCollector<TITEM, TSRC>>;
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

params


</td><td>

[IConvertingCollectorConstructorParams](./ts-utils.collections.iconvertingcollectorconstructorparams.md)<!-- -->&lt;TITEM, TSRC&gt;


</td><td>

Required parameters for constructing the collector.


</td></tr>
</tbody></table>
**Returns:**

[Result](./ts-utils.result.md)<!-- -->&lt;[ConvertingCollector](./ts-utils.convertingcollector.md)<!-- -->&lt;TITEM, TSRC&gt;&gt;

Returns [Success](./ts-utils.success.md) with the new collector if it is created, or [Failure](./ts-utils.failure.md) with an error if the collector cannot be created.

