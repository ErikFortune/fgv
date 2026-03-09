[**@fgv/ts-utils**](../../../../README.md)

***

[@fgv/ts-utils](../../../../README.md) / [Collections](../README.md) / ConversionErrorHandling

# Type Alias: ConversionErrorHandling

> **ConversionErrorHandling** = `"ignore"` \| `"warn"` \| `"fail"`

Error handling behavior for conversion failures during iteration.
- `'ignore'`: Silently skip failed conversions (default behavior)
- `'warn'`: Log warning and skip failed conversions
- `'fail'`: Throw error on first conversion failure
