[**@fgv Monorepo API Documentation**](../../../README.md)

***

[@fgv Monorepo API Documentation](../../../README.md) / [@fgv/ts-agent-memory](../README.md) / splitFrontmatter

# Function: splitFrontmatter()

> **splitFrontmatter**(`raw`): [`Result`](../../ts-res-ui-components/type-aliases/Result.md)\<[`IMemoryFileParts`](../interfaces/IMemoryFileParts.md)\>

Split a `---\n<yaml>\n---\n<body>` memory file into its frontmatter and
body parts. Pure string handling — no external dependency.

## Parameters

| Parameter | Type |
| ------ | ------ |
| `raw` | `string` |

## Returns

[`Result`](../../ts-res-ui-components/type-aliases/Result.md)\<[`IMemoryFileParts`](../interfaces/IMemoryFileParts.md)\>
