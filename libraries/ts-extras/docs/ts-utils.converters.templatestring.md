<!-- Do not edit this file. It is automatically generated by API Documenter. -->

[Home](./index.md) &gt; [@fgv/ts-utils](./ts-utils.md) &gt; [Converters](./ts-utils.converters.md) &gt; [templateString](./ts-utils.converters.templatestring.md)

## Converters.templateString() function

Helper function to create a [StringConverter](./ts-utils.conversion.stringconverter.md) which converts `unknown` to `string`<!-- -->, applying template conversions supplied at construction time or at runtime as context.

**Signature:**

```typescript
export declare function templateString(defaultContext?: unknown): StringConverter<string, unknown>;
```

## Parameters

|  Parameter | Type | Description |
|  --- | --- | --- |
|  defaultContext | unknown | _(Optional)_ Optional default context to use for template values. |

**Returns:**

[StringConverter](./ts-utils.conversion.stringconverter.md)<!-- -->&lt;string, unknown&gt;

A new [Converter](./ts-utils.converter.md) returning `string`<!-- -->.

## Remarks

Template conversions are applied using `mustache` syntax.
