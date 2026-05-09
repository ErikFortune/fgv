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

export async function loadKeystoreFile(
  filePath?: string
): Promise<Result<CryptoUtils.KeyStore.IKeyStoreFile>> {
  const resolvedPath = resolveKeystorePath(filePath);
  const contentsResult = readTextFile(resolvedPath);
  if (contentsResult.isFailure()) {
    return fail(contentsResult.message);
  }

  const jsonResult = captureResult(() => JSON.parse(contentsResult.value));
  if (jsonResult.isFailure()) {
    return fail(`Invalid keystore file '${resolvedPath}': ${jsonResult.message}`);
  }

  const fileResult = CryptoUtils.KeyStore.Converters.keystoreFile.convert(jsonResult.value);
  if (fileResult.isFailure()) {
    return fail(`Invalid keystore file '${resolvedPath}': ${fileResult.message}`);
  }

  return succeed(fileResult.value);
}

export async function saveKeystoreFile(
  filePath: string | undefined,
  keystoreFile: CryptoUtils.KeyStore.IKeyStoreFile
): Promise<Result<string>> {
  const resolvedPath = resolveKeystorePath(filePath);
  const serialized = `${JSON.stringify(keystoreFile, null, 2)}\n`;
  return writeTextFile(resolvedPath, serialized);
}

export async function openKeystore(
  filePath: string | undefined,
  password: string
): Promise<Result<IKeystoreOpenResult>> {
  const resolvedPath = resolveKeystorePath(filePath);
  const fileResult = await loadKeystoreFile(resolvedPath);
  if (fileResult.isFailure()) {
    return fail(fileResult.message);
  }

  const opened = CryptoUtils.KeyStore.KeyStore.open({
    cryptoProvider: CryptoUtils.nodeCryptoProvider,
    keystoreFile: fileResult.value
  });
  if (opened.isFailure()) {
    return fail(opened.message);
  }

  const unlocked = await opened.value.unlock(password);
  if (unlocked.isFailure()) {
    return fail(unlocked.message);
  }

  return succeed({ path: resolvedPath, keystore: unlocked.value });
}

export async function createKeystore(
  filePath: string | undefined,
  password: string
): Promise<Result<IKeystoreOpenResult>> {
  const resolvedPath = resolveKeystorePath(filePath);
  const existing = readTextFile(resolvedPath);
  if (existing.isSuccess()) {
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

  const savedFile = await saveKeystoreFile(resolvedPath, saved.value);
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

  const persisted = await saveKeystoreFile(opened.value.path, saved.value);
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
): Promise<Result<void>> {
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

  const persisted = await saveKeystoreFile(opened.value.path, saved.value);
  if (persisted.isFailure()) {
    return fail(`Failed to write keystore file: ${persisted.message}`);
  }

  return succeed(undefined);
}

export async function readSecret(
  filePath: string | undefined,
  password: string,
  name: string
): Promise<Result<string>> {
  const opened = await openKeystore(filePath, password);
  if (opened.isFailure()) {
    return fail(opened.message);
  }

  const result = opened.value.keystore.getApiKey(name);
  if (result.isFailure()) {
    return fail(result.message);
  }

  return succeed(result.value);
}

export async function listSecrets(
  filePath: string | undefined,
  password: string
): Promise<Result<readonly string[]>> {
  const opened = await openKeystore(filePath, password);
  if (opened.isFailure()) {
    return fail(opened.message);
  }

  return opened.value.keystore.listSecrets();
}

export async function removeSecret(
  filePath: string | undefined,
  password: string,
  name: string
): Promise<Result<void>> {
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

  const persisted = await saveKeystoreFile(opened.value.path, saved.value);
  if (persisted.isFailure()) {
    return fail(`Failed to write keystore file: ${persisted.message}`);
  }

  return succeed(undefined);
}
