/*
 * Copyright (c) 2025 Erik Fortune
 *
 * Permission is hereby granted, free of charge, to any person obtaining a copy
 * of this software and associated documentation files (the "Software"), to deal
 * in the Software without restriction, including without limitation the rights
 * to use, copy, modify, merge, publish, distribute, sublicense, and/or sell
 * copies of the Software, and to permit persons to whom the Software is
 * furnished to do so, subject to the following conditions:
 *
 * The above copyright notice and this permission notice shall be included in all
 * copies or substantial portions of the Software.
 *
 * THE SOFTWARE IS PROVIDED "AS IS", WITHOUT WARRANTY OF ANY KIND, EXPRESS OR
 * IMPLIED, INCLUDING BUT NOT LIMITED TO THE WARRANTIES OF MERCHANTABILITY,
 * FITNESS FOR A PARTICULAR PURPOSE AND NONINFRINGEMENT. IN NO EVENT SHALL THE
 * AUTHORS OR COPYRIGHT HOLDERS BE LIABLE FOR ANY CLAIM, DAMAGES OR OTHER
 * LIABILITY, WHETHER IN AN ACTION OF CONTRACT, TORT OR OTHERWISE, ARISING FROM,
 * OUT OF OR IN CONNECTION WITH THE SOFTWARE OR THE USE OR OTHER DEALINGS IN THE
 * SOFTWARE.
 */

import { Brand, mapResults, Result, succeed } from '@fgv/ts-utils';

/**
 * @public
 */
export type ResourcePath = Brand<string, 'ResourcePath'>;

/**
 * @public
 */
export type ResourceName = Brand<string, 'ResourceName'>;

/**
 * Static class that provides utility methods for working with resource {@link ResourceName | names}
 * and {@link ResourcePath | paths}.
 * @public
 */
export class ResourceNames {
  /**
   * The root of the resource path hierarchy.
   */
  public static readonly resourceRoot: ResourcePath = '//' as ResourcePath;

  private constructor() {}

  /**
   * Determines if a string is a valid {@link ResourceName | ResourceName}.
   * @param name - the string to be tested
   * @returns `true` if the string is a valid {@link ResourceName | ResourceName}, `false` otherwise.
   * @public
   */
  public static isValidName(name: string): name is ResourceName {
    return /^[-_a-zA-Z0-9]+$/.test(name);
  }

  /**
   * Validates a supplied `unknown` value to determine if it is a valid {@link ResourceName | ResourceName}.
   * @param from - the value to be tested
   * @returns `Success` with the validated {@link ResourceName | ResourceName} if the value is valid,
   * `Failure` with an error message otherwise.
   * @public
   */
  public static validateName(from: unknown): Result<ResourceName> {
    if (typeof from !== 'string') {
      return fail('ResourceName must be a string');
    }
    if (this.isValidName(from)) {
      return succeed(from);
    }
    return fail(`${from}: invalid resource name.`);
  }

  /**
   * Determines if a supplied string is a valid {@link ResourcePath | ResourcePath}.
   * @param name - the string to be tested
   * @returns `true` if the string is a valid {@link ResourcePath | ResourcePath}, `false` otherwise.
   * @public
   */
  public static isValidPath(name: string): name is ResourcePath {
    return /^\/\/([-_a-zA-Z0-9]+\/)*([-_a-zA-Z0-9]*)?$/.test(name);
  }

  /**
   * Validates a supplied `unknown` value to determine if it is a valid {@link ResourcePath | ResourcePath}.
   * @param from - the value to be tested
   * @returns `Success` with the validated {@link ResourceName | ResourceName} if the value is valid,
   * `Failure` with an error message otherwise.
   * @public
   */
  public static validatePath(from: unknown): Result<ResourcePath> {
    if (typeof from !== 'string') {
      return fail('ResourcePath must be a string');
    }
    if (this.isValidPath(from)) {
      return succeed(from);
    }
    return fail(`${from}: invalid resource path.`);
  }

  /**
   * Gets the parent path (head) of a supplied {@link ResourcePath | resource path}.
   * @param path - the path for which the parent path will be returned.
   * @returns `Success` with the parent path if the path is valid, `Failure` with an error message otherwise.
   */
  public static parent(path: ResourcePath): Result<ResourcePath> {
    if (path === this.resourceRoot) {
      return fail('root path has no parent');
    }
    return this.split(path).onSuccess((parts) => {
      return this.validatePath(['/', ...parts.slice(0, parts.length - 1)].join('/'));
    });
  }

  /**
   * Gets the basename (tail) of a supplied {@link ResourcePath | resource path}.
   * @param path - the path for which the parent path will be returned.
   * @returns `Success` with the basename if the path is valid, `Failure` with an error message otherwise.
   */
  public static basename(path: ResourcePath): Result<ResourceName> {
    if (path === this.resourceRoot) {
      return fail('root path has no basename');
    }
    return this.split(path).onSuccess((parts) => succeed(parts[parts.length - 1]));
  }

  /**
   * Constructs a path from a base path and one or more resource names.
   * @param path - the path to which the name will be appended.
   * @param names - the names to append.
   * @returns `Success` with the new path if the join is successful, `Failure` with an error message otherwise.
   * @public
   */
  public static join(path: ResourcePath, ...names: ResourceName[]): Result<ResourcePath> {
    return this.validatePath(['/', this._trim(path), ...names].join('/'));
  }

  /**
   * Splits a supplied {@link ResourcePath | resource path} into its component {@link ResourceName | resource names}.
   * @param path - the path to split.
   * @returns `Success` with an array of {@link ResourceName | resource names} if the path is valid,
   * `Failure` with an error message otherwise.
   * @public
   */
  public static split(path: ResourcePath): Result<ResourceName[]> {
    return this.validatePath(path).onSuccess((p) => {
      return mapResults(
        this._trim(p)
          .split('/')
          .map((part) => this.validateName(part))
      );
    });
  }

  private static _trim(path: ResourcePath): string {
    return path.replace(/^\/\//, '').replace(/\/+$/, '');
  }
}
