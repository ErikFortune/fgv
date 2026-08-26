# `@fgv/ts-http-storage` — the server side of the HTTP `FileTree` backend

> **This file is authoritative for what ``@fgv/ts-http-storage`` provides and what not to hand-roll.**
> `README.md`, where present, is getting-started material. The always-loaded index at
> [`.ai/instructions/LIBRARY_CAPABILITIES.md`](../../.ai/instructions/LIBRARY_CAPABILITIES.md)
> routes here; it never duplicates this content.


---

[libraries/ts-http-storage](https://github.com/ErikFortune/fgv/tree/release/libraries/ts-http-storage)

Defines the storage REST contract that `@fgv/ts-web-extras`' `HttpTreeAccessors` is the client for — `IHttpStorageProvider` (backend contract), `IStorageFileResponse` / `IStorageReadFileRequest` (wire shapes), `createStorageRoutes` (Hono routes: `GET /tree/item`, `GET /tree/children`, `GET /file`, `PUT /file`, `DELETE /file`, `POST /directories`, `POST /sync`), and `FsStorageProvider` (filesystem-backed implementation). **We own both ends of this wire**, so a representation gap here is a design decision, not an external constraint.

**Content encoding.** `StorageContentEncoding = 'utf8' | 'base64'` selects how a file's bytes ride in the `contents` string. `'utf8'` (the default, and what a provider signals by **omitting** `encoding` from the response) is **lossy** — it is a lenient WHATWG decode, so invalid sequences became U+FFFD before the wire and are unrecoverable downstream. `'base64'` is byte-faithful and is the only representation over which a consumer can decide whether the stored bytes were valid UTF-8, or read genuinely binary content; it costs ~33% more payload. Request it with `?encoding=base64` on `GET /file`; an unrecognized value is a **400**, never a silent downgrade. **`encoding` on the response describes what the server produced, not what the client asked for** — a provider that does not implement base64 answers in UTF-8 and says so by omission, and a client must branch on the response (a client that decoded on the strength of having *asked* would corrupt every such reply). Byte **writes** are still not supported: `PUT /file` carries `contents` as text.

---

---

## Recent additions

*Newest first. **Generated** — see the repo index; do not hand-edit inside the markers.*

<!-- BEGIN GENERATED: recent-additions -->

*No stream has recorded a `sourceLine` against this package yet.*

<!-- END GENERATED: recent-additions -->
