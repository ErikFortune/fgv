/**
 * CLI entry point — sets up commander with create, sync, and patch subcommands.
 */

import { Command } from 'commander';
import { detectSourceDir } from './packlets/fs';
import { runCreate } from './commands/create';
import { runSync } from './commands/sync';
import { runPatch, parsePatchArgs } from './commands/patch';

export class RepoTemplateCli {
  private readonly _program: Command;

  public constructor() {
    this._program = new Command();
    this._setupCommands();
  }

  public async run(argv: string[]): Promise<void> {
    await this._program.parseAsync(argv);
  }

  private _setupCommands(): void {
    this._program
      .name('repo-template')
      .description('Create and maintain fgv-derived Rush monorepos')
      .version('5.1.0');

    // ── create ──
    this._program
      .command('create')
      .description('Stamp out a new fgv-derived Rush monorepo using rush init + JSONC patching')
      .requiredOption('-t, --target-dir <path>', 'Directory to create the new repo in')
      .requiredOption('-u, --repo-url <url>', 'GitHub repository URL')
      .option('-p, --version-policy <name>', 'Version policy name', 'default')
      .option('--initial-version <ver>', 'Initial version', '0.1.0')
      .option('-s, --source-dir <path>', 'Source repo for shared files (auto-detected if in fgv repo)')
      .option('--allow-existing', 'Allow target directory to already exist', false)
      .option('--no-git-init', 'Skip git init and initial commit')
      .action(async (opts) => {
        const sourceDir = opts.sourceDir ?? this._resolveSourceDir();
        await runCreate({
          targetDir: opts.targetDir,
          repoUrl: opts.repoUrl,
          versionPolicy: opts.versionPolicy,
          version: opts.initialVersion,
          sourceDir,
          allowExisting: opts.allowExisting,
          gitInit: opts.gitInit
        });
      });

    // ── sync ──
    this._program
      .command('sync')
      .description('Sync shared files from the fgv source repo to a consumer repo')
      .requiredOption('-t, --target-dir <path>', 'Consumer repo to update')
      .option('-s, --source-dir <path>', 'Source repo (auto-detected if in fgv repo)')
      .option('-n, --dry-run', 'Show what would change without modifying files', false)
      .action(async (opts) => {
        const sourceDir = opts.sourceDir ?? this._resolveSourceDir();
        await runSync({
          targetDir: opts.targetDir,
          sourceDir,
          dryRun: opts.dryRun
        });
      });

    // ── patch ──
    this._program
      .command('patch <file>')
      .description('Apply targeted edits to a JSONC config file while preserving comments')
      .allowUnknownOption(true)
      .helpOption(false)
      .action(async (file, _opts, cmd) => {
        // Parse the raw args after the file argument as patch operations
        const rawArgs = cmd.args.slice(1); // skip the file arg
        // Actually, commander passes remaining args differently. Let's get them from process.argv
        const allArgs = process.argv;
        const patchIdx = allArgs.indexOf('patch');
        const fileIdx = patchIdx + 1;
        const opArgs = allArgs.slice(fileIdx + 1);

        const operations = parsePatchArgs(opArgs);
        if (operations.length === 0) {
          console.error('No operations specified. Use --set, --uncomment, --add-to-array, etc.');
          process.exit(1);
        }
        await runPatch({ file, operations });
      });
  }

  /**
   * Auto-detect the fgv source directory by walking up from the current working directory.
   */
  private _resolveSourceDir(): string {
    const detected = detectSourceDir(process.cwd());
    if (!detected) {
      console.error(
        'ERROR: Could not auto-detect fgv source repo. ' +
          'Please specify --source-dir or run from within the fgv repository.'
      );
      process.exit(1);
    }
    return detected;
  }
}
