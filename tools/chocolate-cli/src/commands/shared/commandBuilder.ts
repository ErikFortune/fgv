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

import { Command } from 'commander';

/**
 * Adds shared data source options to a command.
 * These options are inherited by all subcommands.
 *
 * @param cmd - The command to add options to
 * @param entityName - The entity name for help text (e.g., "filling", "ingredient")
 */
export function addDataSourceOptions(cmd: Command, entityName: string = 'library'): void {
  cmd
    .option(
      '--library <path>',
      `Add file path to ${entityName} library (can be repeated)`,
      (val: string, prev: string[]) => [...prev, val],
      []
    )
    .option('--no-builtin', `Exclude built-in ${entityName}s`)
    .option(
      '-k, --key <base64>',
      'Base64-encoded 32-byte encryption key (or use CHOCO_ENCRYPTION_KEY env var)'
    )
    .option('-s, --secret-name <name>', 'Secret name for single-key mode')
    .option('--secrets-file <path>', 'Path to secrets file (YAML/JSON) mapping secret names to base64 keys');
}

/**
 * Adds output format option to a command.
 *
 * @param cmd - The command to add the option to
 */
export function addOutputFormatOption(cmd: Command): void {
  cmd.option('-f, --format <format>', 'Output format: json, yaml, table, human', 'human');
}

/**
 * Adds common filter options to a list command.
 *
 * @param cmd - The command to add options to
 */
export function addCommonFilterOptions(cmd: Command): void {
  cmd
    .option(
      '--tag <tag>',
      'Filter by tag (can be repeated)',
      (val: string, prev: string[]) => [...prev, val],
      []
    )
    .option('--collection <collectionId>', 'Filter by collection ID')
    .option('--name <pattern>', 'Filter by name (case-insensitive substring match)');
}

/**
 * Common structure for all entity commands with list/show subcommands.
 *
 * @param commandName - The command name (e.g., "filling", "ingredient")
 * @param description - The command description
 * @param listSubcommand - Factory function for the list subcommand
 * @param showSubcommand - Factory function for the show subcommand
 * @returns The configured Command
 */
export function createEntityCommand(
  commandName: string,
  description: string,
  listSubcommand: () => Command,
  showSubcommand: () => Command
): Command {
  const cmd = new Command(commandName);

  cmd.description(description);

  // Add shared options at the parent level (inherited by subcommands)
  addDataSourceOptions(cmd, commandName);
  addOutputFormatOption(cmd);

  // Add subcommands
  cmd.addCommand(listSubcommand());
  cmd.addCommand(showSubcommand());

  return cmd;
}
