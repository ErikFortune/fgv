// Copyright (c) 2026 Erik Fortune
//
// Permission is hereby granted, free of charge, to any person obtaining a copy
// of this software and associated documentation files (the "Software"), to deal
// in the Software without restriction, including without limitation the rights
// to use, copy, modify, merge, publish, distribute, sublicense, and/or sell
// copies of the Software, and to permit persons to whom the Software is
// furnished to do so, subject to the following conditions:
//
// The above copyright notice and this permission notice shall be included in all
// copies or substantial portions of the Software.
//
// THE SOFTWARE IS PROVIDED "AS IS", WITHOUT WARRANTY OF ANY KIND, EXPRESS OR
// IMPLIED, INCLUDING BUT NOT LIMITED TO THE WARRANTIES OF MERCHANTABILITY,
// FITNESS FOR A PARTICULAR PURPOSE AND NONINFRINGEMENT. IN NO EVENT SHALL THE
// AUTHORS OR COPYRIGHT HOLDERS BE LIABLE FOR ANY CLAIM, DAMAGES OR OTHER
// LIABILITY, WHETHER IN AN ACTION OF CONTRACT, TORT OR OTHERWISE, ARISING FROM,
// OUT OF OR IN CONNECTION WITH THE SOFTWARE OR THE USE OR OTHER DEALINGS IN THE
// SOFTWARE.

import { JsonValue } from '@fgv/ts-json-base';
import { Result, fail, succeed } from '@fgv/ts-utils';
import { createEncryptedFile } from './encryptedFile';
import { ICryptoProvider, IEncryptedFile, IEncryptionProvider } from './model';

/**
 * Parameters for creating a {@link DirectEncryptionProvider}.
 * @public
 */
export interface IDirectEncryptionProviderParams {
  /**
   * The crypto provider to use for encryption operations.
   */
  readonly cryptoProvider: ICryptoProvider;

  /**
   * The encryption key (32 bytes for AES-256).
   */
  readonly key: Uint8Array;

  /**
   * Optional bound secret name.
   * When set, `encryptByName` will fail if called with a different name.
   * When unset, any secret name is accepted.
   */
  readonly boundSecretName?: string;
}

/**
 * An {@link IEncryptionProvider} that uses a pre-supplied key and crypto provider.
 *
 * This is useful when you have the raw encryption key from an external source
 * (e.g. a `SecretProvider` callback, password derivation, or a one-shot
 * operation) and don't want to open a full KeyStore.
 *
 * Optionally bound to a specific secret name for safety: if a `boundSecretName`
 * is provided, calls to `encryptByName` with a different name will fail.
 *
 * @example
 * ```typescript
 * const provider = DirectEncryptionProvider.create({
 *   cryptoProvider: nodeCryptoProvider,
 *   key: myKey,
 *   boundSecretName: 'my-collection'
 * }).orThrow();
 *
 * const encrypted = await provider.encryptByName('my-collection', jsonContent);
 * ```
 *
 * @public
 */
export class DirectEncryptionProvider implements IEncryptionProvider {
  private readonly _cryptoProvider: ICryptoProvider;
  private readonly _key: Uint8Array;
  private readonly _boundSecretName: string | undefined;

  private constructor(params: IDirectEncryptionProviderParams) {
    this._cryptoProvider = params.cryptoProvider;
    this._key = params.key;
    this._boundSecretName = params.boundSecretName;
  }

  /**
   * Creates a new DirectEncryptionProvider.
   * @param params - Provider configuration
   * @returns Success with provider, or Failure if parameters are invalid
   * @public
   */
  public static create(params: IDirectEncryptionProviderParams): Result<DirectEncryptionProvider> {
    if (params.key.length === 0) {
      return fail('Encryption key cannot be empty');
    }
    return succeed(new DirectEncryptionProvider(params));
  }

  /**
   * The secret name this provider is bound to, if any.
   * @public
   */
  public get boundSecretName(): string | undefined {
    return this._boundSecretName;
  }

  /**
   * {@inheritDoc IEncryptionProvider.encryptByName}
   */
  public async encryptByName<TMetadata = JsonValue>(
    secretName: string,
    content: JsonValue,
    metadata?: TMetadata
  ): Promise<Result<IEncryptedFile<TMetadata>>> {
    if (this._boundSecretName !== undefined && secretName !== this._boundSecretName) {
      return fail(
        `Secret name mismatch: requested '${secretName}' but provider is bound to '${this._boundSecretName}'`
      );
    }

    return createEncryptedFile({
      content,
      secretName,
      key: this._key,
      cryptoProvider: this._cryptoProvider,
      metadata
    });
  }
}
