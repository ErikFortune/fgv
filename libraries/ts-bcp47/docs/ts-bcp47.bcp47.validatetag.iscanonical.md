<!-- Do not edit this file. It is automatically generated by API Documenter. -->

[Home](./index.md) &gt; [@fgv/ts-bcp47](./ts-bcp47.md) &gt; [Bcp47](./ts-bcp47.bcp47.md) &gt; [ValidateTag](./ts-bcp47.bcp47.validatetag.md) &gt; [isCanonical](./ts-bcp47.bcp47.validatetag.iscanonical.md)

## Bcp47.ValidateTag.isCanonical() method

Determines if supplied [subtags](./ts-bcp47.bcp47.subtags.md) are in canonical form, meaning that they are at least well-formed as specified by [RFC 5646](https://www.rfc-editor.org/rfc/rfc5646.html#section-2.2.9)<!-- -->, and all subtags are also [capitalized as recommended](https://www.rfc-editor.org/rfc/rfc5646.html#section-2.1.1)<!-- -->.

**Signature:**

```typescript
static isCanonical(subtags: ISubtags): boolean;
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

subtags


</td><td>

[ISubtags](./ts-bcp47.bcp47.isubtags.md)


</td><td>

The [subtags](./ts-bcp47.bcp47.subtags.md) to test.


</td></tr>
</tbody></table>
**Returns:**

boolean

`true` if the [subtags](./ts-bcp47.bcp47.subtags.md) represent a language tag in canonical, false otherwise.

## Example 1

`en-US` is in canonical form, `en-us` is not.

## Example 2

`eng-US` is in canonical form, `eng-us` is not.

