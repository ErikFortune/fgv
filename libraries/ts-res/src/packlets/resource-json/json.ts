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
 * Parameterized on `TQualifierNames` via `ILooseConditionDecl`;
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
 * Parameterized on `TQualifierNames`; defaults to `string` for back-compat with
 * existing untyped callers. Uses `Readonly<Partial<Record<...>>>` to align with
 * runtime reality (missing keys produce `undefined`; the `Partial` makes TypeScript
 * aware of this, which is a strict type-system tightening).
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
 * array form (`ConditionSetDeclAsArray`) and the record form
 * (`ConditionSetDeclAsRecord`) inherit the parameter, so a
 * consumer threading a narrow `TQualifierNames` gets compile-time
 * rejection of typo'd axis names in either form.
 *
 * @public
 */
export type ConditionSetDecl<TQualifierNames extends string = string> =
  | ConditionSetDeclAsArray<TQualifierNames>
  | ConditionSetDeclAsRecord<TQualifierNames>;

/**
 * Non-validated child declaration of a {@link Resources.ResourceCandidate | resource candidate}.
 *
 * @remarks
 * Parameterized on `TQualifierNames` so the `conditions` field can carry a
 * narrowed axis-name set. Defaults to `string` so existing untyped callers
 * compile unchanged.
 *
 * @public
 */
export interface IChildResourceCandidateDecl<TQualifierNames extends string = string> {
  /**
   * The JSON value of the resource.
   */
  readonly json: JsonObject;

  /**
   * The conditions that must be met for the resource to be selected.
   */
  readonly conditions?: ConditionSetDecl<TQualifierNames>;

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
 *
 * @remarks
 * Parameterized on `TQualifierNames`; inherits via `IChildResourceCandidateDecl`.
 * Defaults to `string` for back-compat.
 *
 * @public
 */
export interface IImporterResourceCandidateDecl<TQualifierNames extends string = string>
  extends IChildResourceCandidateDecl<TQualifierNames> {
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
 *
 * @remarks
 * Parameterized on `TQualifierNames`; inherits via `IChildResourceCandidateDecl`.
 * Defaults to `string` for back-compat.
 *
 * @public
 */
export interface ILooseResourceCandidateDecl<TQualifierNames extends string = string>
  extends IChildResourceCandidateDecl<TQualifierNames> {
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
  readonly conditions?: ConditionSetDecl<TQualifierNames>;

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
 *
 * @remarks
 * Parameterized on `TQualifierNames` so the `candidates` field threads the
 * narrowed axis-name set down to each candidate. Defaults to `string` for
 * back-compat.
 *
 * @public
 */
export interface IChildResourceDecl<TQualifierNames extends string = string> {
  /**
   * The name of the type of this resource.
   */
  readonly resourceTypeName: string;

  /**
   * Possible candidates for this value.
   */
  readonly candidates?: ReadonlyArray<IChildResourceCandidateDecl<TQualifierNames>>;
}

/**
 * Non-validated loose declaration of a {@link Resources.Resource | resource}.
 *
 * @remarks
 * Parameterized on `TQualifierNames`; inherits via `IChildResourceDecl`.
 * Defaults to `string` for back-compat.
 *
 * @public
 */
export interface ILooseResourceDecl<TQualifierNames extends string = string>
  extends IChildResourceDecl<TQualifierNames> {
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
  readonly candidates?: ReadonlyArray<IChildResourceCandidateDecl<TQualifierNames>>;
}

/**
 * Normalized non-validated declaration of a {@link Resources.Resource | resource} tree node.
 *
 * @remarks
 * Parameterized on `TQualifierNames` so the `resources` and `children` fields
 * thread the narrowed axis-name set throughout the tree. Defaults to `string` for
 * back-compat.
 *
 * @public
 */
export interface IResourceTreeChildNodeDecl<TQualifierNames extends string = string> {
  readonly resources?: Record<string, IChildResourceDecl<TQualifierNames>>;
  readonly children?: Record<string, IResourceTreeChildNodeDecl<TQualifierNames>>;
}

/**
 * Declared context for a resource container.
 *
 * @remarks
 * Parameterized on `TQualifierNames` so the `conditions` field threads the
 * narrowed axis-name set to the container context. Defaults to `string` for
 * back-compat.
 *
 * @public
 */
export interface IContainerContextDecl<TQualifierNames extends string = string> {
  readonly baseId?: string;
  readonly conditions?: ConditionSetDecl<TQualifierNames>;
  readonly mergeMethod?: ResourceValueMergeMethod;
}

/**
 * Normalized non-validated declaration of a {@link Resources.Resource | resource} tree root.
 *
 * @remarks
 * Parameterized on `TQualifierNames` so the `context` field threads the
 * narrowed axis-name set to the tree root context. Defaults to `string` for
 * back-compat.
 *
 * @public
 */
export interface IResourceTreeRootDecl<TQualifierNames extends string = string>
  extends IResourceTreeChildNodeDecl<TQualifierNames> {
  readonly context?: IContainerContextDecl<TQualifierNames>;
  readonly resources?: Record<string, IChildResourceDecl<TQualifierNames>>;
  readonly children?: Record<string, IResourceTreeChildNodeDecl<TQualifierNames>>;
  readonly metadata?: JsonObject;
}

/**
 * Non-validated declaration of a collection of resources.
 *
 * @remarks
 * Parameterized on `TQualifierNames` so the `context`, `candidates`, and
 * `resources` fields thread the narrowed axis-name set throughout the
 * collection. Defaults to `string` for back-compat.
 *
 * @public
 */
export interface IResourceCollectionDecl<TQualifierNames extends string = string> {
  readonly context?: IContainerContextDecl<TQualifierNames>;
  readonly candidates?: ReadonlyArray<ILooseResourceCandidateDecl<TQualifierNames>>;
  readonly resources?: ReadonlyArray<ILooseResourceDecl<TQualifierNames>>;
  readonly collections?: ReadonlyArray<IResourceCollectionDecl<TQualifierNames>>;
  readonly metadata?: JsonObject;
}

/**
 * Non-validated declaration of a resource for import,
 * which can be either a loose or child resource.
 *
 * @remarks
 * Parameterized on `TQualifierNames`; defaults to `string` for back-compat.
 *
 * @public
 */
export type IImporterResourceDecl<TQualifierNames extends string = string> =
  | ILooseResourceDecl<TQualifierNames>
  | IChildResourceDecl<TQualifierNames>;

/**
 * Non-validated declaration of a collection of resources for an importer.
 *
 * @remarks
 * Parameterized on `TQualifierNames` so the `context`, `candidates`, and
 * `resources` fields thread the narrowed axis-name set throughout the
 * importer collection. Defaults to `string` for back-compat.
 *
 * @public
 */
export interface IImporterResourceCollectionDecl<TQualifierNames extends string = string> {
  readonly context?: IContainerContextDecl<TQualifierNames>;
  readonly candidates?: ReadonlyArray<IImporterResourceCandidateDecl<TQualifierNames>>;
  readonly resources?: ReadonlyArray<IImporterResourceDecl<TQualifierNames>>;
  readonly collections?: ReadonlyArray<IImporterResourceCollectionDecl<TQualifierNames>>;
  readonly metadata?: JsonObject;
}

/**
 * Type guard function to check if a resource candidate declaration is a loose resource candidate declaration.
 * @public
 */
export function isLooseResourceCandidateDecl<TQualifierNames extends string = string>(
  decl: IImporterResourceCandidateDecl<TQualifierNames>
): decl is ILooseResourceCandidateDecl<TQualifierNames> {
  return 'id' in decl && typeof decl.id === 'string';
}

/**
 * Type guard function to check if a resource declaration is a loose resource declaration.
 * @public
 */
export function isLooseResourceDecl<TQualifierNames extends string = string>(
  decl: IImporterResourceDecl<TQualifierNames>
): decl is ILooseResourceDecl<TQualifierNames> {
  return 'id' in decl && typeof decl.id === 'string';
}
