[**@fgv Monorepo API Documentation**](../../../README.md)

***

[@fgv Monorepo API Documentation](../../../README.md) / [@fgv/ts-prompt-assist](../README.md) / promptFileConverter

# Variable: promptFileConverter

> `const` **promptFileConverter**: [`Converter`](https://github.com/ErikFortune/fgv/tree/main/libraries/ts-utils/docs)\<[`IPromptFileContents`](../interfaces/IPromptFileContents.md)\>

Converter for a single prompt YAML file. After the descriptor and
candidates parse, this converter additionally scans each candidate's body
for double-brace / ampersand-unescape Mustache tokens (locked by design
§6) and rejects free-text descriptors that declare `outputValidations`
(design §8).

The store reconstructs the `IStoredPromptRecord` by stamping the scope
derived from the file's directory path.
