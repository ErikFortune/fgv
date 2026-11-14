[**@fgv Monorepo API Documentation**](../../../../../README.md)

***

[@fgv Monorepo API Documentation](../../../../../README.md) / [@fgv/ts-json-base](../../../README.md) / [FileTree](../README.md) / ICopyReport

# Interface: ICopyReport

What a copy did.

## Remarks

The two file counts are split by **mechanism**, not by outcome — every file counted in
either arrived byte-for-byte identical to its source. The split is there because
`filesCopied: 500` reads the same whether the bytes were carried verbatim or put through
a text round trip, and a caller auditing a snapshot wants to know which. Anything that
did *not* arrive faithfully is either a failure or an entry in
[skipped](#property-skipped); it is never folded into a count.

## Properties

| Property | Modifier | Type | Description |
| ------ | ------ | ------ | ------ |
| <a id="property-directoriescreated"></a> `directoriesCreated` | `readonly` | `number` | Directories created in the destination. |
| <a id="property-filescopiedasbytes"></a> `filesCopiedAsBytes` | `readonly` | `number` | Files written verbatim as bytes. |
| <a id="property-filescopiedastext"></a> `filesCopiedAsText` | `readonly` | `number` | Files written as text, after verifying that re-encoding that text reproduces the source bytes exactly. |
| <a id="property-skipped"></a> `skipped` | `readonly` | readonly [`ISkippedCopyFile`](ISkippedCopyFile.md)[] | Files left behind, empty unless [onUnfaithfulFile](ICopyOptions.md#property-onunfaithfulfile) is `'skip'`. |
