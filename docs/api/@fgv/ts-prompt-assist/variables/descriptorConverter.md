[**@fgv Monorepo API Documentation**](../../../README.md)

***

[@fgv Monorepo API Documentation](../../../README.md) / [@fgv/ts-prompt-assist](../README.md) / descriptorConverter

# Variable: descriptorConverter

> `const` **descriptorConverter**: [`Converter`](https://github.com/ErikFortune/fgv/tree/main/libraries/ts-utils/docs)\<[`IPromptDescriptor`](../interfaces/IPromptDescriptor.md)\>

Converter for the prompt descriptor metadata (without the candidates).
Cross-cutting body validation lives on the [promptFileConverter](promptFileConverter.md)
because candidates carry the bodies.
