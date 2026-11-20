# @fgv/ts-extras-webauthn

A Result-integration boundary over [`@simplewebauthn/server`](https://simplewebauthn.dev/). It wraps
the four server-side WebAuthn operations so they return `Promise<Result<T>>` from `@fgv/ts-utils`
instead of throwing, and re-exports the `@simplewebauthn/server` types they use. Nothing else: the
browser half is [`@fgv/ts-web-extras-webauthn`](../ts-web-extras-webauthn).

## Installation

```sh
npm install @fgv/ts-extras-webauthn @fgv/ts-utils
```

`@fgv/ts-utils` is a peer dependency. `@simplewebauthn/server` (`^13`) is a direct dependency.

## Usage

```ts
import { generateRegistrationOptions, verifyRegistrationResponse } from '@fgv/ts-extras-webauthn';

const options = await generateRegistrationOptions({
  rpName: 'Example',
  rpID: 'example.com',
  userName: 'alice'
});
// send options.value to the browser and keep options.value.challenge for verification

const verified = await verifyRegistrationResponse({
  response: registrationResponseFromBrowser,
  expectedChallenge,
  expectedOrigin: 'https://example.com',
  expectedRPID: 'example.com'
});
```

| function | returns |
|---|---|
| `generateRegistrationOptions(opts)` | `Promise<Result<PublicKeyCredentialCreationOptionsJSON>>` |
| `verifyRegistrationResponse(opts)` | `Promise<Result<VerifiedRegistrationResponse>>` |
| `generateAuthenticationOptions(opts)` | `Promise<Result<PublicKeyCredentialRequestOptionsJSON>>` |
| `verifyAuthenticationResponse(opts)` | `Promise<Result<VerifiedAuthenticationResponse>>` |

The options are `@simplewebauthn/server`'s own, passed through unchanged. Challenge storage,
credential storage, session issuance and ceremony orchestration are yours; for anything beyond these
four calls, use `@simplewebauthn/server` directly. See [CAPABILITIES.md](./CAPABILITIES.md) for what
is deliberately out of scope.

## License

MIT — see [LICENSE](./LICENSE).
