[**@fgv Monorepo API Documentation**](../../../../../README.md)

***

[@fgv Monorepo API Documentation](../../../../../README.md) / [@fgv/ts-extras](../../../README.md) / [Mustache](../README.md) / IMustacheTemplateOptions

# Interface: IMustacheTemplateOptions

Options for template parsing and validation.

## Properties

| Property | Modifier | Type | Description |
| ------ | ------ | ------ | ------ |
| <a id="property-escape"></a> `escape?` | `readonly` | [`MustacheEscapeStrategy`](../type-aliases/MustacheEscapeStrategy.md) | Escape strategy applied to double-brace `{{name}}` tokens at render time. Default `'html'` preserves the existing mustache.js behavior (back-compat). Pass `'none'` for LLM-prompt or other non-HTML targets where the default `& → &amp;` escape would corrupt the output. Pass a custom function for any other escape policy. The strategy is applied per-template via a private `Mustache.Writer` instance; no global state on the `mustache` module is mutated, so concurrent templates with different strategies are safe. Note: triple-brace `{{{name}}}` tokens are always rendered unescaped regardless of strategy (standard mustache.js semantics). |
| <a id="property-includecomments"></a> `includeComments?` | `readonly` | `boolean` | Whether to include comment tokens in variable extraction (default: false) |
| <a id="property-includepartials"></a> `includePartials?` | `readonly` | `boolean` | Whether to include partial references in variable extraction (default: false) |
| <a id="property-tags"></a> `tags?` | `readonly` | readonly \[`string`, `string`\] | Custom opening and closing tags (default: `['{{', '}}']`) |
