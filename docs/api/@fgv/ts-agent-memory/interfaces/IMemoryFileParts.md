[**@fgv Monorepo API Documentation**](../../../README.md)

***

[@fgv Monorepo API Documentation](../../../README.md) / [@fgv/ts-agent-memory](../README.md) / IMemoryFileParts

# Interface: IMemoryFileParts

The two parts of a memory file: the YAML frontmatter (between the `---`
delimiters) and the markdown body (everything after the closing delimiter).

## Properties

| Property | Modifier | Type | Description |
| ------ | ------ | ------ | ------ |
| <a id="property-body"></a> `body` | `readonly` | `string` | The raw body text following the closing delimiter. |
| <a id="property-frontmatter"></a> `frontmatter` | `readonly` | `string` | The raw YAML frontmatter (delimiters stripped). |
