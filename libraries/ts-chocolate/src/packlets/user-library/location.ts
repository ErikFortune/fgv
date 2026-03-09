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

/* c8 ignore file - runtime materialization, tested through integration */

/**
 * Concrete Location class with materialized properties.
 * @packageDocumentation
 */

import { Result, succeed } from '@fgv/ts-utils';

import {
  BaseLocationId,
  CollectionId,
  Converters as CommonConverters,
  LocationId,
  Model as CommonModel
} from '../common';
import { ILocationEntity } from '../entities';

// ============================================================================
// Location Interface
// ============================================================================

/**
 * Materialized location with parsed composite ID.
 * @public
 */
export interface ILocation {
  /** Composite location ID (collectionId.baseId) */
  readonly id: LocationId;
  /** Collection this location belongs to */
  readonly collectionId: CollectionId;
  /** Base identifier within collection */
  readonly baseId: BaseLocationId;
  /** Human-readable name */
  readonly name: string;
  /** Optional longer description */
  readonly description: string | undefined;
  /** Display name (returns name) */
  readonly displayName: string;
  /** Optional categorized notes */
  readonly notes: ReadonlyArray<CommonModel.ICategorizedNote> | undefined;
  /** Optional categorized URLs */
  readonly urls: ReadonlyArray<CommonModel.ICategorizedUrl> | undefined;
  /** The underlying entity */
  readonly entity: ILocationEntity;
}

// ============================================================================
// Location Class
// ============================================================================

/**
 * Runtime materialization of a location entity.
 *
 * Locations are simple self-contained entities with no cross-references,
 * so materialization is a straightforward passthrough.
 *
 * @internal
 */
export class Location implements ILocation {
  private readonly _id: LocationId;
  private readonly _collectionId: CollectionId;
  private readonly _entity: ILocationEntity;

  private constructor(id: LocationId, collectionId: CollectionId, entity: ILocationEntity) {
    this._id = id;
    this._collectionId = collectionId;
    this._entity = entity;
  }

  public get id(): LocationId {
    return this._id;
  }

  public get collectionId(): CollectionId {
    return this._collectionId;
  }

  public get baseId(): BaseLocationId {
    return this._entity.baseId;
  }

  public get name(): string {
    return this._entity.name;
  }

  public get description(): string | undefined {
    return this._entity.description;
  }

  public get displayName(): string {
    return this._entity.name;
  }

  public get notes(): ReadonlyArray<CommonModel.ICategorizedNote> | undefined {
    return this._entity.notes;
  }

  public get urls(): ReadonlyArray<CommonModel.ICategorizedUrl> | undefined {
    return this._entity.urls;
  }

  public get entity(): ILocationEntity {
    return this._entity;
  }

  /**
   * Creates a materialized Location from a composite ID and entity.
   * @param id - Composite location ID (collectionId.baseId)
   * @param entity - Location entity data
   * @returns Success with Location, or Failure if ID cannot be parsed
   * @internal
   */
  public static create(id: LocationId, entity: ILocationEntity): Result<Location> {
    return CommonConverters.parsedLocationId.convert(id).onSuccess((parsed) => {
      return succeed(new Location(id, parsed.collectionId, entity));
    });
  }
}
