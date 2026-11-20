/**
 * Web-only helper that loads and unlocks a `CryptoUtils.KeyStore.KeyStore` vault from a
 * user-selected file. Browser-only concept (the `File` API + `BrowserCryptoProvider` from
 * `@fgv/ts-web-extras`) — the CLI surface has no equivalent (it resolves secrets from
 * `process.env` only), so this lives in `web/`, not the surface-agnostic `shell/`.
 *
 * @packageDocumentation
 */

import { captureAsyncResult, type Converter, type Result } from '@fgv/ts-utils';
import { Converters as JsonConverters } from '@fgv/ts-json-base';
import { CryptoUtils } from '@fgv/ts-extras';
import { CryptoUtils as WebCryptoUtils } from '@fgv/ts-web-extras';

/**
 * Parses a keystore file's raw text into the typed `IKeyStoreFile` shape in one step —
 * `Converters.stringifiedJson`'s inner-converter form runs `JSON.parse` and the library's
 * own `keystoreFile` converter together, so there is no intermediate `unknown`/cast step.
 */
const keystoreFileConverter: Converter<CryptoUtils.KeyStore.IKeyStoreFile> =
  JsonConverters.stringifiedJson<CryptoUtils.KeyStore.IKeyStoreFile>(
    CryptoUtils.KeyStore.Converters.keystoreFile
  );

/**
 * Reads `file`, parses + validates it as a keystore vault, opens it with a fresh
 * `BrowserCryptoProvider`, and unlocks it with `password`. Every failure mode (unreadable
 * file, malformed JSON, wrong vault format, incorrect password) surfaces as a friendly
 * `Result` failure — nothing here throws.
 *
 * @param file - The user-selected keystore file (from an `<input type="file">`).
 * @param password - The vault's master password.
 * @returns The unlocked `KeyStore` instance, or a `Failure` describing what went wrong.
 * @public
 */
export async function openKeyStoreFromFile(
  file: File,
  password: string
): Promise<Result<CryptoUtils.KeyStore.KeyStore>> {
  return captureAsyncResult(() => file.text())
    .withErrorFormat((msg) => `Failed to read keystore file: ${msg}`)
    .onSuccess((text) =>
      keystoreFileConverter.convert(text).withErrorFormat((msg) => `Invalid keystore file: ${msg}`)
    )
    .onSuccess((keystoreFile) =>
      CryptoUtils.KeyStore.KeyStore.open({
        cryptoProvider: new WebCryptoUtils.BrowserCryptoProvider(),
        keystoreFile
      })
    )
    .thenOnSuccess(async (keyStore) => keyStore.unlock(password));
}
