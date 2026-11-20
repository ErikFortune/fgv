# Change Log - @fgv/ts-web-extras

This log was last generated on Fri, 20 Nov 2026 05:01:24 GMT and should not be manually modified.

## 5.1.0
Fri, 20 Nov 2026 05:01:24 GMT

### Breaking changes

- Upgrading from 5.0.2: the package now requires the peer dependency `@fgv/ts-extras` — install `@fgv/ts-extras@^5.1.0` (npm 7 and later install peers automatically).
- Upgrading from 5.0.2: `FileApiTreeAccessors` no longer takes a type parameter, which was unused; drop the type argument.

### Minor changes

- New `CryptoUtils` namespace: `BrowserCryptoProvider`, a Web Crypto implementation of `@fgv/ts-extras`' `ICryptoProvider` that is byte-compatible with `NodeCryptoProvider`, plus `HpkeProvider` and `IdbPrivateKeyStorage`, an IndexedDB private-key backend for `KeyStore`.
- New writable, persistent browser `FileTree` backends: `LocalStorageTreeAccessors`, `HttpTreeAccessors` (the client for `@fgv/ts-http-storage`), and `FileSystemAccessTreeAccessors` with `DirectoryHandleStore`.
- New `SaferFetch.browserSaferFetchBytes` / `browserSaferFetchText` / `browserSaferFetchJson`, the browser entry points for `@fgv/ts-extras`' safer-fetch.

### Patches

- Packaging: the MIT `LICENSE` file and `CAPABILITIES.md` now ship in the package, test files no longer do. New runtime dependency `idb-keyval`.

### Updates

- Upgrading from 5.0.2: `BrowserHashProvider` is still exported at the root, and is now also available as `CryptoUtils.BrowserHashProvider`.

## 5.0.2
Wed, 17 Dec 2025 18:08:09 GMT

### Updates

- dual-publish

## 5.0.1
Tue, 23 Sep 2025 03:13:55 GMT

_Version update only_

## 5.0.0
Tue, 23 Sep 2025 02:52:31 GMT

### Updates

- initial checkin

