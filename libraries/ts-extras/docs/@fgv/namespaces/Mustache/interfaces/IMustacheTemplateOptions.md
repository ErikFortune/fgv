[**@fgv/ts-extras**](../../../../README.md)

***

[@fgv/ts-extras](../../../../README.md) / [Mustache](../README.md) / IMustacheTemplateOptions

# Interface: IMustacheTemplateOptions

Options for template parsing and validation.

## Properties

| Property | Modifier | Type | Description |
| ------ | ------ | ------ | ------ |
| <a id="includecomments"></a> `includeComments?` | `readonly` | `boolean` | Whether to include comment tokens in variable extraction (default: false) |
| <a id="includepartials"></a> `includePartials?` | `readonly` | `boolean` | Whether to include partial references in variable extraction (default: false) |
| <a id="tags"></a> `tags?` | `readonly` | readonly \[`string`, `string`\] | Custom opening and closing tags (default: `['{{', '}}']`) |
