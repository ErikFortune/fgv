# Change Log - @fgv/ts-extras-webauthn

This log was last generated on Fri, 20 Nov 2026 05:01:24 GMT and should not be manually modified.

## 5.1.0
Fri, 20 Nov 2026 05:01:24 GMT

### Minor changes

- Initial release: a Result boundary over `@simplewebauthn/server` — `generateRegistrationOptions`, `verifyRegistrationResponse`, `generateAuthenticationOptions` and `verifyAuthenticationResponse` return `Result`s instead of throwing. The browser half is `@fgv/ts-web-extras-webauthn`.

