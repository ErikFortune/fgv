[**@fgv Monorepo API Documentation**](../../../../../README.md)

***

[@fgv Monorepo API Documentation](../../../../../README.md) / [@fgv/ts-extras](../../../README.md) / [AiAssist](../README.md) / ANTHROPIC\_STRUCTURED\_OUTPUT\_TOOL\_NAME

# Variable: ANTHROPIC\_STRUCTURED\_OUTPUT\_TOOL\_NAME

> `const` **ANTHROPIC\_STRUCTURED\_OUTPUT\_TOOL\_NAME**: `string` = `'fgv_structured_output'`

The name the Anthropic forced-tool path gives its synthetic tool.

## Remarks

Used only by `'anthropic-tool-forced'`: that mechanism forces a tool, so a tool
must exist to be forced. (`'anthropic-output-format'` sends no tool at all.) The
name is fgv-owned and never reaches the caller — the structured-output resolver
re-serializes the tool's `input` back into `IAiCompletionResponse.content`, so a
caller's converter sees a JSON string exactly as it does on every other provider.
