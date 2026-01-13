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

import { Result, captureResult, fail, succeed } from '@fgv/ts-utils';
import Mustache, { TemplateSpans } from 'mustache';

import {
  IContextValidationResult,
  IMissingVariableDetail,
  IMustacheTemplateOptions,
  IRequiredMustacheTemplateOptions,
  IVariableRef,
  MustacheTokenType
} from './interfaces';

/**
 * Default options for MustacheTemplate
 */
const DEFAULT_OPTIONS: IRequiredMustacheTemplateOptions = {
  tags: ['{{', '}}'],
  includeComments: false,
  includePartials: false
};

/**
 * A helper class for working with Mustache templates that provides
 * validation, variable extraction, and context validation utilities.
 * @public
 */
export class MustacheTemplate {
  /**
   * The original template string
   */
  public readonly template: string;

  /**
   * The options used for parsing this template
   */
  public readonly options: Readonly<IRequiredMustacheTemplateOptions>;

  private readonly _tokens: TemplateSpans;
  private _variables?: readonly IVariableRef[];

  private constructor(template: string, tokens: TemplateSpans, options: IRequiredMustacheTemplateOptions) {
    this.template = template;
    this._tokens = tokens;
    this.options = options;
  }

  /**
   * Creates a new MustacheTemplate instance.
   * @param template - The Mustache template string to parse
   * @param options - Optional parsing options
   * @returns Success with the template instance, or Failure if parsing fails
   */
  public static create(template: string, options?: IMustacheTemplateOptions): Result<MustacheTemplate> {
    const resolvedOptions = MustacheTemplate._resolveOptions(options);
    return MustacheTemplate._parseTokens(template, resolvedOptions).onSuccess((tokens) => {
      return succeed(new MustacheTemplate(template, tokens, resolvedOptions));
    });
  }

  /**
   * Validates that a template string has valid Mustache syntax.
   * @param template - The template string to validate
   * @param options - Optional parsing options
   * @returns Success with true if valid, or Failure with a descriptive error message
   */
  public static validate(template: string, options?: IMustacheTemplateOptions): Result<true> {
    const resolvedOptions = MustacheTemplate._resolveOptions(options);
    return MustacheTemplate._parseTokens(template, resolvedOptions).onSuccess(() => succeed(true as const));
  }

  /**
   * Checks if this template instance has valid syntax.
   * Always returns Success(true) since parsing succeeded in create().
   * @returns Success with true
   */
  public validate(): Result<true> {
    return succeed(true as const);
  }

  /**
   * Extracts all variable references from the template.
   * @returns An array of variable references found in the template
   */
  public extractVariables(): readonly IVariableRef[] {
    if (this._variables === undefined) {
      this._variables = this._extractVariablesFromTokens(this._tokens);
    }
    return this._variables;
  }

  /**
   * Extracts unique variable names from the template.
   * @returns An array of unique variable name strings (e.g., ['user.name', 'items'])
   */
  public extractVariableNames(): readonly string[] {
    const variables = this.extractVariables();
    const seen = new Set<string>();
    const names: string[] = [];

    for (const variable of variables) {
      if (!seen.has(variable.name)) {
        seen.add(variable.name);
        names.push(variable.name);
      }
    }

    return names;
  }

  /**
   * Validates that a context object has all required variables.
   * @param context - The context object to validate
   * @returns Success with validation result containing details about present/missing variables
   */
  public validateContext(context: unknown): Result<IContextValidationResult> {
    const variables = this.extractVariables();
    const presentVariables: string[] = [];
    const missingVariables: string[] = [];
    const missingDetails: IMissingVariableDetail[] = [];
    const checked = new Set<string>();

    for (const variable of variables) {
      if (checked.has(variable.name)) {
        continue;
      }
      checked.add(variable.name);

      const lookup = this._lookupPath(context, variable.path);

      if (lookup.found) {
        presentVariables.push(variable.name);
      } else {
        missingVariables.push(variable.name);
        missingDetails.push({
          variable,
          failedAtSegment: lookup.failedAt,
          existingPath: lookup.existingPath
        });
      }
    }

    return succeed({
      isValid: missingVariables.length === 0,
      presentVariables,
      missingVariables,
      missingDetails
    });
  }

  /**
   * Renders the template with the given context.
   * Use this for pre-validated contexts where you've already checked
   * that all required variables are present.
   * @param context - The context object for template rendering
   * @returns Success with the rendered string, or Failure if rendering fails
   */
  public render(context: unknown): Result<string> {
    return captureResult(() => Mustache.render(this.template, context));
  }

  /**
   * Validates the context and renders the template if validation passes.
   * @param context - The context object to validate and render with
   * @returns Success with the rendered string, or Failure with validation or render errors
   */
  public validateAndRender(context: unknown): Result<string> {
    return this.validateContext(context).onSuccess((validation) => {
      if (!validation.isValid) {
        const missing = validation.missingVariables.join(', ');
        return fail(`Missing required variables: ${missing}`);
      }
      return this.render(context);
    });
  }

  private static _resolveOptions(options?: IMustacheTemplateOptions): IRequiredMustacheTemplateOptions {
    if (options === undefined) {
      return DEFAULT_OPTIONS;
    }

    return {
      tags: options.tags ? [options.tags[0], options.tags[1]] : DEFAULT_OPTIONS.tags,
      includeComments: options.includeComments ?? DEFAULT_OPTIONS.includeComments,
      includePartials: options.includePartials ?? DEFAULT_OPTIONS.includePartials
    };
  }

  private static _parseTokens(
    template: string,
    options: IRequiredMustacheTemplateOptions
  ): Result<TemplateSpans> {
    return captureResult(() => Mustache.parse(template, options.tags));
  }

  private _extractVariablesFromTokens(tokens: TemplateSpans): IVariableRef[] {
    const variables: IVariableRef[] = [];

    for (const token of tokens) {
      const type = token[0] as MustacheTokenType;
      const value = token[1] as string;

      // Skip text tokens
      if (type === 'text') {
        continue;
      }

      // Handle comments based on options
      if (type === '!' && !this.options.includeComments) {
        continue;
      }

      // Handle partials based on options
      if (type === '>' && !this.options.includePartials) {
        continue;
      }

      // Handle variable tokens: 'name', '&', '#', '^', and optionally '!', '>'
      if (type === 'name' || type === '&' || type === '#' || type === '^' || type === '!' || type === '>') {
        const isSection = type === '#' || type === '^';
        variables.push({
          name: value,
          path: this._parsePath(value),
          tokenType: type,
          isSection
        });
      }

      // Recursively extract from nested tokens in sections
      if ((type === '#' || type === '^') && token.length > 4) {
        const nestedTokens = token[4] as TemplateSpans;
        if (nestedTokens) {
          variables.push(...this._extractVariablesFromTokens(nestedTokens));
        }
      }
    }

    return variables;
  }

  private _parsePath(name: string): readonly string[] {
    // Handle special case of '.' which means current context
    if (name === '.') {
      return ['.'];
    }

    // Split on dots to get path segments
    return name.split('.').filter((segment) => segment.length > 0);
  }

  private _lookupPath(
    context: unknown,
    path: readonly string[]
  ): { found: boolean; existingPath: string[]; failedAt?: string } {
    // Handle '.' which always exists if context is not null/undefined
    if (path.length === 1 && path[0] === '.') {
      return { found: context !== undefined && context !== null, existingPath: [] };
    }

    let current: unknown = context;
    const existingPath: string[] = [];

    for (const segment of path) {
      if (current === undefined || current === null) {
        return { found: false, existingPath, failedAt: segment };
      }

      if (typeof current !== 'object') {
        return { found: false, existingPath, failedAt: segment };
      }

      const obj = current as Record<string, unknown>;
      if (!(segment in obj)) {
        return { found: false, existingPath, failedAt: segment };
      }

      current = obj[segment];
      existingPath.push(segment);
    }

    return { found: true, existingPath };
  }
}
