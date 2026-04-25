# AI Image Generation Sample

A small React + Tailwind web app that demonstrates the image-generation API
in `@fgv/ts-extras` (`AiAssist.callProviderImageGeneration` /
`AiAssist.callProxiedImageGeneration`) via the
`@fgv/ts-app-shell` `useAiAssist` hook.

## What it shows

- Reading the provider registry and filtering to providers that support
  image generation (`descriptor.imageApiFormat !== undefined`).
- Building an `IAiAssistSettings` + an `IAiAssistKeyStore` and feeding them
  to `useAiAssist`.
- Calling `generateImages` with provider-aware options:
  - OpenAI / xAI: `size`
  - Imagen: `imagen.aspectRatio`
- Threading an `AbortController` through to cancel an in-flight request.
- Rendering returned images via `AiAssist.toDataUrl`.

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
