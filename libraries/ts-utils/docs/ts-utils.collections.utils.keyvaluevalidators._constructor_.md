<!-- Do not edit this file. It is automatically generated by API Documenter. -->

[Home](./index.md) &gt; [@fgv/ts-utils](./ts-utils.md) &gt; [Collections](./ts-utils.collections.md) &gt; [Utils](./ts-utils.collections.utils.md) &gt; [KeyValueValidators](./ts-utils.collections.utils.keyvaluevalidators.md) &gt; [(constructor)](./ts-utils.collections.utils.keyvaluevalidators._constructor_.md)

## Collections.Utils.KeyValueValidators.(constructor)

Constructs a new key-value validator.

**Signature:**

```typescript
constructor(key: Validator<TK, unknown> | Converter<TK, unknown>, value: Validator<TV, unknown> | Converter<TV, unknown>, entry?: Validator<KeyValueEntry<TK, TV>, unknown> | Converter<KeyValueEntry<TK, TV>, unknown>);
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

[Validator](./ts-utils.validator.md)<!-- -->&lt;TK, unknown&gt; \| [Converter](./ts-utils.converter.md)<!-- -->&lt;TK, unknown&gt;


</td><td>

Required key validator or converter.


</td></tr>
<tr><td>

value


</td><td>

[Validator](./ts-utils.validator.md)<!-- -->&lt;TV, unknown&gt; \| [Converter](./ts-utils.converter.md)<!-- -->&lt;TV, unknown&gt;


</td><td>

Required value validator or converter.


</td></tr>
<tr><td>

entry


</td><td>

[Validator](./ts-utils.validator.md)<!-- -->&lt;[KeyValueEntry](./ts-utils.collections.keyvalueentry.md)<!-- -->&lt;TK, TV&gt;, unknown&gt; \| [Converter](./ts-utils.converter.md)<!-- -->&lt;[KeyValueEntry](./ts-utils.collections.keyvalueentry.md)<!-- -->&lt;TK, TV&gt;, unknown&gt;


</td><td>

_(Optional)_ Optional entry validator or converter. If no entry validator is provided, an entry is considered valid if both key and value are valid.


</td></tr>
</tbody></table>