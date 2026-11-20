[**@fgv Monorepo API Documentation**](../../../README.md)

***

[@fgv Monorepo API Documentation](../../../README.md) / [@fgv/ts-prompt-assist](../README.md) / IScreener

# Interface: IScreener

A pluggable, per-slot-value, pre-render safety screener.

## Remarks

`screen` is invoked once per merged slot value — one that resolved to a
binding, default, or caller substitution (the empty fallback is skipped) —
during a resolve, before the Mustache render. The value may itself be an
empty string. It returns zero, one, or many [ISafeguardFinding](ISafeguardFinding.md)s
(an empty array signals no concerns). The signature is always async so ML
classifiers and remote-call screeners compose uniformly; a synchronous
screener simply returns a resolved promise. A returned `Result.fail`
signals an *operational* failure (not a finding) and propagates as a resolve
failure. Screeners run sequentially in policy declaration order, and a
finding with `disposition: 'reject'` short-circuits the remaining screeners.

## Properties

| Property | Modifier | Type | Description |
| ------ | ------ | ------ | ------ |
| <a id="property-name"></a> `name` | `readonly` | `string` | Name used for traceability and finding attribution. |
| <a id="property-screen"></a> `screen` | `readonly` | (`ctx`) => `Promise`\<[`Result`](../../ts-res-ui-components/type-aliases/Result.md)\<readonly [`ISafeguardFinding`](ISafeguardFinding.md)[]\>\> | Screens a single slot value; see [IScreenerContext](IScreenerContext.md). |
