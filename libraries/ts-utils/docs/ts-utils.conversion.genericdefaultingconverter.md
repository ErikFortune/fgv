<!-- Do not edit this file. It is automatically generated by API Documenter. -->

[Home](./index.md) &gt; [@fgv/ts-utils](./ts-utils.md) &gt; [Conversion](./ts-utils.conversion.md) &gt; [GenericDefaultingConverter](./ts-utils.conversion.genericdefaultingconverter.md)

## Conversion.GenericDefaultingConverter class

Generic [DefaultingConverter](./ts-utils.conversion.defaultingconverter.md)<!-- -->, which wraps another converter to substitute a supplied default value for any errors returned by the inner converter.

**Signature:**

```typescript
export declare class GenericDefaultingConverter<T, TD = T, TC = undefined> implements DefaultingConverter<T, TD, TC> 
```
**Implements:** [DefaultingConverter](./ts-utils.conversion.defaultingconverter.md)<!-- -->&lt;T, TD, TC&gt;

## Constructors

|  Constructor | Modifiers | Description |
|  --- | --- | --- |
|  [(constructor)(converter, defaultValue)](./ts-utils.conversion.genericdefaultingconverter._constructor_.md) |  | Constructs a new [generic defaulting converter](./ts-utils.conversion.genericdefaultingconverter.md)<!-- -->. |

## Properties

|  Property | Modifiers | Type | Description |
|  --- | --- | --- | --- |
|  [brand](./ts-utils.conversion.genericdefaultingconverter.brand.md) | <code>readonly</code> | string \| undefined | Indicates whether this element is explicitly optional. |
|  [defaultValue](./ts-utils.conversion.genericdefaultingconverter.defaultvalue.md) |  | TD | Default value to use if the conversion fails. |
|  [isOptional](./ts-utils.conversion.genericdefaultingconverter.isoptional.md) | <code>readonly</code> | boolean | Indicates whether this element is explicitly optional. |

## Methods

|  Method | Modifiers | Description |
|  --- | --- | --- |
|  [convalidate(from, ctx)](./ts-utils.conversion.genericdefaultingconverter.convalidate.md) |  |  |
|  [convert(from, ctx)](./ts-utils.conversion.genericdefaultingconverter.convert.md) |  | Converts from <code>unknown</code> to <code>&lt;T&gt;</code>. For objects and arrays, is guaranteed to return a new entity, with any unrecognized properties removed. |
|  [convertOptional(from, context, onError)](./ts-utils.conversion.genericdefaultingconverter.convertoptional.md) |  | Converts from <code>unknown</code> to <code>&lt;T&gt;</code> or <code>undefined</code>, as appropriate. |
|  [map(mapper)](./ts-utils.conversion.genericdefaultingconverter.map.md) |  | Creates a [Converter](./ts-utils.converter.md) which applies a (possibly) mapping conversion to the converted value of this [Converter](./ts-utils.converter.md)<!-- -->. |
|  [mapConvert(mapConverter)](./ts-utils.conversion.genericdefaultingconverter.mapconvert.md) |  | Creates a [Converter](./ts-utils.converter.md) which applies an additional supplied converter to the result of this converter. |
|  [mapConvertItems(mapConverter)](./ts-utils.conversion.genericdefaultingconverter.mapconvertitems.md) |  | Creates a [Converter](./ts-utils.converter.md) which maps the individual items of a collection resulting from this [Converter](./ts-utils.converter.md) using the supplied [Converter](./ts-utils.converter.md)<!-- -->. |
|  [mapItems(mapper)](./ts-utils.conversion.genericdefaultingconverter.mapitems.md) |  | Creates a [Converter](./ts-utils.converter.md) which maps the individual items of a collection resulting from this [Converter](./ts-utils.converter.md) using the supplied map function. |
|  [optional(onError)](./ts-utils.conversion.genericdefaultingconverter.optional.md) |  | Creates a [Converter](./ts-utils.converter.md) for an optional value. |
|  [withAction(action)](./ts-utils.conversion.genericdefaultingconverter.withaction.md) |  | Creates a [Converter](./ts-utils.converter.md) which applies a supplied action after conversion. The supplied action is always called regardless of success or failure of the base conversion and is allowed to mutate the return type. |
|  [withBrand(brand)](./ts-utils.conversion.genericdefaultingconverter.withbrand.md) |  | returns a converter which adds a brand to the type to prevent mismatched usage of simple types. |
|  [withConstraint(constraint, options)](./ts-utils.conversion.genericdefaultingconverter.withconstraint.md) |  | Creates a [Converter](./ts-utils.converter.md) which applies an optional constraint to the result of this conversion. If this [Converter](./ts-utils.converter.md) (the base converter) succeeds, the new converter calls a supplied constraint evaluation function with the conversion, which fails the entire conversion if the constraint function returns either <code>false</code> or [Failure&lt;T&gt;](./ts-utils.failure.md)<!-- -->. |
|  [withDefault(dflt)](./ts-utils.conversion.genericdefaultingconverter.withdefault.md) |  | <p>Returns a Converter which always succeeds with the supplied default value rather than failing.</p><p>Note that the supplied default value \*overrides\* the default value of this [DefaultingConverter](./ts-utils.conversion.defaultingconverter.md)<!-- -->.</p> |
|  [withItemTypeGuard(guard, message)](./ts-utils.conversion.genericdefaultingconverter.withitemtypeguard.md) |  | Creates a [Converter](./ts-utils.converter.md) which applies a supplied type guard to each member of the conversion result from this converter. |
|  [withTypeGuard(guard, message)](./ts-utils.conversion.genericdefaultingconverter.withtypeguard.md) |  | Creates a [Converter](./ts-utils.converter.md) which applies a supplied type guard to the conversion result. |

