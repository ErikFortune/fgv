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

import { Result, captureResult, succeed } from '@fgv/ts-utils';
import { CompositeJsonMap } from './compositeJsonMap';
import {
  IJsonContext,
  IJsonReferenceMap,
  TemplateVars,
  VariableValue,
  defaultExtendVars
} from './jsonContext';

/**
 * Helper class for working with {@link IJsonContext | IJsonContext} objects.
 * @public
 */
export class JsonContextHelper {
  /**
   * The base {@link IJsonContext | context} on which we are operating.
   * @internal
   */
  protected _context?: IJsonContext;

  /**
   * Constructs a new {@link JsonContextHelper | JsonContextHelper}.
   * @param context - The base {@link IJsonContext | IJsonContext} on
   * which to operate.
   */
  public constructor(context?: IJsonContext) {
    this._context = context;
  }

  /**
   * Creates a new {@link IJsonContext | context}.
   * @param context - The base {@link IJsonContext | IJsonContext} on
   * which to operate.
   * @returns `Success` with the new {@link IJsonContext | IJsonContext},
   * or `Failure` with more information if an error occurs.
   */
  public static create(context?: IJsonContext): Result<JsonContextHelper> {
    return captureResult(() => new JsonContextHelper(context));
  }

  /**
   * Static helper to extend context variables for a supplied {@link IJsonContext | IJsonContext}.
   * @param baseContext - The {@link IJsonContext | IJsonContext} to be extended, or `undefined`
   * to start from an empty context.
   * @param vars - Optional {@link VariableValue | variable values} to be added to the
   * {@link IJsonContext | context}.
   * @returns `Success` with a new {@link TemplateVars | TemplateVars} containing the variables
   * from the base context, merged with and overridden by any that were passed in, or `Failure`
   * with a message if an error occurs.
   */
  public static extendContextVars(
    baseContext: IJsonContext | undefined,
    vars?: VariableValue[]
  ): Result<TemplateVars | undefined> {
    if (vars && vars.length > 0) {
      const extend = baseContext?.extendVars ?? defaultExtendVars;
      return extend(baseContext?.vars ?? {}, vars);
    }
    return succeed(baseContext?.vars);
  }

  /**
   * Static helper to extend context references for a supplied {@link IJsonContext | IJsonContext}.
   * @param baseContext - The {@link IJsonContext | IJsonContext} to be extended, or `undefined`
   * to start from an empty context.
   * @param refs - Optional {@link IJsonReferenceMap | reference maps} to be added to the
   * {@link IJsonContext | context}.
   * @returns `Success` with a new {@link IJsonReferenceMap | reference map} which projects
   * the references from the base context, merged with and overridden by any that were passed in,
   * or `Failure` with a message if an error occurs.
   */
  public static extendContextRefs(
    baseContext: IJsonContext | undefined,
    refs?: IJsonReferenceMap[]
  ): Result<IJsonReferenceMap | undefined> {
    if (refs && refs.length > 0) {
      const full = baseContext?.refs ? [...refs, baseContext.refs] : refs;
      if (full.length > 1) {
        return CompositeJsonMap.create(full);
      }
      return succeed(full[0]);
    }
    return succeed(baseContext?.refs);
  }

  /**
   * Static helper to extend context variables and references for a supplied {@link IJsonContext | IJsonContext}.
   * @param baseContext - The {@link IJsonContext | IJsonContext} to be extended, or `undefined`
   * to start from an empty context.
   * @param add - Optional initializer containing {@link VariableValue | variable values} and/or
   * {@link IJsonReferenceMap | reference maps} to be added to the {@link IJsonContext | context}.
   * @returns `Success` with a new {@link IJsonContext | IJsonContext} containing the variables and
   * references from the base context, merged with and overridden by any that were passed in, or
   * `Failure` with a message if an error occurs.
   */
  public static extendContext(
    baseContext?: IJsonContext | undefined,
    add?: { vars?: VariableValue[]; refs?: IJsonReferenceMap[] }
  ): Result<IJsonContext | undefined> {
    return JsonContextHelper.extendContextVars(baseContext, add?.vars || []).onSuccess((vars) => {
      return JsonContextHelper.extendContextRefs(baseContext, add?.refs || []).onSuccess((refs) => {
        if (!vars && !refs && !baseContext?.extendVars) {
          return succeed(undefined);
        }
        const rtrn: IJsonContext = { vars, refs };
        if (baseContext?.extendVars) {
          rtrn.extendVars = baseContext.extendVars;
        }
        return succeed(rtrn);
      });
    });
  }

  /**
   * Static helper to merge context variables and references for a supplied {@link IJsonContext | IJsonContext}.
   * @param baseContext - The {@link IJsonContext | IJsonContext} into which variables and references
   * are to be merged, or `undefined` to start from an empty context.
   * @param add - Optional initializer containing {@link VariableValue | variable values} and/or
   * {@link IJsonReferenceMap | reference maps} to be added to the {@link IJsonContext | context}.
   * @returns `Success` with a new {@link IJsonContext | IJsonContext} containing the variables and
   * references from the base context, merged with and overridden by any that were passed in, or
   * `Failure` with a message if an error occurs.
   */
  public static mergeContext(
    baseContext: IJsonContext | undefined,
    add: IJsonContext | undefined
  ): Result<IJsonContext | undefined> {
    if (baseContext) {
      if (add) {
        const rtrn: IJsonContext = {
          vars: add.vars ?? baseContext.vars,
          refs: add.refs ?? baseContext.refs
        };
        if (add.hasOwnProperty('extendVars')) {
          rtrn.extendVars = add.extendVars;
        } else if (baseContext.hasOwnProperty('extendVars')) {
          rtrn.extendVars = baseContext.extendVars;
        }
        return succeed(rtrn);
      }
      return succeed(baseContext);
    }
    return succeed(add);
  }

  /**
   * Applies {@link JsonContextHelper.extendContextVars | extendContextVars} to the
   * {@link IJsonContext | IJsonContext} associated with this helper.
   * @param vars - Optional {@link VariableValue | variable values} to be added to the
   * @returns `Success` with a new {@link TemplateVars | TemplateVars} containing the variables
   * from the base context, merged with and overridden by any that were passed in, or `Failure`
   * with a message if an error occurs.
   */
  public extendVars(vars?: VariableValue[]): Result<TemplateVars | undefined> {
    return JsonContextHelper.extendContextVars(this._context, vars);
  }

  /**
   * Applies {@link JsonContextHelper.extendContextRefs | extendContextRefs} to the
   * {@link IJsonContext | IJsonContext} associated with this helper.
   * @param refs - Optional {@link IJsonReferenceMap | reference maps} to be added to the
   * @returns `Success` with a new {@link IJsonReferenceMap | reference map} which projects
   * the references from the base context, merged with and overridden by any that were passed in,
   * or `Failure` with a message if an error occurs.
   */
  public extendRefs(refs?: IJsonReferenceMap[]): Result<IJsonReferenceMap | undefined> {
    return JsonContextHelper.extendContextRefs(this._context, refs);
  }

  /**
   * Applies {@link JsonContextHelper.(extendContext:static) | extendContext} to the
   * {@link IJsonContext | IJsonContext} associated with this helper.
   * @param add - Optional initializer containing {@link VariableValue | variable values} and/or
   * {@link IJsonReferenceMap | reference maps} to be added to the {@link IJsonContext | context}.
   * @returns `Success` with a new {@link IJsonContext | IJsonContext} containing the variables and
   * references from the base context, merged with and overridden by any that were passed in, or
   * `Failure` with a message if an error occurs.
   */
  public extendContext(add?: {
    vars?: VariableValue[];
    refs?: IJsonReferenceMap[];
  }): Result<IJsonContext | undefined> {
    return JsonContextHelper.extendContext(this._context, add);
  }

  /**
   * Applies {@link JsonContextHelper.(mergeContext:static) | mergeContext} to the
   * {@link IJsonContext | IJsonContext} associated with this helper.
   * @param add - Optional initializer containing {@link VariableValue | variable values} and/or
   * {@link IJsonReferenceMap | reference maps} to be added to the {@link IJsonContext | context}.
   * @returns `Success` with a new {@link IJsonContext | IJsonContext} containing the variables and
   * references from the base context, merged with and overridden by any that were passed in, or
   * `Failure` with a message if an error occurs.
   */
  public mergeContext(merge?: IJsonContext): Result<IJsonContext | undefined> {
    return JsonContextHelper.mergeContext(this._context, merge);
  }
}
