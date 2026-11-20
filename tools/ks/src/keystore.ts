import fs from 'fs';

import { CryptoUtils } from '@fgv/ts-extras';
import { Result, captureResult, fail, succeed } from '@fgv/ts-utils';

import { defaultKeystorePath, readTextFile, resolvePath, writeTextFile } from './io';

export interface IKeystoreOpenResult {
  readonly path: string;
  readonly keystore: CryptoUtils.KeyStore.KeyStore;
}

export interface ISecretWriteOptions {
  readonly description?: string;
  readonly replace?: boolean;
}

export function resolveKeystorePath(filePath?: string): string {
  return resolvePath(filePath ?? defaultKeystorePath());
}

export function loadKeystoreFile(resolvedPath: string): Result<CryptoUtils.KeyStore.IKeyStoreFile> {
  return readTextFile(resolvedPath)
    .onSuccess((contents) =>
      captureResult(() => JSON.parse(contents)).withErrorFormat(
        (msg) => `Invalid keystore file '${resolvedPath}': ${msg}`
      )
    )
    .onSuccess((json) =>
      CryptoUtils.KeyStore.Converters.keystoreFile
        .convert(json)
        .withErrorFormat((msg) => `Invalid keystore file '${resolvedPath}': ${msg}`)
    );
}

export function saveKeystoreFile(
  filePath: string | undefined,
  keystoreFile: CryptoUtils.KeyStore.IKeyStoreFile
): Result<string> {
  const resolvedPath = resolveKeystorePath(filePath);
  const serialized = `${JSON.stringify(keystoreFile, null, 2)}\n`;
  return writeTextFile(resolvedPath, serialized);
}

export async function openKeystore(
  filePath: string | undefined,
  password: string
): Promise<Result<IKeystoreOpenResult>> {
  const resolvedPath = resolveKeystorePath(filePath);
  return loadKeystoreFile(resolvedPath)
    .onSuccess((file) =>
      CryptoUtils.KeyStore.KeyStore.open({
        cryptoProvider: CryptoUtils.nodeCryptoProvider,
        keystoreFile: file
      })
    )
    .thenOnSuccess((store) => store.unlock(password))
    .onSuccess((keystore) => succeed({ path: resolvedPath, keystore }));
}

export async function createKeystore(
  filePath: string | undefined,
  password: string
): Promise<Result<IKeystoreOpenResult>> {
  const resolvedPath = resolveKeystorePath(filePath);
  if (fs.existsSync(resolvedPath)) {
    const readable = readTextFile(resolvedPath);
    if (readable.isFailure()) {
      return fail(`Keystore file at '${resolvedPath}' exists but cannot be read: ${readable.message}`);
    }
    return fail(`Keystore already exists at '${resolvedPath}'`);
  }

  const created = CryptoUtils.KeyStore.KeyStore.create({
    cryptoProvider: CryptoUtils.nodeCryptoProvider
  });
  if (created.isFailure()) {
    return fail(`Failed to create keystore: ${created.message}`);
  }

  const keystore = created.value;
  const initialized = await keystore.initialize(password);
  if (initialized.isFailure()) {
    return fail(`Failed to initialize keystore: ${initialized.message}`);
  }

  const saved = await keystore.save(password);
  if (saved.isFailure()) {
    return fail(`Failed to save keystore: ${saved.message}`);
  }

  const savedFile = saveKeystoreFile(resolvedPath, saved.value);
  if (savedFile.isFailure()) {
    return fail(`Failed to write keystore file: ${savedFile.message}`);
  }

  return succeed({ path: resolvedPath, keystore });
}

export async function changeKeystorePassword(
  filePath: string | undefined,
  currentPassword: string,
  nextPassword: string
): Promise<Result<IKeystoreOpenResult>> {
  const opened = await openKeystore(filePath, currentPassword);
  if (opened.isFailure()) {
    return fail(opened.message);
  }

  const changed = await opened.value.keystore.changePassword(currentPassword, nextPassword);
  if (changed.isFailure()) {
    return fail(`Failed to change password: ${changed.message}`);
  }

  const saved = await opened.value.keystore.save(nextPassword);
  if (saved.isFailure()) {
    return fail(`Failed to save keystore: ${saved.message}`);
  }

  const persisted = saveKeystoreFile(opened.value.path, saved.value);
  if (persisted.isFailure()) {
    return fail(`Failed to write keystore file: ${persisted.message}`);
  }

  return succeed(opened.value);
}

export async function storeSecret(
  filePath: string | undefined,
  password: string,
  name: string,
  value: string,
  options?: ISecretWriteOptions
): Promise<Result<string>> {
  const opened = await openKeystore(filePath, password);
  if (opened.isFailure()) {
    return fail(opened.message);
  }

  const writeResult = await opened.value.keystore.importApiKey(name, value, {
    description: options?.description,
    replace: options?.replace
  });
  if (writeResult.isFailure()) {
    return fail(`Failed to store secret '${name}': ${writeResult.message}`);
  }

  const saved = await opened.value.keystore.save(password);
  if (saved.isFailure()) {
    return fail(`Failed to save keystore: ${saved.message}`);
  }

  return saveKeystoreFile(opened.value.path, saved.value).withErrorFormat(
    (msg) => `Failed to write keystore file: ${msg}`
  );
}

export async function readSecret(
  filePath: string | undefined,
  password: string,
  name: string
): Promise<Result<string>> {
  return (await openKeystore(filePath, password)).onSuccess((opened) => opened.keystore.getApiKey(name));
}

export async function listSecrets(
  filePath: string | undefined,
  password: string
): Promise<Result<readonly string[]>> {
  return (await openKeystore(filePath, password)).onSuccess((opened) => opened.keystore.listSecrets());
}

export async function removeSecret(
  filePath: string | undefined,
  password: string,
  name: string
): Promise<Result<string>> {
  const opened = await openKeystore(filePath, password);
  if (opened.isFailure()) {
    return fail(opened.message);
  }

  const removed = await opened.value.keystore.removeSecret(name);
  if (removed.isFailure()) {
    return fail(`Failed to remove secret '${name}': ${removed.message}`);
  }

  const saved = await opened.value.keystore.save(password);
  if (saved.isFailure()) {
    return fail(`Failed to save keystore: ${saved.message}`);
  }

  return saveKeystoreFile(opened.value.path, saved.value).withErrorFormat(
    (msg) => `Failed to write keystore file: ${msg}`
  );
}
