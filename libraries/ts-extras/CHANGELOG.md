# Change Log - @fgv/ts-extras

This log was last generated on Fri, 20 Nov 2026 05:01:24 GMT and should not be manually modified.

## 5.1.0
Fri, 20 Nov 2026 05:01:24 GMT

### Minor changes

- New `AiAssist` namespace: Result-returning LLM clients for OpenAI, Anthropic, Google Gemini, xAI, Groq, Mistral, Ollama and OpenAI-compatible servers — completion, streaming, image generation and embeddings, with model aliases (`@provider:role`) and quality tiers.
- ai-assist tool use and structured output: client-defined tools (`executeClientToolTurn`, `runClientToolLoop`), native structured output with an enforcement report, `generateJsonCompletion<T>` with fence-tolerant JSON parsing, prompt-cache requests and usage, and `resolveMaxOutputTokens`.
- New `CryptoUtils` namespace (also at `@fgv/ts-extras/crypto`): `ICryptoProvider` with `NodeCryptoProvider` — AES-256-GCM, PBKDF2, SHA-256, HMAC-SHA256, Ed25519 / ECDSA signing, X25519 key agreement, ECIES wrap, HPKE (`HpkeProvider`) — and strict base64 / hex helpers.
- `CryptoUtils.KeyStore` (also at `@fgv/ts-extras/crypto/keystore`): a password-protected encrypted vault for secrets, API keys and key pairs, with PBKDF2 or Argon2id password secrets and pluggable private-key storage such as `EncryptedFilePrivateKeyStorage`.
- New `SaferFetch` namespace (also at `@fgv/ts-extras/safer-fetch`): server-side fetch with a required address guard (`blockPrivateNetworks()` against SSRF), redirect, size, deadline and content-type controls, opt-in retry, and `createGuardedFetch` for streamed responses.
- New `Mustache` (`MustacheTemplate`, with selectable escaping and `renderWithSegments`), `Yaml` (`yamlConverter`) and `AsyncControl` (`raceStopConditions`, `WriteGate`) namespaces.
- Existing packlets: `Converters.isoDateTime` (a luxon `DateTime`); `ZipFileTree` reads raw bytes and strict UTF-8 text and adds `createZipFromFiles` / `createZipFromTextFiles`; `templateString`, `isoDate` and `isoDateTime` fail readably on cyclic or BigInt input instead of throwing.

### Patches

- Corrected the import paths documented in README.md and CAPABILITIES.md: `ai-assist`, `crypto-utils` and `experimental` are reached through the `AiAssist`, `CryptoUtils` and `Experimental` namespaces of `@fgv/ts-extras`, not as subpaths. No API change. The package no longer ships the `perf/` live-provider probe scripts.
- Packaging: source maps and `CAPABILITIES.md` now ship in the package.

### Updates

- Upgrading from 5.0.2: new runtime dependencies `js-yaml` and `@types/luxon` (the published typings reference luxon's `DateTime`). The packlets that shipped in 5.0.2 — conversion, csv, experimental, hash, record-jar, zip-file-tree — changed only additively.

## 5.0.2
Wed, 17 Dec 2025 18:08:09 GMT

### Updates

- dual-publish
- minor cleanup

## 5.0.1
Tue, 23 Sep 2025 03:13:55 GMT

_Version update only_

## 5.0.0
Tue, 23 Sep 2025 02:54:20 GMT

### Updates

- New zip file tree accessors allow FileTree operations on zip files
- update rushstack

## 4.6.0
Wed, 02 Jul 2025 05:48:16 GMT

_Version update only_

## 4.5.1
Wed, 02 Jul 2025 05:47:11 GMT

### Updates

- update rushstack

## 4.5.0
Tue, 01 Jul 2025 03:26:11 GMT

_Version update only_

## 4.4.0
Sat, 01 Feb 2025 17:13:10 GMT

_Version update only_

## 4.3.0
Thu, 30 Jan 2025 00:35:17 GMT

_Version update only_

## 4.2.2
Thu, 23 Jan 2025 06:19:32 GMT

_Version update only_

## 4.2.1
Tue, 21 Jan 2025 04:19:21 GMT

_Version update only_

## 4.2.0
Mon, 20 Jan 2025 09:46:53 GMT

_Version update only_

## 4.1.0
Thu, 09 Jan 2025 05:33:39 GMT

### Updates

- update dependencies

## 4.0.2
Tue, 14 May 2024 14:45:53 GMT

_Version update only_

## 4.0.1
Tue, 14 May 2024 05:02:20 GMT

### Updates

- publish

## 4.0.0
Tue, 14 May 2024 03:09:27 GMT

### Updates

- move templateString, rangeOf and isoDate converters from ts-utils
- update generated api docs

## 3.0.0
Mon, 22 Jan 2024 07:00:18 GMT

### Updates

- refactor hash implementation
- refactor and cleanup
- Factor extras into their own package

## 2.2.0
Thu, 18 Jan 2024 05:45:04 GMT

### Updates

- refactor and cleanup
- Factor extras into their own package

