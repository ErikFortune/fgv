/**
 * \@fgv/ks — CLI tool for managing ts-extras keystore files.
 *
 * @packageDocumentation
 */

export { KsCli } from './app';
export {
  changeKeystorePassword,
  createKeystore,
  loadKeystoreFile,
  listSecrets,
  openKeystore,
  readSecret,
  removeSecret,
  resolveKeystorePath,
  saveKeystoreFile,
  storeSecret
} from './keystore';
export { defaultKeystorePath, copyTextToClipboard, promptHidden, readAllFromStdin, readTextFile } from './io';
export { extractTemplateVariables, renderShellTemplate, shellQuote } from './template';
