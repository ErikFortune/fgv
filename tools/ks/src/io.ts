import os from 'os';
import path from 'path';
import * as readline from 'readline';

import clipboardy from 'clipboardy';
import { FileTree, FileTree as FileTreeNamespace } from '@fgv/ts-json-base';
import { Result, captureAsyncResult, fail, succeed } from '@fgv/ts-utils';

function expandHome(filePath: string): string {
  if (!filePath.startsWith('~')) {
    return filePath;
  }

  const home = os.homedir();
  if (filePath === '~') {
    return home;
  }

  if (filePath.startsWith('~/')) {
    return path.join(home, filePath.substring(2));
  }

  return filePath;
}

export function resolvePath(filePath: string): string {
  return path.resolve(expandHome(filePath));
}

export function defaultKeystorePath(): string {
  return path.join(os.homedir(), '.fgv-ks');
}

export function readTextFile(filePath: string): Result<string> {
  const resolvedPath = resolvePath(filePath);
  return FileTree.forFilesystem().onSuccess((tree) =>
    tree.getFile(resolvedPath).onSuccess((file) => file.getRawContents())
  );
}

export function writeTextFile(filePath: string, contents: string): Result<string> {
  const resolvedPath = resolvePath(filePath);
  const directoryPath = path.dirname(resolvedPath);
  const fileName = path.basename(resolvedPath);

  return FileTree.forFilesystem({ mutable: true }).onSuccess((tree) => {
    const accessors = tree.hal;
    if (!FileTreeNamespace.isMutableAccessors(accessors)) {
      return fail(`Unable to write '${resolvedPath}': filesystem access is read-only`);
    }

    return accessors.createDirectory(directoryPath).onSuccess(() =>
      tree.getDirectory(directoryPath).onSuccess((directory) => {
        if (!FileTreeNamespace.isMutableDirectoryItem(directory)) {
          return fail(`Unable to write '${resolvedPath}': directory is not mutable`);
        }

        return directory.createChildFile(fileName, contents).onSuccess(() => succeed(resolvedPath));
      })
    );
  });
}

export async function readAllFromStdin(): Promise<Result<string>> {
  const result = await captureAsyncResult(async () => {
    const chunks: string[] = [];
    const input = process.stdin;
    input.setEncoding('utf8');
    input.resume();

    for await (const chunk of input) {
      chunks.push(String(chunk));
    }

    return chunks.join('');
  });

  return result.withErrorFormat((message: string) => `Failed to read from stdin: ${message}`);
}

export async function promptHidden(prompt: string): Promise<Result<string>> {
  if (!process.stdin.isTTY) {
    return fail(`Interactive prompt requires a TTY (prompt: ${prompt})`);
  }

  return new Promise<Result<string>>((resolve) => {
    const input = process.stdin;
    const output = process.stderr;
    const previousRawMode = input.isRaw;
    let value = '';
    let finished = false;

    function onData(chunk: string): void {
      for (const char of chunk) {
        if (char === '\r' || char === '\n') {
          finish(succeed(value));
          return;
        }
        if (char === '\u0003') {
          finish(fail('Prompt cancelled'));
          return;
        }
        if (char === '\u007f' || char === '\b') {
          value = value.slice(0, -1);
          continue;
        }
        value += char;
      }
    }

    function finish(result: Result<string>): void {
      if (finished) {
        return;
      }
      finished = true;
      input.off('data', onData);
      if (input.isTTY && input.isRaw && !previousRawMode) {
        input.setRawMode(false);
      }
      input.pause();
      output.write('\n');
      resolve(result);
    }

    output.write(prompt);
    input.setRawMode(true);
    input.setEncoding('utf8');
    input.resume();
    input.on('data', onData);
  });
}

export async function promptVisible(prompt: string): Promise<Result<string>> {
  if (!process.stdin.isTTY) {
    return fail(`Interactive prompt requires a TTY (prompt: ${prompt})`);
  }

  return new Promise<Result<string>>((resolve) => {
    const input = process.stdin;
    const output = process.stderr;
    const interfaceInstance = readline.createInterface({ input, output, terminal: true });
    let finished = false;

    function finish(result: Result<string>): void {
      if (finished) {
        return;
      }

      finished = true;
      interfaceInstance.close();
      output.write('\n');
      resolve(result);
    }

    interfaceInstance.on('SIGINT', () => {
      finish(fail('Prompt cancelled'));
    });

    interfaceInstance.question(prompt, (answer: string) => {
      finish(succeed(answer));
    });
  });
}

export async function copyTextToClipboard(text: string): Promise<Result<'copied'>> {
  const result = await captureAsyncResult(async () => {
    await clipboardy.write(text);
    return 'copied' as const;
  });

  return result.withErrorFormat((message: string) => `Failed to copy to clipboard: ${message}`);
}
