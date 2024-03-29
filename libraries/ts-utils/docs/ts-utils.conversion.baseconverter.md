<!-- Do not edit this file. It is automatically generated by API Documenter. -->

[Home](./index.md) &gt; [@fgv/ts-utils](./ts-utils.md) &gt; [Conversion](./ts-utils.conversion.md) &gt; [BaseConverter](./ts-utils.conversion.baseconverter.md)

## Conversion.BaseConverter class

Base templated wrapper to simplify creation of new [Converter](./ts-utils.converter.md)<!-- -->s.

**Signature:**

```typescript
export declare class BaseConverter<T, TC = undefined> implements Converter<T, TC> 
```
**Implements:** [Converter](./ts-utils.converter.md)<!-- -->&lt;T, TC&gt;

## Constructors

|  Constructor | Modifiers | Description |
|  --- | --- | --- |
|  [(constructor)(converter, defaultContext, traits)](./ts-utils.conversion.baseconverter._constructor_.md) |  | Constructs a new [Converter](./ts-utils.converter.md) which uses the supplied function to perform the conversion. |

## Properties

|  Property | Modifiers | Type | Description |
|  --- | --- | --- | --- |
|  [brand](./ts-utils.conversion.baseconverter.brand.md) | <code>readonly</code> | string \| undefined | Returns the brand for a branded type. |
|  [isOptional](./ts-utils.conversion.baseconverter.isoptional.md) | <code>readonly</code> | boolean | Indicates whether this element is explicitly optional. |

## Methods

|  Method | Modifiers | Description |
|  --- | --- | --- |
|  [convalidate(from, context)](./ts-utils.conversion.baseconverter.convalidate.md) |  |  |
|  [convert(from, context)](./ts-utils.conversion.baseconverter.convert.md) |  | Converts from <code>unknown</code> to <code>&lt;T&gt;</code>. For objects and arrays, is guaranteed to return a new entity, with any unrecognized properties removed. |
|  [convertOptional(from, context, onError)](./ts-utils.conversion.baseconverter.convertoptional.md) |  | Converts from <code>unknown</code> to <code>&lt;T&gt;</code> or <code>undefined</code>, as appropriate. |
|  [map(mapper)](./ts-utils.conversion.baseconverter.map.md) |  | Creates a [Converter](./ts-utils.converter.md) which applies a (possibly) mapping conversion to the converted value of this [Converter](./ts-utils.converter.md)<!-- -->. |
|  [mapConvert(mapConverter)](./ts-utils.conversion.baseconverter.mapconvert.md) |  | Creates a [Converter](./ts-utils.converter.md) which applies an additional supplied converter to the result of this converter. |
|  [mapConvertItems(mapConverter)](./ts-utils.conversion.baseconverter.mapconvertitems.md) |  | Creates a [Converter](./ts-utils.converter.md) which maps the individual items of a collection resulting from this [Converter](./ts-utils.converter.md) using the supplied [Converter](./ts-utils.converter.md)<!-- -->. |
|  [mapItems(mapper)](./ts-utils.conversion.baseconverter.mapitems.md) |  | Creates a [Converter](./ts-utils.converter.md) which maps the individual items of a collection resulting from this [Converter](./ts-utils.converter.md) using the supplied map function. |
|  [optional(onError)](./ts-utils.conversion.baseconverter.optional.md) |  | Creates a [Converter](./ts-utils.converter.md) for an optional value. |
|  [withAction(action)](./ts-utils.conversion.baseconverter.withaction.md) |  | Creates a [Converter](./ts-utils.converter.md) which applies a supplied action after conversion. The supplied action is always called regardless of success or failure of the base conversion and is allowed to mutate the return type. |
|  [withBrand(brand)](./ts-utils.conversion.baseconverter.withbrand.md) |  | returns a converter which adds a brand to the type to prevent mismatched usage of simple types. |
|  [withConstraint(constraint, options)](./ts-utils.conversion.baseconverter.withconstraint.md) |  | Creates a [Converter](./ts-utils.converter.md) which applies an optional constraint to the result of this conversion. If this [Converter](./ts-utils.converter.md) (the base converter) succeeds, the new converter calls a supplied constraint evaluation function with the conversion, which fails the entire conversion if the constraint function returns either <code>false</code> or [Failure&lt;T&gt;](./ts-utils.failure.md)<!-- -->. |
|  [withDefault(defaultValue)](./ts-utils.conversion.baseconverter.withdefault.md) |  | Returns a Converter which always succeeds with a default value rather than failing. |
|  [withItemTypeGuard(guard, message)](./ts-utils.conversion.baseconverter.withitemtypeguard.md) |  | Creates a [Converter](./ts-utils.converter.md) which applies a supplied type guard to each member of the conversion result from this converter. |
|  [withTypeGuard(guard, message)](./ts-utils.conversion.baseconverter.withtypeguard.md) |  | Creates a [Converter](./ts-utils.converter.md) which applies a supplied type guard to the conversion result. |

