<!-- Do not edit this file. It is automatically generated by API Documenter. -->

[Home](./index.md) &gt; [@fgv/ts-utils](./ts-utils.md) &gt; [ValidatingConvertingCollector](./ts-utils.validatingconvertingcollector.md)

## ValidatingConvertingCollector class

A [ConvertingCollector](./ts-utils.collections.convertingcollector.md) with a [ConvertingCollectorValidator](./ts-utils.collections.convertingcollectorvalidator.md) property that enables validated use of the underlying map with weakly-typed keys and values.

**Signature:**

```typescript
export declare class ValidatingConvertingCollector<TITEM extends ICollectible<any, any>, TSRC = TITEM> extends ConvertingCollector<TITEM, TSRC> 
```
**Extends:** [ConvertingCollector](./ts-utils.convertingcollector.md)<!-- -->&lt;TITEM, TSRC&gt;

## Constructors

<table><thead><tr><th>

Constructor


</th><th>

Modifiers


</th><th>

Description


</th></tr></thead>
<tbody><tr><td>

[(constructor)(params)](./ts-utils.validatingconvertingcollector._constructor_.md)


</td><td>


</td><td>

Constructs a new [ValidatingConvertingCollector](./ts-utils.collections.validatingconvertingcollector.md) from the supplied [parameters](./ts-utils.collections.ivalidatingconvertingcollectorconstructorparams.md)<!-- -->.


</td></tr>
</tbody></table>

## Properties

<table><thead><tr><th>

Property


</th><th>

Modifiers


</th><th>

Type


</th><th>

Description


</th></tr></thead>
<tbody><tr><td>

[\_converters](./ts-utils.validatingconvertingcollector._converters.md)


</td><td>

`protected`

`readonly`


</td><td>

[KeyValueConverters](./ts-utils.collections.keyvalueconverters.md)<!-- -->&lt;[CollectibleKey](./ts-utils.collections.collectiblekey.md)<!-- -->&lt;TITEM&gt;, TSRC&gt;


</td><td>


</td></tr>
<tr><td>

[validating](./ts-utils.validatingconvertingcollector.validating.md)


</td><td>

`readonly`


</td><td>

[ConvertingCollectorValidator](./ts-utils.collections.convertingcollectorvalidator.md)<!-- -->&lt;TITEM, TSRC&gt;


</td><td>

A [ConvertingCollectorValidator](./ts-utils.collections.convertingcollectorvalidator.md) which validates keys and values before inserting them into this collector.


</td></tr>
</tbody></table>

## Methods

<table><thead><tr><th>

Method


</th><th>

Modifiers


</th><th>

Description


</th></tr></thead>
<tbody><tr><td>

[createValidatingCollector(params)](./ts-utils.validatingconvertingcollector.createvalidatingcollector.md)


</td><td>

`static`


</td><td>

Creates a new [ValidatingConvertingCollector](./ts-utils.collections.validatingconvertingcollector.md) instance from the supplied [parameters](./ts-utils.collections.ivalidatingconvertingcollectorconstructorparams.md)<!-- -->.


</td></tr>
<tr><td>

[toReadOnly()](./ts-utils.validatingconvertingcollector.toreadonly.md)


</td><td>


</td><td>

Gets a read-only version of this collector as a [read-only map](./ts-utils.collections.ireadonlyvalidatingresultmap.md)<!-- -->.


</td></tr>
</tbody></table>
