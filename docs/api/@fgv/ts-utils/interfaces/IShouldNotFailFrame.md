[**@fgv Monorepo API Documentation**](../../../README.md)

***

[@fgv Monorepo API Documentation](../../../README.md) / [@fgv/ts-utils](../README.md) / \_IShouldNotFailFrame

# Interface: \_IShouldNotFailFrame

**`Internal`**

Parsed stack-frame information used by `Result<T>.shouldNotFail`.
All fields are optional — runtimes that don't expose stack traces produce
an empty frame and the call site is omitted from the message.

## Properties

| Property | Type |
| ------ | ------ |
| <a id="property-file"></a> `file?` | `string` |
| <a id="property-fn"></a> `fn?` | `string` |
| <a id="property-line"></a> `line?` | `number` |
