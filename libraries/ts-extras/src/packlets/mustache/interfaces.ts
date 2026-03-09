/* c8 ignore start - Type definitions only, no runtime code */
/*
 * Copyright (c) 2020 Erik Fortune
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

/**
 * Type of a Mustache token as returned by Mustache.parse()
 * @public
 */
export type MustacheTokenType =
  | 'text' // Raw text
  | 'name' // {{ variable }} - escaped value
  | '&' // {{{ variable }}} or {{& variable }} - unescaped value
  | '#' // {{# section }} - section start
  | '^' // {{^ section }} - inverted section
  | '!' // {{! comment }} - comment
  | '>' // {{> partial }} - partial
  | '='; // {{= =}} - set delimiter

/**
 * Represents a variable reference extracted from a Mustache template.
 * @public
 */
export interface IVariableRef {
  /**
   * The raw variable name as it appears in the template (e.g., 'user.name')
   */
  readonly name: string;

  /**
   * The path segments parsed from the variable name (e.g., ['user', 'name'])
   */
  readonly path: readonly string[];

  /**
   * The type of token this variable was extracted from
   */
  readonly tokenType: MustacheTokenType;

  /**
   * Whether this variable is used in a section context (# or ^)
   * Section variables may reference arrays/objects for iteration
   */
  readonly isSection: boolean;
}

/**
 * Details about a missing variable in context validation.
 * @public
 */
export interface IMissingVariableDetail {
  /**
   * The variable reference that is missing
   */
  readonly variable: IVariableRef;

  /**
   * The path segment where the lookup failed
   * (e.g., for 'user.profile.name' if 'profile' is missing, this would be 'profile')
   */
  readonly failedAtSegment?: string;

  /**
   * The parent path that exists (e.g., ['user'] if 'user' exists but 'user.profile' does not)
   */
  readonly existingPath: readonly string[];
}

/**
 * Result of context validation, containing details about missing variables.
 * @public
 */
export interface IContextValidationResult {
  /**
   * Whether the context is valid (has all required variables)
   */
  readonly isValid: boolean;

  /**
   * Variables that are present in the context
   */
  readonly presentVariables: readonly string[];

  /**
   * Variables that are missing from the context
   */
  readonly missingVariables: readonly string[];

  /**
   * Detailed information about each missing variable
   */
  readonly missingDetails: readonly IMissingVariableDetail[];
}

/**
 * Options for template parsing and validation.
 * @public
 */
export interface IMustacheTemplateOptions {
  /**
   * Custom opening and closing tags (default: `['{{', '}}']`)
   */
  readonly tags?: readonly [string, string];

  /**
   * Whether to include comment tokens in variable extraction (default: false)
   */
  readonly includeComments?: boolean;

  /**
   * Whether to include partial references in variable extraction (default: false)
   */
  readonly includePartials?: boolean;
}

/**
 * Required version of options with all fields populated.
 * @internal
 */
export interface IRequiredMustacheTemplateOptions {
  readonly tags: [string, string];
  readonly includeComments: boolean;
  readonly includePartials: boolean;
}

/* c8 ignore stop */
