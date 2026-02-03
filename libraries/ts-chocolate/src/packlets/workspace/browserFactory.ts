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

import { fail, Result } from '@fgv/ts-utils';
import { CryptoUtils } from '@fgv/ts-web-extras';
import { IWorkspaceFactoryParams } from './model';
import { Workspace } from './workspace';

/**
 * Creates a workspace with browser platform defaults.
 * Uses BrowserCryptoProvider for key store and encryption operations.
 *
 * @param params - Workspace creation parameters (without crypto provider)
 * @returns Success with workspace, or Failure if creation fails
 * @public
 */
export function createBrowserWorkspace(params?: IWorkspaceFactoryParams): Result<Workspace> {
  // Create browser crypto provider
  const cryptoResult = CryptoUtils.createBrowserCryptoProvider();
  if (cryptoResult.isFailure()) {
    return fail(`Failed to create browser crypto provider: ${cryptoResult.message}`);
  }
  const cryptoProvider = cryptoResult.value;

  return Workspace.create({
    ...params,
    keyStore: params?.keyStoreFile
      ? {
          file: params.keyStoreFile,
          cryptoProvider
        }
      : undefined
  });
}
