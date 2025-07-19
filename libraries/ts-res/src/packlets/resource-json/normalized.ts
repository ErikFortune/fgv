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
import { ResourceValueMergeMethod } from '../common';
import { ILooseConditionDecl } from './json';
import exp from 'constants';

/**
 * Normalized non-validated declaration of a {@link Conditions.Condition | condition}.
 * @public
 */
export type ConditionSetDecl = ReadonlyArray<ILooseConditionDecl>;

/**
 * Normalized non-validated child declaration of a {@link Resources.ResourceCandidate | resource candidate}.
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
 * Normalized non-validated loose declaration of a {@link Resources.ResourceCandidate | resource candidate}.
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
 * Normalized non-validated child declaration of a {@link Resources.Resource | resource}.
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
 * Normalized non-validated loose declaration of a {@link Resources.Resource | resource}.
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
 * Normalized non-validated declaration of a collection of resources.
 * @public
 */
export interface IResourceCollectionDecl {
  readonly context?: IContainerContextDecl;
  readonly candidates?: ReadonlyArray<ILooseResourceCandidateDecl>;
  readonly resources?: ReadonlyArray<ILooseResourceDecl>;
  readonly collections?: ReadonlyArray<IResourceCollectionDecl>;
  readonly metadata?: JsonObject;
}

export type IImporterResourceCandidateDecl = ILooseResourceCandidateDecl | IChildResourceCandidateDecl;

export type IImporterResourceDecl = ILooseResourceDecl | IChildResourceDecl;

/**
 * Normalized non-validated declaration of a collection of resources for importers.
 * This allows for a mix of loose and child resource declarations.
 * @public
 */
export interface IImporterResourceCollectionDecl {
  readonly context?: IContainerContextDecl;
  readonly candidates?: ReadonlyArray<IImporterResourceCandidateDecl>;
  readonly resources?: ReadonlyArray<IImporterResourceDecl>;
  readonly collections?: ReadonlyArray<IImporterResourceCollectionDecl>;
  readonly metadata?: JsonObject;
}
