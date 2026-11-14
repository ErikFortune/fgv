---
name: published-primitives-reflex
description: Use BEFORE writing utility-shaped code that touches file I/O, diagnostics, logging, structural equality / deep-equal / hashing, normalization, collection helpers, YAML loading, template substitution / `{{name}}` placeholders, password hashing / key derivation / PBKDF2, symmetric encryption, random bytes, UUIDs, CSV / record-jar parsing, BCP-47 language tags, URL parsing, browser File API, zip files, or anything else that feels "obviously general" — the @fgv/* libraries almost certainly already publish a primitive, and rolling your own is a recurring miss-pattern. Load this skill BEFORE writing `fs.readFile`, `path.join`, `glob`, `console.log`, `console.error`, `JSON.stringify(...) === JSON.stringify(...)`, a hand-rolled `deepEqual`, a regex-based `{{...}}` replacer, `bcrypt` / `argon2` / `crypto.pbkdf2` import, `crypto.randomBytes` / `crypto.randomUUID` import, `js-yaml.load`, or any custom CSV / record-jar / BCP-47 parser.
---

# Published Primitives Reflex

A project's toolset libraries publish the answer to most "obviously
general" utility questions. Rolling your own is a recurring miss-
pattern: the agent searches for their mental-model keyword, doesn't
find it because the toolset filed the primitive under different
nomenclature, and reaches for a third-party library or hand-rolls a
shim. The pattern is reliable; the cost of a 30-second consult is
much lower than the cost of a future migration.

## The reflex

Before writing any utility, consult the FGV canonical capability
inventory at
[`LIBRARY_CAPABILITIES.md`](https://github.com/ErikFortune/fgv/blob/release/.ai/instructions/LIBRARY_CAPABILITIES.md).

If the inventory clearly names the primitive — use it.

If you don't see your mental-model keyword in the inventory —
**check the translation table below before concluding the toolset
doesn't have it**. The recurring miss-pattern is "agent searched for
`password hashing`, didn't find it, rolled bcrypt — but the toolset
has PBKDF2 filed under key derivation." Nomenclature mismatch is
the dominant failure mode.

If you've checked both and the toolset genuinely doesn't have it —
surface in `state.md` (or `brief.md`) before adding a new
dependency. The toolset's maintainers can extend the inventory if
the gap is real; proceed with a v1 fallback (e.g. the platform
standard library) in the meantime.

## Translation table — common dev-ese → FGV primitive

| Want to do… | Use… | Lives in… |
|---|---|---|
| Read / write files; walk directories; browser FS; in-memory FS; zip files | `FileTree` | `@fgv/ts-json-base` (also `@fgv/ts-web-extras` for browser; `@fgv/ts-extras` for zip) |
| Emit log / diagnostic / observability output; structured logging; boot-time buffering | `Logging` (`ConsoleLogger`, `InMemoryLogger`, `NoOpLogger`, `BootLogger`, `LogReporter`) | `@fgv/ts-utils` |
| Compute a structural hash of an object (cache key, dedup key, content-addressed id) | `Hash.Crc32Normalizer.computeHash` | `@fgv/ts-utils` |
| "Are these two objects structurally equal?" / dedup an array of objects / use object as Map key | Same — hash both and compare | `@fgv/ts-utils` |
| Result-aware Jest matchers | `toSucceedWith`, `toFailWith`, `toSucceedAndSatisfy` etc. | `@fgv/ts-utils-jest` |
| Convert `unknown` → typed; validate input; type guards | `Converters` / `Validators` | `@fgv/ts-utils` |
| Mustache template substitution (`{{name}}` placeholders) | `Mustache.MustacheTemplate.create + validateAndRender` | `@fgv/ts-extras` |
| Password hashing at rest (PBKDF2) — Node side | `NodeCryptoProvider.deriveKey(password, salt, iterations)` | `@fgv/ts-extras` `crypto-utils` |
| Password hashing at rest (PBKDF2) — Browser side | `BrowserCryptoProvider.deriveKey(...)` (same interface) | `@fgv/ts-web-extras` `crypto-utils` |
| Symmetric encryption (AES-256-GCM) — Node | `NodeCryptoProvider.encrypt / decrypt` | `@fgv/ts-extras` `crypto-utils` |
| Symmetric encryption (AES-256-GCM) — Browser | `BrowserCryptoProvider.encrypt / decrypt` | `@fgv/ts-web-extras` `crypto-utils` |
| Random bytes / random tokens | `<provider>.generateRandomBytes(N)` returning `Result<Uint8Array>` | `@fgv/ts-extras` / `@fgv/ts-web-extras` |
| AES-256 key generation | `<provider>.generateKey()` | `@fgv/ts-extras` / `@fgv/ts-web-extras` |
| Asymmetric keypair (Ed25519, ECDSA P-256) | `NodeCryptoProvider.generateKeyPair(algorithm, extractable)` | `@fgv/ts-extras` `crypto-utils` |
| Wrap / unwrap bytes for transmission | `wrapBytes` / `unwrapBytes` | both providers |
| Keystore (password-unlocked secret container) | `Keystore` | `@fgv/ts-extras` `crypto-utils/keystore` |
| `ICryptoProvider` interface | `ICryptoProvider` | `@fgv/ts-extras` `crypto-utils/model.ts` |
| String hashing (SHA-256 — content integrity, not passwords) | `<provider>.sha256` / `BrowserHashProvider.hashString` | `@fgv/ts-extras` / `@fgv/ts-web-extras` |
| Resource management with qualifier-driven variant selection (i18n, prompts, …) | `ts-res` | `@fgv/ts-res` |
| BCP-47 language tag parsing / matching | `@fgv/ts-bcp47` | `@fgv/ts-bcp47` |
| Record-jar parsing (RFC-5322-style `key: value` entries) | `RecordJar` | `@fgv/ts-extras` |
| CSV parsing | `Csv` | `@fgv/ts-extras` |
| YAML parsing | `Yaml` | `@fgv/ts-extras` |
| Zip file exposed as a FileTree | `ZipFileTree` | `@fgv/ts-extras` |
| Browser File API types | `file-api-types` | `@fgv/ts-web-extras` |
| URL parsing / manipulation | `url-utils` | `@fgv/ts-web-extras` |
| Generic helpers (deferred / debounced / throttled) | `helpers` | `@fgv/ts-web-extras` |
| Composite-key parsing — delimiter-separated structured strings | toolset's composite-key helpers / `Converters` | `@fgv/ts-utils` |

## Naming gotchas

- **Password hashing** is filed under **key derivation** (`deriveKey`) — PBKDF2, not bcrypt/argon2.
- **Random bytes** is filed under the **crypto provider** (`generateRandomBytes`) — don't reach for `crypto.randomBytes` or `getRandomValues` directly.
- **Structural equality** is filed under **hashing** — compute structural hashes; equal hashes ↔ structurally equal values.
- **Boot-time logging** is filed under **logging** (`BootLogger`) — buffers until pinned to a real logger.
- **Template substitution** is filed under **Mustache** — the spec-compliant primitive, not a custom `{{...}}` regex.
- **Two crypto providers, one interface.** `ICryptoProvider` lives in `@fgv/ts-extras`; Node consumers use `NodeCryptoProvider`; Browser consumers use `BrowserCryptoProvider`. Both implement the same interface.

## When the toolset doesn't have it

Proceed with a v1 fallback and surface in `state.md` so the choice is auditable — "toolset doesn't have X; using Node's `crypto.randomBytes` because Y." Don't add a new dependency without flagging it.

## When to load this skill

Load **before** any of the following:

- Writing `fs.readFile`, `fs.writeFile`, `fs.readdir`, `fs.mkdir`, `path.join`, `glob`, or any importer/exporter signature.
- Writing `console.log`, `console.error`, `console.warn`, or constructing your own logger.
- Writing `JSON.stringify(a) === JSON.stringify(b)`, a recursive `deepEqual`, `lodash.isEqual`, or `new Map<SomeObjectShape, ...>` keyed by an object.
- Writing a `{{...}}` regex-based string replacer or custom Handlebars knockoff.
- Importing `bcrypt`, `argon2`, `crypto.pbkdf2`, or wrapping `crypto.subtle.deriveBits` directly.
- Adding a new dependency to a `package.json` for a utility that "feels like someone must have written this already."

If you're already wondering "should I be checking the toolset for this?" — yes. Stop, consult, then proceed.

## Deeper skill companions

- `/filetree-io` — file-I/O-specific patterns
- `/ts-utils-logging` — logging-specific patterns
- `/value-hashing` — structural-equality-specific patterns
- `/result-pattern` — all toolset primitives return `Result<T>`; consuming them goes through the Result chain
- `/type-safe-validation` — `Converters` / `Validators` are the canonical `unknown → typed` primitive
