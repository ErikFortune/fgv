# AI Assist Sample

A small React + Tailwind web app that demonstrates the AI APIs in
`@fgv/ts-extras` via the `@fgv/ts-app-shell` `useAiAssist` hook. Two modes
are exposed via a top-level toggle:

- **Image Generation** (`generateImages`)
- **Streaming Chat** (`streamDirect`) — token-by-token output with optional
  web-search tool events

## What it shows

### Shared
- Reading the provider registry and filtering by capability
  (`descriptor.imageApiFormat !== undefined` for image mode; presence of
  `baseUrl` for chat mode).
- Building an `IAiAssistSettings` + an `IAiAssistKeyStore` and feeding them
  to `useAiAssist`.
- Per-provider model picker with on-demand `listModels` + `<datalist>`
  suggestions, filtered by the active capability.
- Threading an `AbortController` through to cancel in-flight calls.

### Image Generation mode
- Calling `generateImages` with provider-aware options:
  - OpenAI / xAI: `size`
  - Imagen: `imagen.aspectRatio`
- Rendering returned images via `AiAssist.toDataUrl`.

### Streaming Chat mode
- Calling `streamDirect` with conversation history (`additionalMessages`),
  appending text deltas to the active assistant message, and capturing the
  final aggregated text on `done`.
- Optional `web_search` tool toggle (where the provider supports it). Tool
  progress events surface as a "Searching the web…" indicator above the
  transcript.
- Pre-flight rejection for streaming-CORS-restricted providers (xAI Grok)
  with a clear message — visible as an amber pill in the settings panel.

## What it doesn't show

- The proxy path. xAI Grok is CORS-restricted from the browser, so without
  a proxy server it will fail when called directly from this sample. To test
  the proxy path, set `proxyUrl` in `App.tsx` and stand up a server that
  implements `POST /api/ai/image-generation` per the contract in
  `.claude/project/ai-images-design.md`.
- Persistent secret storage. API keys live in memory for the session only.
  See `@fgv/ts-extras` `KeyStore` for a real encrypted-keystore implementation.

## Running

```sh
cd samples/ai-image-gen-sample
rushx dev
```

Then open http://localhost:3003. Pick a provider, paste an API key, write a
prompt, click **Generate**.
