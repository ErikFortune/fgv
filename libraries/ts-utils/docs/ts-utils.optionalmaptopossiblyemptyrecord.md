<!-- Do not edit this file. It is automatically generated by API Documenter. -->

[Home](./index.md) &gt; [@fgv/ts-utils](./ts-utils.md) &gt; [optionalMapToPossiblyEmptyRecord](./ts-utils.optionalmaptopossiblyemptyrecord.md)

## optionalMapToPossiblyEmptyRecord() function

Applies a factory method to convert an optional `ReadonlyMap<string, TS>` into a `Record<string, TD>`

**Signature:**

```typescript
export declare function optionalMapToPossiblyEmptyRecord<TS, TD, TK extends string = string>(src: ReadonlyMap<TK, TS> | undefined, factory: KeyedThingFactory<TS, TD, TK>): Result<Record<TK, TD>>;
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

src


</td><td>

ReadonlyMap&lt;TK, TS&gt; \| undefined


</td><td>

The `ReadonlyMap` object to be converted, or `undefined`<!-- -->.


</td></tr>
<tr><td>

factory


</td><td>

KeyedThingFactory&lt;TS, TD, TK&gt;


</td><td>

The factory method used to convert elements.


</td></tr>
</tbody></table>
**Returns:**

[Result](./ts-utils.result.md)<!-- -->&lt;Record&lt;TK, TD&gt;&gt;

[Success](./ts-utils.success.md) with the resulting record (empty if `src` is `undefined`<!-- -->) if conversion succeeds. Returns [Failure](./ts-utils.failure.md) with a message if an error occurs.

