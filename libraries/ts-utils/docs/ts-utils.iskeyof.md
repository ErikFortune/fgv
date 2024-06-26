<!-- Do not edit this file. It is automatically generated by API Documenter. -->

[Home](./index.md) &gt; [@fgv/ts-utils](./ts-utils.md) &gt; [isKeyOf](./ts-utils.iskeyof.md)

## isKeyOf() function

Helper type-guard function to report whether a specified key is present in a supplied object.

**Signature:**

```typescript
export declare function isKeyOf<T extends object>(key: string | number | symbol, item: T): key is keyof T;
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

string \| number \| symbol


</td><td>

The key to be tested.


</td></tr>
<tr><td>

item


</td><td>

T


</td><td>

The object to be tested.


</td></tr>
</tbody></table>
**Returns:**

key is keyof T

Returns `true` if the key is present, `false` otherwise.

