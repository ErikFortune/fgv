# @fgv/ts-http-storage

The server side of the HTTP `FileTree` backend. It defines the storage REST contract that
`HttpTreeAccessors` in [`@fgv/ts-web-extras`](../ts-web-extras) is the client for, builds
[Hono](https://hono.dev/) routes that serve it, and ships a filesystem-backed provider. Storage is
partitioned by namespace; each request may name one, and an absent namespace means `default`.

## Installation

```sh
npm install @fgv/ts-http-storage @fgv/ts-utils
```

`hono` is a direct dependency.

## Usage

```ts
import { Hono } from 'hono';
import { FsStorageProviderFactory, createStorageRoutes } from '@fgv/ts-http-storage';

const app = new Hono();
app.route(
  '/storage',
  createStorageRoutes({ providers: new FsStorageProviderFactory({ rootPath: './data' }) })
);
```

`createStorageRoutes` returns a `Hono` app with these routes:

| route | does |
|---|---|
| `GET /health` | syncs the namespace and reports `{ status: 'ok', namespace }` |
| `GET /tree/item?path=&namespace=` | one item |
| `GET /tree/children?path=&namespace=` | a directory's children |
| `GET /file?path=&namespace=&encoding=` | a file's contents; `encoding` is `utf8` (default) or `base64` |
| `PUT /file` | write a file's text contents |
| `DELETE /file?path=&namespace=` | delete a file |
| `POST /directories` | create a directory |
| `POST /sync` | sync a namespace |

Requests and responses are validated with the exported converters. The routes do no
authentication or authorization; mount them behind your own middleware.

`FsStorageProviderFactory` maps each namespace to a subdirectory of `rootPath` (names are limited to
`[a-zA-Z0-9._-]`) and creates it on first use. To store somewhere else, implement
`IHttpStorageProvider` and `IHttpStorageProviderFactory` and pass your factory as `providers`.

On the client, point `HttpTreeAccessors.fromHttp({ baseUrl: 'https://host/storage' })` from
`@fgv/ts-web-extras` at the mount path.

`utf8` reads are lossy for bytes that are not valid UTF-8; request `base64` when you need the stored
bytes exactly. Writes carry text only. See [CAPABILITIES.md](./CAPABILITIES.md) for the encoding
contract and the rest of the surface.

## License

MIT — see [LICENSE](./LICENSE).
