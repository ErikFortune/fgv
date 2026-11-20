# @fgv/ts-web-extras-webauthn

A Result-integration boundary over [`@simplewebauthn/browser`](https://simplewebauthn.dev/). It wraps
the two browser-side WebAuthn ceremonies so they return `Promise<Result<T>>` from `@fgv/ts-utils`
instead of throwing, and re-exports the `@simplewebauthn/browser` types they use. Nothing else: the
server half is [`@fgv/ts-extras-webauthn`](../ts-extras-webauthn).

## Installation

```sh
npm install @fgv/ts-web-extras-webauthn @fgv/ts-utils
```

`@fgv/ts-utils` is a peer dependency. `@simplewebauthn/browser` (`^13`) is a direct dependency.

## Usage

```ts
import { startAuthentication, startRegistration } from '@fgv/ts-web-extras-webauthn';

// optionsJSON comes from the server's generateRegistrationOptions
const registration = await startRegistration({ optionsJSON });
if (registration.isSuccess()) {
  // send registration.value to the server for verifyRegistrationResponse
}

const assertion = await startAuthentication({ optionsJSON: authenticationOptionsJSON });
```

| function | returns |
|---|---|
| `startRegistration(opts)` | `Promise<Result<RegistrationResponseJSON>>` |
| `startAuthentication(opts)` | `Promise<Result<AuthenticationResponseJSON>>` |

The options are `@simplewebauthn/browser`'s own, passed through unchanged. A cancelled or failed
ceremony is a `Failure` carrying the upstream error's message. For anything beyond these two calls,
use `@simplewebauthn/browser` directly. See [CAPABILITIES.md](./CAPABILITIES.md) for what is
deliberately out of scope.

## License

MIT — see [LICENSE](./LICENSE).
