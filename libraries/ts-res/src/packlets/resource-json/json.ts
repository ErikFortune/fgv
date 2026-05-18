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

import { JsonObject } from '@fgv/ts-json-base';
import { ConditionOperator, ResourceValueMergeMethod } from '../common';

/**
 * Non-validated loose declaration of a {@link Conditions.Condition | condition}.
 *
 * @remarks
 * Parameterized on `TQualifierNames` so consumers authoring conditions
 * in code can opt into compile-time axis-name discipline (e.g. via a
 * literal-string union derived from a `qualifiers: ['tone'] as const`
 * decl-array). Defaults to `string`, so existing untyped callers
 * compile unchanged.
 *
 * @public
 */
export interface ILooseConditionDecl<TQualifierNames extends string = string> {
  /**
   * The name of the {@link Qualifiers.Qualifier | qualifier} to be compared.
   */
  qualifierName: TQualifierNames;
  /**
   * The value to be compared.
   */
  value: string;
  /**
   * The operator to be used in the comparison.
   * Default is 'matches'.
   */
  operator?: ConditionOperator;

  /**
   * The priority of the condition. Default is the default priority for the qualifier.
   */
  priority?: number;

  /**
   * The score to be used if the condition is used as a default.
   */
  scoreAsDefault?: number;
}

/**
 * Non-validated child declaration of a {@link Conditions.Condition | condition}.
 * @public
 */
export interface IChildConditionDecl {
  /**
   * The value to be compared.
   */
  value: string;
  /**
   * The operator to be used in the comparison.
   * Default is 'matches'.
   */
  operator?: ConditionOperator;

  /**
   * The priority of the condition. Default is the default priority for the qualifier.
   */
  priority?: number;

  /**
   * The score to be used if the condition is used as a default.
   */
  scoreAsDefault?: number;
}

/**
 * Non-validated array-form declaration of a {@link Conditions.ConditionSet | condition set}.
 *
 * @remarks
 * Parameterized on `TQualifierNames` via {@link ILooseConditionDecl};
 * defaults to `string` for back-compat with existing untyped callers.
 *
 * @public
 */
export type ConditionSetDeclAsArray<TQualifierNames extends string = string> = ReadonlyArray<
  ILooseConditionDecl<TQualifierNames>
>;

/**
 * Non-validated record-form declaration of a {@link Conditions.ConditionSet | condition set}.
 *
 * @remarks
 * Parameterized on `TQualifierNames` so the record keys narrow to a
 * consumer-supplied literal-string union when typed-narrow usage is
 * desired. `Partial` keeps each axis optional — consumers specify only
 * the axes that matter for a given condition set.
 *
 * Defaults to `string`. The `Readonly<Partial<...>>` wrapping (versus
 * the prior bare `Record<string, ...>`) is a strict type-system
 * tightening that aligns the type with the runtime behavior — missing
 * keys at runtime already produce `undefined`; the `Partial` makes TS
 * aware of what's already true. No functional change.
 *
 * @public
 */
export type ConditionSetDeclAsRecord<TQualifierNames extends string = string> = Readonly<
  Partial<Record<TQualifierNames, string | IChildConditionDecl>>
>;

/**
 * Non-validated declaration of a {@link Conditions.ConditionSet | condition set}.
 *
 * @remarks
 * Parameterized on `TQualifierNames`; defaults to `string`. Both the
 * array form ({@link ConditionSetDeclAsArray}) and the record form
 * ({@link ConditionSetDeclAsRecord}) inherit the parameter, so a
 * consumer threading a narrow `TQualifierNames` gets compile-time
 * rejection of typo'd axis names in either form. Value-side
 * expressivity is fully preserved — string sugar, the
 * record-form's `IChildConditionDecl` child shape, and the array
 * form's `ILooseConditionDecl` continue to be accepted.
 *
 * Immediate consumer: `@fgv/ts-prompt-assist`'s seed-authoring path
 * (round-2 pressure-test F1 absorption). Generic enough to benefit
 * any future ts-res consumer authoring conditions in code that wants
 * compile-time axis-name discipline.
 *
 * @public
 */
export type ConditionSetDecl<TQualifierNames extends string = string> =
  | ConditionSetDeclAsArray<TQualifierNames>
  | ConditionSetDeclAsRecord<TQualifierNames>;

/**
 * Non-validated child declaration of a {@link Resources.ResourceCandidate | resource candidate}.
 * @public
 */
export interface IChildResourceCandidateDecl {
  /**
   * The JSON value of the resource.
   */
  readonly json: JsonObject;

  /**
   * The conditions that must be met for the resource to be selected.
   */
  readonly conditions?: ConditionSetDecl;

  /**
   * If true, the resource is only a partial representation of the full resource.
   */
  readonly isPartial?: boolean;

  /**
   * The merge method to be used when merging the resource into the existing resource.
   * default is 'augment'.
   */
  readonly mergeMethod?: ResourceValueMergeMethod;
}

/**
 * Non-validated declaration of a resource candidate for import,
 * which can be either a loose or child resource candidate.
 * @public
 */
export interface IImporterResourceCandidateDecl extends IChildResourceCandidateDecl {
  /**
   * The {@link ResourceId | id} of the resource.
   */
  readonly id?: string;

  /**
   * The name of the type of this resource.
   */
  readonly resourceTypeName?: string;
}

/**
 * Non-validated loose declaration of a {@link Resources.ResourceCandidate | resource candidate}.
 * @public
 */
export interface ILooseResourceCandidateDecl extends IChildResourceCandidateDecl {
  /**
   * The {@link ResourceId | id} of the resource.
   */
  readonly id: string;

  /**
   * The JSON value of the resource.
   */
  readonly json: JsonObject;

  /**
   * The conditions that must be met for the resource to be selected.
   */
  readonly conditions?: ConditionSetDecl;

  /**
   * If true, the resource is only a partial representation of the full resource.
   */
  readonly isPartial?: boolean;

  /**
   * The merge method to be used when merging the resource into the existing resource.
   * default is 'augment'.
   */
  readonly mergeMethod?: ResourceValueMergeMethod;

  /**
   * The type of the resource.
   */
  readonly resourceTypeName?: string;
}

/**
 * Non-validated child declaration of a {@link Resources.Resource | resource}.
 * @public
 */
export interface IChildResourceDecl {
  /**
   * The name of the type of this resource.
   */
  readonly resourceTypeName: string;

  /**
   * Possible candidates for this value.
   */
  readonly candidates?: ReadonlyArray<IChildResourceCandidateDecl>;
}

/**
 * Non-validated loose declaration of a {@link Resources.Resource | resource}.
 * @public
 */
export interface ILooseResourceDecl extends IChildResourceDecl {
  /**
   * The id of the resource.
   */
  readonly id: string;

  /**
   * The name of the type of this resource.
   */
  readonly resourceTypeName: string;

  /**
   * Possible candidates for this value.
   */
  readonly candidates?: ReadonlyArray<IChildResourceCandidateDecl>;
}

/**
 * Normalized non-validated declaration of a {@link Resources.Resource | resource} tree node.
 * @public
 */
export interface IResourceTreeChildNodeDecl {
  readonly resources?: Record<string, IChildResourceDecl>;
  readonly children?: Record<string, IResourceTreeChildNodeDecl>;
}

/**
 * Declared context for a resource container.
 * @public
 */
export interface IContainerContextDecl {
  readonly baseId?: string;
  readonly conditions?: ConditionSetDecl;
  readonly mergeMethod?: ResourceValueMergeMethod;
}

/**
 * Normalized non-validated declaration of a {@link Resources.Resource | resource} tree root.
 * @public
 */
export interface IResourceTreeRootDecl extends IResourceTreeChildNodeDecl {
  readonly context?: IContainerContextDecl;
  readonly resources?: Record<string, IChildResourceDecl>;
  readonly children?: Record<string, IResourceTreeChildNodeDecl>;
  readonly metadata?: JsonObject;
}

/**
 * Non-validated declaration of a collection of resources.
 * @public
 */
export interface IResourceCollectionDecl {
  readonly context?: IContainerContextDecl;
  readonly candidates?: ReadonlyArray<ILooseResourceCandidateDecl>;
  readonly resources?: ReadonlyArray<ILooseResourceDecl>;
  readonly collections?: ReadonlyArray<IResourceCollectionDecl>;
  readonly metadata?: JsonObject;
}

/**
 * Non-validated declaration of a resource for import,
 * which can be either a loose or child resource.
 * @public
 */
export type IImporterResourceDecl = ILooseResourceDecl | IChildResourceDecl;

/**
 * Non-validated declaration of a collection of resources for an importer.
 * @public
 */
export interface IImporterResourceCollectionDecl {
  readonly context?: IContainerContextDecl;
  readonly candidates?: ReadonlyArray<IImporterResourceCandidateDecl>;
  readonly resources?: ReadonlyArray<IImporterResourceDecl>;
  readonly collections?: ReadonlyArray<IImporterResourceCollectionDecl>;
  readonly metadata?: JsonObject;
}

/**
 * Type guard function to check if a resource candidate declaration is a loose resource candidate declaration.
 * @public
 */
export function isLooseResourceCandidateDecl(
  decl: IImporterResourceCandidateDecl
): decl is ILooseResourceCandidateDecl {
  return 'id' in decl;
}

/**
 * Type guard function to check if a resource declaration is a loose resource declaration.
 * @public
 */
export function isLooseResourceDecl(decl: IImporterResourceDecl): decl is ILooseResourceDecl {
  return 'id' in decl;
}
