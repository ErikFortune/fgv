# Change Log - @fgv/ts-extras-ollama

This log was last generated on Fri, 20 Nov 2026 05:01:24 GMT and should not be manually modified.

## 5.1.0
Fri, 20 Nov 2026 05:01:24 GMT

### Minor changes

- Initial release: a Result boundary over the `ollama` JS library for the native Ollama API that its OpenAI-compatible endpoint cannot express. Node only; completion and tool use stay in `@fgv/ts-extras` ai-assist.
- Model management: `listModels`, `listRunning`, `showModel`, `deleteModel`, and `pullModel` with streamed progress.
- `chatStructured`: grammar-constrained structured output validated against a JSON schema.

