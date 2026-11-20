# Change Log - @fgv/ts-prompt-assist

This log was last generated on Fri, 20 Nov 2026 05:01:24 GMT and should not be manually modified.

## 5.1.0
Fri, 20 Nov 2026 05:01:24 GMT

### Minor changes

- Initial release: authoring, resolution and composition of LLM prompts that vary by context, built on `@fgv/ts-res` conditional resources and Mustache rendering.
- `PromptLibrary`: one YAML file per scope and prompt id, scope-chained resolution, slot bindings — including a slot bound to another prompt — and typed validation of JSON or free-text model output.
- `HorizontalComposer` merges several resolved prompts into one, with provenance ordering.
- Safety policies: length caps, pluggable screeners and an anti-jailbreak preface.
- Observation and caching: observers on every resolution, opt-in composition reports of what a prompt is made of, prompt-cache stability analysis, and `toCacheRequest` to place `@fgv/ts-extras` ai-assist cache breakpoints.

