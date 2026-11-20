# Change Log - @fgv/ts-http-storage

This log was last generated on Fri, 20 Nov 2026 05:01:24 GMT and should not be manually modified.

## 5.1.0
Fri, 20 Nov 2026 05:01:24 GMT

### Minor changes

- Initial release: the server side of the HTTP `FileTree` backend whose client is `@fgv/ts-web-extras`' `HttpTreeAccessors`.
- `createStorageRoutes` serves the storage REST contract as Hono routes over any `IHttpStorageProvider`; `FsStorageProvider` is the filesystem-backed provider.
- Wire converters for every request and response, and an opt-in `base64` content encoding for byte-faithful file contents.

