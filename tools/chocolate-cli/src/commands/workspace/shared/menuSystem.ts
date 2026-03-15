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

import { select, confirm, input, Separator } from '@inquirer/prompts';
import chalk from 'chalk';

/**
 * Menu choice with value and display information.
 */
export interface IMenuChoice<T> {
  readonly value: T;
  readonly name: string;
  readonly description?: string;
  readonly disabled?: boolean | string;
}

/**
 * Special menu actions.
 */
export type MenuAction = 'back' | 'exit';

/**
 * Menu result - either a value or a special action.
 */
export type MenuResult<T> = { action: 'value'; value: T } | { action: MenuAction };

/**
 * Shows a menu and returns the selected value or action.
 */
export async function showMenu<T>(options: {
  message: string;
  choices: Array<IMenuChoice<T>>;
  pageSize?: number;
  showBack?: boolean;
  showExit?: boolean;
}): Promise<MenuResult<T>> {
  const { message, choices, pageSize = 10, showBack = true, showExit = true } = options;

  const menuChoices: Array<
    { value: T | MenuAction; name: string; description?: string; disabled?: boolean | string } | Separator
  > = [...choices];

  // Add separator and special actions
  if (showBack || showExit) {
    menuChoices.push(new Separator());
  }

  if (showBack) {
    menuChoices.push({
      value: 'back' as MenuAction,
      name: '← Back',
      description: 'Return to previous menu'
    });
  }

  if (showExit) {
    menuChoices.push({
      value: 'exit' as MenuAction,
      name: '✕ Exit',
      description: 'Exit the application'
    });
  }

  const result = await select({
    message,
    choices: menuChoices,
    pageSize
  });

  if (result === 'back' || result === 'exit') {
    return { action: result } as MenuResult<T>;
  }

  return { action: 'value', value: result as T } as MenuResult<T>;
}

/**
 * Shows a confirmation prompt.
 */
export async function confirmAction(message: string, defaultValue: boolean = true): Promise<boolean> {
  return confirm({
    message,
    default: defaultValue
  });
}

/**
 * Shows an input prompt.
 */
export async function promptInput(message: string, defaultValue?: string): Promise<string> {
  return input({
    message,
    default: defaultValue
  });
}

/**
 * Breadcrumb for menu navigation.
 */
export class MenuBreadcrumb {
  private readonly _path: string[] = [];

  public get path(): readonly string[] {
    return this._path;
  }

  public push(item: string): void {
    this._path.push(item);
  }

  public pop(): string | undefined {
    return this._path.pop();
  }

  public toString(): string {
    return this._path.join(' > ');
  }

  public clear(): void {
    this._path.length = 0;
  }
}

/**
 * Shows an info message.
 */
export function showInfo(message: string): void {
  console.log(chalk.blue('ℹ'), message);
}

/**
 * Shows a success message.
 */
export function showSuccess(message: string): void {
  console.log(chalk.green('✓'), message);
}

/**
 * Shows an error message (synchronous).
 */
export function showError(message: string): void {
  console.error(chalk.red('✗'), message);
}

/**
 * Shows a warning message.
 */
export function showWarning(message: string): void {
  console.warn(chalk.yellow('⚠'), message);
}
