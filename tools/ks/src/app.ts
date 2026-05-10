import { Command } from 'commander';
import pkg from '../package.json';

import { CryptoUtils } from '@fgv/ts-extras';
import { Result, fail, succeed } from '@fgv/ts-utils';

import {
  copyTextToClipboard,
  defaultKeystorePath,
  promptHidden,
  promptVisible,
  readAllFromStdin,
  readTextFile,
  resolvePath
} from './io';
import { getHelpText } from './help';
import {
  changeKeystorePassword,
  createKeystore,
  listSecrets,
  readSecret,
  openKeystore,
  removeSecret,
  saveKeystoreFile,
  storeSecret
} from './keystore';
import { extractTemplateVariables, renderShellTemplate, shellQuote } from './template';

interface IKeystoreCommandOptions {
  keystore?: string;
  passwordEnv?: string;
  passwordFile?: string;
  passwordStdin?: boolean;
}

interface ISecretValueOptions {
  stdin?: boolean;
  file?: string;
}

interface IPutCommandOptions extends IKeystoreCommandOptions, ISecretValueOptions {
  name?: string;
  description?: string;
  replace?: boolean;
}

interface IGetCommandOptions extends IKeystoreCommandOptions {
  clipboard?: boolean;
}

interface IExportCommandOptions extends IKeystoreCommandOptions {
  templateFile?: string;
  templateString?: string;
  clipboard?: boolean;
  persistMissing?: boolean;
}

interface IPasswordChangeOptions extends IKeystoreCommandOptions {
  newPasswordEnv?: string;
  newPasswordFile?: string;
  newPasswordStdin?: boolean;
}

function stripTrailingNewline(value: string): string {
  return value.replace(/\r?\n$/, '');
}

function hasExplicitPasswordSource(options: IKeystoreCommandOptions | IPasswordChangeOptions): boolean {
  return Boolean(options.passwordEnv || options.passwordFile || options.passwordStdin);
}

async function readPasswordFromSource(
  options: IKeystoreCommandOptions | IPasswordChangeOptions
): Promise<Result<string>> {
  if (options.passwordFile) {
    const fileResult = await readTextFile(options.passwordFile);
    if (fileResult.isFailure()) {
      return fail(fileResult.message);
    }
    return succeed(stripTrailingNewline(fileResult.value));
  }

  if (options.passwordStdin) {
    const stdinResult = await readAllFromStdin();
    if (stdinResult.isFailure()) {
      return fail(stdinResult.message);
    }
    return succeed(stripTrailingNewline(stdinResult.value));
  }

  if (options.passwordEnv) {
    const envValue = process.env[options.passwordEnv];
    if (envValue === undefined || envValue.length === 0) {
      return fail(`Environment variable '${options.passwordEnv}' is not set`);
    }
    return succeed(envValue);
  }

  const defaultEnv = process.env.FGV_KS_PASSWORD ?? process.env.KS_PASSWORD;
  if (defaultEnv !== undefined && defaultEnv.length > 0) {
    return succeed(defaultEnv);
  }

  return fail('Password not provided');
}

async function resolvePassword(
  options: IKeystoreCommandOptions | IPasswordChangeOptions,
  label: string
): Promise<Result<string>> {
  const source = await readPasswordFromSource(options);
  if (source.isSuccess()) {
    return source;
  }

  // If an explicit source was configured and failed, surface the error rather than prompting
  if (hasExplicitPasswordSource(options)) {
    return source;
  }

  const prompted = await promptHidden(`${label}: `);
  if (prompted.isFailure()) {
    return fail(prompted.message);
  }

  return succeed(prompted.value);
}

async function resolveSecretName(
  positionalName: string | undefined,
  options: IPutCommandOptions
): Promise<Result<string>> {
  if (options.name !== undefined && options.name.length > 0) {
    return succeed(options.name);
  }

  if (positionalName !== undefined && positionalName.length > 0) {
    return succeed(positionalName);
  }

  const prompted = await promptVisible('Secret name: ');
  if (prompted.isFailure()) {
    return fail(prompted.message);
  }

  if (prompted.value.length === 0) {
    return fail('Secret name cannot be empty');
  }

  return succeed(prompted.value);
}

async function resolvePasswordConfirmed(
  options: IKeystoreCommandOptions | IPasswordChangeOptions,
  label: string
): Promise<Result<string>> {
  // Only skip confirmation when password comes from an explicit non-interactive source.
  // Ambient env vars (FGV_KS_PASSWORD/KS_PASSWORD) are for reading the current password
  // and must not silently bypass confirmation when setting a new one.
  if (hasExplicitPasswordSource(options)) {
    return resolvePassword(options, label);
  }

  const first = await promptHidden(`${label}: `);
  if (first.isFailure()) {
    return fail(first.message);
  }

  const second = await promptHidden(`${label} (confirm): `);
  if (second.isFailure()) {
    return fail(second.message);
  }

  if (first.value !== second.value) {
    return fail('Passwords do not match');
  }

  return succeed(first.value);
}

async function resolveSecretValue(options: ISecretValueOptions): Promise<Result<string>> {
  if (options.file && options.stdin) {
    return fail('Use either --file or --stdin, not both');
  }

  if (options.file) {
    const fileResult = await readTextFile(options.file);
    if (fileResult.isFailure()) {
      return fail(fileResult.message);
    }
    return succeed(stripTrailingNewline(fileResult.value));
  }

  if (options.stdin) {
    const stdinResult = await readAllFromStdin();
    if (stdinResult.isFailure()) {
      return fail(stdinResult.message);
    }
    return succeed(stripTrailingNewline(stdinResult.value));
  }

  const prompted = await promptHidden('Secret value: ');
  if (prompted.isFailure()) {
    return fail(prompted.message);
  }

  return succeed(prompted.value);
}

async function readTemplate(
  options: Pick<IExportCommandOptions, 'templateFile' | 'templateString'>
): Promise<Result<string>> {
  if (options.templateFile && options.templateString) {
    return fail('Use either --template-file or --template-string, not both');
  }

  if (options.templateFile) {
    const fileResult = await readTextFile(resolvePath(options.templateFile));
    if (fileResult.isFailure()) {
      return fail(fileResult.message);
    }
    return succeed(fileResult.value);
  }

  if (options.templateString !== undefined) {
    return succeed(options.templateString);
  }

  return fail('Specify either --template-file or --template-string');
}

interface ITemplateContextResult {
  readonly context: Record<string, string>;
  readonly missing: readonly [string, string][];
}

async function collectTemplateContext(
  keystore: CryptoUtils.KeyStore.KeyStore,
  template: string
): Promise<Result<ITemplateContextResult>> {
  const variablesResult = extractTemplateVariables(template);
  if (variablesResult.isFailure()) {
    return fail(variablesResult.message);
  }

  const secretListResult = keystore.listSecrets();
  if (secretListResult.isFailure()) {
    return fail(`Failed to list secrets: ${secretListResult.message}`);
  }
  const knownSecrets = new Set(secretListResult.value);

  const context = Object.create(null) as Record<string, string>;
  const missing: Array<[string, string]> = [];

  for (const variable of variablesResult.value) {
    const secretResult = keystore.getApiKey(variable);
    if (secretResult.isSuccess()) {
      context[variable] = secretResult.value;
      continue;
    }

    if (knownSecrets.has(variable)) {
      return fail(`Secret '${variable}' exists but is not an API key: ${secretResult.message}`);
    }

    const promptResult = await promptHidden(`Secret '${variable}' is missing. Enter value: `);
    if (promptResult.isFailure()) {
      return fail(promptResult.message);
    }

    context[variable] = promptResult.value;
    missing.push([variable, promptResult.value]);
  }

  return succeed({ context, missing });
}

export class KsCli {
  private readonly _program: Command;

  public constructor() {
    this._program = new Command();
    this._setupCommands();
  }

  public async run(argv: string[]): Promise<void> {
    await this._program.parseAsync(argv);
  }

  private _setupCommands(): void {
    this._program.name('ks').description('Manage ts-extras keystore files').version(pkg.version);
    this._program.addHelpCommand(false);

    this._program
      .command('help [topic]')
      .description('Show overview, commands, password, or template help')
      .action((topic: string | undefined) => {
        const help = getHelpText(topic, this._program);
        if (help.isFailure()) {
          console.error(`Error: ${help.message}`);
          process.exit(1);
        }

        console.log(help.value);
      });

    this._program
      .command('init')
      .description('Initialize a new keystore')
      .option('--keystore <path>', 'Keystore file path', defaultKeystorePath())
      .option('--password-env <name>', 'Environment variable to read the password from')
      .option('--password-file <path>', 'Read the password from a file')
      .option('--password-stdin', 'Read the password from stdin', false)
      .action(async (options: IKeystoreCommandOptions) => {
        const password = await resolvePasswordConfirmed(options, 'New keystore password');
        if (password.isFailure()) {
          console.error(`Error: ${password.message}`);
          process.exit(1);
        }

        const created = await createKeystore(options.keystore, password.value);
        if (created.isFailure()) {
          console.error(`Error: ${created.message}`);
          process.exit(1);
        }
      });

    this._program
      .command('password')
      .description('Change the keystore password')
      .option('--keystore <path>', 'Keystore file path', defaultKeystorePath())
      .option('--password-env <name>', 'Environment variable to read the current password from')
      .option('--password-file <path>', 'Read the current password from a file')
      .option('--password-stdin', 'Read the current password from stdin', false)
      .option('--new-password-env <name>', 'Environment variable to read the new password from')
      .option('--new-password-file <path>', 'Read the new password from a file')
      .option('--new-password-stdin', 'Read the new password from stdin', false)
      .action(async (options: IPasswordChangeOptions) => {
        const currentPassword = await resolvePassword(options, 'Current keystore password');
        if (currentPassword.isFailure()) {
          console.error(`Error: ${currentPassword.message}`);
          process.exit(1);
        }

        const newPasswordOptions: IPasswordChangeOptions = {
          keystore: options.keystore,
          passwordEnv: options.newPasswordEnv,
          passwordFile: options.newPasswordFile,
          passwordStdin: options.newPasswordStdin
        };
        const nextPassword = await resolvePasswordConfirmed(newPasswordOptions, 'New keystore password');
        if (nextPassword.isFailure()) {
          console.error(`Error: ${nextPassword.message}`);
          process.exit(1);
        }

        const changed = await changeKeystorePassword(
          options.keystore,
          currentPassword.value,
          nextPassword.value
        );
        if (changed.isFailure()) {
          console.error(`Error: ${changed.message}`);
          process.exit(1);
        }
      });

    this._program
      .command('put [name]')
      .description('Store a secret in the keystore from stdin, a file, or interactive prompts')
      .option('--keystore <path>', 'Keystore file path', defaultKeystorePath())
      .option('--password-env <name>', 'Environment variable to read the password from')
      .option('--password-file <path>', 'Read the password from a file')
      .option('--password-stdin', 'Read the password from stdin', false)
      .option('--name <name>', 'Secret name')
      .option('--stdin', 'Read the secret from stdin', false)
      .option('--file <path>', 'Read the secret from a file')
      .option('--description <text>', 'Optional secret description')
      .option('--replace', 'Replace an existing secret', false)
      .action(async (positionalName: string | undefined, options: IPutCommandOptions) => {
        const name = await resolveSecretName(positionalName, options);
        if (name.isFailure()) {
          console.error(`Error: ${name.message}`);
          process.exit(1);
        }

        const password = await resolvePassword(options, 'Keystore password');
        if (password.isFailure()) {
          console.error(`Error: ${password.message}`);
          process.exit(1);
        }

        const secret = await resolveSecretValue(options);
        if (secret.isFailure()) {
          console.error(`Error: ${secret.message}`);
          process.exit(1);
        }

        const stored = await storeSecret(options.keystore, password.value, name.value, secret.value, {
          description: options.description,
          replace: options.replace
        });
        if (stored.isFailure()) {
          console.error(`Error: ${stored.message}`);
          process.exit(1);
        }
      });

    this._program
      .command('get <name>')
      .description('Read a secret from the keystore')
      .option('--keystore <path>', 'Keystore file path', defaultKeystorePath())
      .option('--password-env <name>', 'Environment variable to read the password from')
      .option('--password-file <path>', 'Read the password from a file')
      .option('--password-stdin', 'Read the password from stdin', false)
      .option('--clipboard', 'Copy the secret to the clipboard', false)
      .action(async (name: string, options: IGetCommandOptions) => {
        const password = await resolvePassword(options, 'Keystore password');
        if (password.isFailure()) {
          console.error(`Error: ${password.message}`);
          process.exit(1);
        }

        const secret = await readSecret(options.keystore, password.value, name);
        if (secret.isFailure()) {
          console.error(`Error: ${secret.message}`);
          process.exit(1);
        }

        if (options.clipboard) {
          const copied = await copyTextToClipboard(secret.value);
          if (copied.isFailure()) {
            console.error(`Error: ${copied.message}`);
            process.exit(1);
          }
          return;
        }

        console.log(secret.value);
      });

    this._program
      .command('list')
      .description('List secrets in the keystore')
      .option('--keystore <path>', 'Keystore file path', defaultKeystorePath())
      .option('--password-env <name>', 'Environment variable to read the password from')
      .option('--password-file <path>', 'Read the password from a file')
      .option('--password-stdin', 'Read the password from stdin', false)
      .action(async (options: IKeystoreCommandOptions) => {
        const password = await resolvePassword(options, 'Keystore password');
        if (password.isFailure()) {
          console.error(`Error: ${password.message}`);
          process.exit(1);
        }

        const names = await listSecrets(options.keystore, password.value);
        if (names.isFailure()) {
          console.error(`Error: ${names.message}`);
          process.exit(1);
        }

        for (const name of names.value) {
          console.log(name);
        }
      });

    this._program
      .command('remove <name>')
      .description('Remove a secret from the keystore')
      .option('--keystore <path>', 'Keystore file path', defaultKeystorePath())
      .option('--password-env <name>', 'Environment variable to read the password from')
      .option('--password-file <path>', 'Read the password from a file')
      .option('--password-stdin', 'Read the password from stdin', false)
      .action(async (name: string, options: IKeystoreCommandOptions) => {
        const password = await resolvePassword(options, 'Keystore password');
        if (password.isFailure()) {
          console.error(`Error: ${password.message}`);
          process.exit(1);
        }

        const removed = await removeSecret(options.keystore, password.value, name);
        if (removed.isFailure()) {
          console.error(`Error: ${removed.message}`);
          process.exit(1);
        }
      });

    this._program
      .command('export')
      .description('Render a shell template using secrets from the keystore')
      .option('--keystore <path>', 'Keystore file path', defaultKeystorePath())
      .option('--password-env <name>', 'Environment variable to read the password from')
      .option('--password-file <path>', 'Read the password from a file')
      .option('--password-stdin', 'Read the password from stdin', false)
      .option('--template-file <path>', 'Read the shell template from a file')
      .option('--template-string <text>', 'Use the supplied shell template string')
      .option('--clipboard', 'Copy the rendered output to the clipboard', false)
      .option('--persist-missing', 'Persist prompted secrets back to the keystore', false)
      .action(async (options: IExportCommandOptions) => {
        const password = await resolvePassword(options, 'Keystore password');
        if (password.isFailure()) {
          console.error(`Error: ${password.message}`);
          process.exit(1);
        }

        const template = await readTemplate(options);
        if (template.isFailure()) {
          console.error(`Error: ${template.message}`);
          process.exit(1);
        }

        const opened = await openKeystore(options.keystore, password.value);
        if (opened.isFailure()) {
          console.error(`Error: ${opened.message}`);
          process.exit(1);
        }

        const contextResult = await collectTemplateContext(opened.value.keystore, template.value);
        if (contextResult.isFailure()) {
          console.error(`Error: ${contextResult.message}`);
          process.exit(1);
        }

        const rendered = renderShellTemplate(template.value, contextResult.value.context);
        if (rendered.isFailure()) {
          console.error(`Error: ${rendered.message}`);
          process.exit(1);
        }

        if (options.persistMissing && contextResult.value.missing.length > 0) {
          for (const [name, value] of contextResult.value.missing) {
            const stored = await opened.value.keystore.importApiKey(name, value, { replace: true });
            if (stored.isFailure()) {
              console.error(`Error: Failed to persist missing secret '${name}': ${stored.message}`);
              process.exit(1);
            }
          }

          const saved = await opened.value.keystore.save(password.value);
          if (saved.isFailure()) {
            console.error(`Error: ${saved.message}`);
            process.exit(1);
          }

          const persisted = await saveKeystoreFile(opened.value.path, saved.value);
          if (persisted.isFailure()) {
            console.error(`Error: ${persisted.message}`);
            process.exit(1);
          }
        }

        if (options.clipboard) {
          const copied = await copyTextToClipboard(rendered.value);
          if (copied.isFailure()) {
            console.error(`Error: ${copied.message}`);
            process.exit(1);
          }
          return;
        }

        console.log(rendered.value);
      });

    this._program
      .command('session')
      .description('Prompt for a password and emit a shell export statement')
      .option('--var <name>', 'Environment variable name to emit', 'FGV_KS_PASSWORD')
      .option('--clipboard', 'Copy the export statement to the clipboard', false)
      .action(async (options: { var?: string; clipboard?: boolean }) => {
        const varName = options.var ?? 'FGV_KS_PASSWORD';
        if (!/^[A-Za-z_][A-Za-z0-9_]*$/.test(varName)) {
          console.error(`Error: '--var' value '${varName}' is not a valid shell identifier`);
          process.exit(1);
        }

        const password = await promptHidden('Keystore password: ');
        if (password.isFailure()) {
          console.error(`Error: ${password.message}`);
          process.exit(1);
        }

        const output = `export ${varName}=${shellQuote(password.value)}`;
        if (options.clipboard) {
          const copied = await copyTextToClipboard(output);
          if (copied.isFailure()) {
            console.error(`Error: ${copied.message}`);
            process.exit(1);
          }
          return;
        }

        console.log(output);
      });
  }
}
