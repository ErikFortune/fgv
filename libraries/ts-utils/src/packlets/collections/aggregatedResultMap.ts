/*
 * Copyright (c) 2026 Erik Fortune
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

import {
  captureResult,
  DetailedResult,
  Result,
  fail,
  failWithDetail,
  succeed,
  succeedWithDetail,
  Success
} from '../base';
import { Converter, Converters } from '../conversion';
import { Validator, Validators } from '../validation';
import { KeyValueEntry } from './common';
import { KeyValueConverters } from './keyValueConverters';
import { IReadOnlyResultMapValidator } from './resultMapValidator';
import { IReadOnlyResultMap, ResultMapForEachCb, ResultMapResultDetail } from './readonlyResultMap';
import { IResultMap, ResultMapValueFactory } from './resultMap';
import { IReadOnlyValidatingResultMap, ValidatingResultMap } from './validatingResultMap';

/**
 * A read-only entry in an {@link AggregatedResultMap}.
 * @public
 */
export interface IReadonlyAggregatedResultMapEntry<
  TCOLLECTIONID extends string = string,
  TITEMID extends string = string,
  TITEM = unknown
> {
  readonly isMutable: false;
  readonly id: TCOLLECTIONID;
  readonly items: IReadOnlyValidatingResultMap<TITEMID, TITEM>;
}

/**
 * A mutable entry in an {@link AggregatedResultMap}.
 * @public
 */
export interface IMutableAggregatedResultMapEntry<
  TCOLLECTIONID extends string = string,
  TITEMID extends string = string,
  TITEM = unknown
> {
  readonly isMutable: true;
  readonly id: TCOLLECTIONID;
  readonly items: ValidatingResultMap<TITEMID, TITEM>;
}

/**
 * An entry in an {@link AggregatedResultMap}, either mutable or read-only.
 * @public
 */
export type AggregatedResultMapEntry<TCOLLECTIONID extends string, TITEMID extends string, TITEM> =
  | IReadonlyAggregatedResultMapEntry<TCOLLECTIONID, TITEMID, TITEM>
  | IMutableAggregatedResultMapEntry<TCOLLECTIONID, TITEMID, TITEM>;

/**
 * JSON format for an aggregated result map entry using an entries array.
 * @public
 */
export interface IAggregatedResultMapJsonEntryWithEntries<TCOLLECTIONID extends string = string> {
  readonly isMutable: boolean;
  readonly id: TCOLLECTIONID;
  readonly entries: ReadonlyArray<KeyValueEntry<string, unknown>>;
}

/**
 * JSON format for an aggregated result map entry using an items object.
 * @public
 */
export interface IAggregatedResultMapJsonEntryWithItems<TCOLLECTIONID extends string = string> {
  readonly isMutable: boolean;
  readonly id: TCOLLECTIONID;
  readonly items: Record<string, unknown>;
}

/**
 * JSON format for an aggregated result map entry - supports both entries array and items object.
 * @public
 */
export type AggregatedResultMapJsonEntry<TCOLLECTIONID extends string = string> =
  | IAggregatedResultMapJsonEntryWithEntries<TCOLLECTIONID>
  | IAggregatedResultMapJsonEntryWithItems<TCOLLECTIONID>;

/**
 * Any valid input format for an aggregated result map entry.
 * @public
 */
export type AggregatedResultMapEntryInit<TCOLLECTIONID extends string, TITEMID extends string, TITEM> =
  | AggregatedResultMapEntry<TCOLLECTIONID, TITEMID, TITEM>
  | AggregatedResultMapJsonEntry<TCOLLECTIONID>;

/**
 * Options for {@link Collections.AggregatedResultMapBase.addCollectionWithItems}.
 * @public
 */
export interface IAddCollectionWithItemsOptions {
  /**
   * If true, the collection will be immutable (read-only).
   * Defaults to false (mutable).
   */
  readonly isImmutable?: boolean;
}

/**
 * Parameters for constructing an {@link AggregatedResultMap}.
 * @public
 */
export interface IAggregatedResultMapConstructorParams<
  TCOMPOSITEID extends string,
  TCOLLECTIONID extends string,
  TITEMID extends string,
  TITEM
> {
  readonly compositeIdValidator?: Validator<TCOMPOSITEID, unknown>;
  readonly collectionIdConverter: Converter<TCOLLECTIONID, unknown> | Validator<TCOLLECTIONID, unknown>;
  readonly itemIdConverter: Converter<TITEMID, unknown> | Validator<TITEMID, unknown>;
  readonly itemConverter: Converter<TITEM, unknown> | Validator<TITEM, unknown>;
  readonly separator?: string;
  readonly collections?: ReadonlyArray<AggregatedResultMapEntryInit<TCOLLECTIONID, TITEMID, TITEM>>;
}

/**
 * A validator for weakly-typed access to an {@link AggregatedResultMap}.
 * @public
 */
export class AggregatedResultMapValidator<
  TCOMPOSITEID extends string,
  TCOLLECTIONID extends string,
  TITEMID extends string,
  TITEM
> implements IReadOnlyResultMapValidator<TCOMPOSITEID, TITEM>
{
  private readonly _map: AggregatedResultMap<TCOMPOSITEID, TCOLLECTIONID, TITEMID, TITEM>;
  public readonly converters: KeyValueConverters<TCOMPOSITEID, TITEM>;

  public constructor(
    map: AggregatedResultMap<TCOMPOSITEID, TCOLLECTIONID, TITEMID, TITEM>,
    converters: KeyValueConverters<TCOMPOSITEID, TITEM>
  ) {
    this._map = map;
    this.converters = converters;
  }

  public get map(): IReadOnlyValidatingResultMap<TCOMPOSITEID, TITEM> {
    return this._map;
  }

  public get(key: string): DetailedResult<TITEM, ResultMapResultDetail> {
    return this.converters.convertKey(key).onSuccess((k) => {
      return this._map.get(k);
    });
  }

  public has(key: string): boolean {
    const result = this.converters.convertKey(key);
    if (result.isFailure()) {
      return false;
    }
    return this._map.has(result.value);
  }

  public add(key: string, value: unknown): DetailedResult<TITEM, ResultMapResultDetail> {
    return this.converters.convertEntry([key, value]).onSuccess(([vk, vv]) => {
      return this._map.add(vk, vv);
    });
  }

  public set(key: string, value: unknown): DetailedResult<TITEM, ResultMapResultDetail> {
    return this.converters.convertEntry([key, value]).onSuccess(([vk, vv]) => {
      return this._map.set(vk, vv);
    });
  }

  public update(key: string, value: unknown): DetailedResult<TITEM, ResultMapResultDetail> {
    return this.converters.convertEntry([key, value]).onSuccess(([vk, vv]) => {
      return this._map.update(vk, vv);
    });
  }

  public delete(key: string): DetailedResult<TITEM, ResultMapResultDetail> {
    return this.converters.convertKey(key).onSuccess((k) => {
      return this._map.delete(k);
    });
  }
}

/**
 * Type guard to check if an entry is mutable.
 */
function isMutableEntry<TCOLLECTIONID extends string, TITEMID extends string, TITEM>(
  entry: AggregatedResultMapEntry<TCOLLECTIONID, TITEMID, TITEM>
): entry is IMutableAggregatedResultMapEntry<TCOLLECTIONID, TITEMID, TITEM> {
  return entry.isMutable === true;
}

/**
 * Base class for an aggregated result map that wraps a collection of {@link ValidatingResultMap} instances,
 * keyed by collection ID. Items are accessed via composite IDs that combine the collection ID
 * and item ID with a delimiter.
 * @remarks Consumers should inherit from this class or use {@link AggregatedResultMap | AggregatedResultMap}
 * for fully generic.
 * @public
 */
export class AggregatedResultMapBase<
  TCOMPOSITEID extends string,
  TCOLLECTIONID extends string,
  TITEMID extends string,
  TITEM
> implements IResultMap<TCOMPOSITEID, TITEM>, IReadOnlyValidatingResultMap<TCOMPOSITEID, TITEM>
{
  private readonly _childKvConverters: KeyValueConverters<TITEMID, TITEM>;
  private readonly _collections: ValidatingResultMap<
    TCOLLECTIONID,
    AggregatedResultMapEntry<TCOLLECTIONID, TITEMID, TITEM>
  >;
  private readonly _collectionKvConverters: KeyValueConverters<
    TCOLLECTIONID,
    AggregatedResultMapEntry<TCOLLECTIONID, TITEMID, TITEM>
  >;
  private readonly _compositeIdValidator: Validator<TCOMPOSITEID, unknown>;
  private readonly _collectionIdConverter:
    | Converter<TCOLLECTIONID, unknown>
    | Validator<TCOLLECTIONID, unknown>;
  private readonly _itemIdConverter: Converter<TITEMID, unknown> | Validator<TITEMID, unknown>;
  private readonly _itemConverter: Converter<TITEM, unknown> | Validator<TITEM, unknown>;
  private readonly _delimiter: string;
  private readonly _compositeIdConverter: Converter<Converters.ICompositeId<TCOLLECTIONID, TITEMID>, unknown>;
  private readonly _kvConverters: KeyValueConverters<TCOMPOSITEID, TITEM>;
  private readonly _validating: AggregatedResultMapValidator<TCOMPOSITEID, TCOLLECTIONID, TITEMID, TITEM>;

  /**
   * Constructs a new {@link AggregatedResultMap}.
   * Use {@link AggregatedResultMap.create} for safe construction with error handling.
   * @param params - Parameters for constructing the map.
   * @throws If initialization fails (e.g., invalid collections).
   * @public
   */
  protected constructor(
    params: IAggregatedResultMapConstructorParams<TCOMPOSITEID, TCOLLECTIONID, TITEMID, TITEM>
  ) {
    this._compositeIdValidator =
      params.compositeIdValidator ?? AggregatedResultMapBase._compositeIdValidator(params);
    this._collectionIdConverter = params.collectionIdConverter;
    this._itemIdConverter = params.itemIdConverter;
    this._itemConverter = params.itemConverter;
    this._delimiter = params.separator ?? '.';

    // Build child key-value converters for item ID/value pairs
    this._childKvConverters = new KeyValueConverters<TITEMID, TITEM>({
      key: params.itemIdConverter,
      value: params.itemConverter
    });

    // Build composite ID converter for parsing composite IDs
    this._compositeIdConverter = Converters.compositeId(
      params.collectionIdConverter,
      this._delimiter,
      params.itemIdConverter
    );

    // Build key-value converters for composite ID/item pairs
    this._kvConverters = new KeyValueConverters<TCOMPOSITEID, TITEM>({
      key: this._compositeIdValidator,
      value: params.itemConverter
    });

    // Build entry converter for collection entries
    const entryConverter = AggregatedResultMapBase._entryConverter(
      params.collectionIdConverter,
      this._childKvConverters
    );

    // Build key-value converters for the collections map
    this._collectionKvConverters = new KeyValueConverters<
      TCOLLECTIONID,
      AggregatedResultMapEntry<TCOLLECTIONID, TITEMID, TITEM>
    >({
      key: params.collectionIdConverter,
      value: entryConverter
    });

    // Convert all input collections to [id, entry] pairs for ValidatingResultMap
    const initCollections = params.collections ?? [];
    const initEntries: KeyValueEntry<string, unknown>[] = initCollections.map((entry) => {
      return [entry.id, entry];
    });

    // Build the inner ValidatingResultMap - throws on error
    this._collections = new ValidatingResultMap<
      TCOLLECTIONID,
      AggregatedResultMapEntry<TCOLLECTIONID, TITEMID, TITEM>
    >({
      converters: this._collectionKvConverters,
      entries: initEntries
    });

    // Build the validator
    this._validating = new AggregatedResultMapValidator<TCOMPOSITEID, TCOLLECTIONID, TITEMID, TITEM>(
      this,
      this._kvConverters
    );
  }

  // ==================== IReadOnlyValidatingResultMap implementation ====================

  /**
   * A validator for weakly-typed access to the map.
   */
  public get validating(): IReadOnlyResultMapValidator<TCOMPOSITEID, TITEM> {
    return this._validating;
  }

  /**
   * The total number of items across all collections.
   */
  public get size(): number {
    let total = 0;
    for (const entry of Array.from(this._collections.values())) {
      total += entry.items.size;
    }
    return total;
  }

  /**
   * Gets an item by its composite ID.
   * @param key - The composite ID of the item.
   * @returns `Success` with the item if found, `Failure` otherwise.
   */
  public get(key: TCOMPOSITEID): DetailedResult<TITEM, ResultMapResultDetail> {
    return this._splitAndLookup(key).onSuccess(({ entry, itemId }) => {
      return entry.items.get(itemId);
    });
  }

  /**
   * Checks if an item exists by its composite ID.
   * @param key - The composite ID of the item.
   * @returns `true` if the item exists, `false` otherwise.
   */
  public has(key: TCOMPOSITEID): boolean {
    const result = this._splitAndLookup(key);
    if (result.isFailure()) {
      return false;
    }
    return result.value.entry.items.has(result.value.itemId);
  }

  /**
   * Iterates over all entries in all collections.
   */
  public *entries(): IterableIterator<KeyValueEntry<TCOMPOSITEID, TITEM>> {
    for (const collectionEntry of Array.from(this._collections.values())) {
      for (const [itemId, item] of Array.from(collectionEntry.items.entries())) {
        // Validate the composite ID through the converter
        const compositeId = this._compositeIdValidator
          .convert(`${collectionEntry.id}${this._delimiter}${itemId}`)
          .orThrow();
        yield [compositeId, item];
      }
    }
  }

  /**
   * Iterates over all composite keys.
   */
  public *keys(): IterableIterator<TCOMPOSITEID> {
    for (const [key] of Array.from(this.entries())) {
      yield key;
    }
  }

  /**
   * Iterates over all values.
   */
  public *values(): IterableIterator<TITEM> {
    for (const collectionEntry of Array.from(this._collections.values())) {
      for (const value of Array.from(collectionEntry.items.values())) {
        yield value;
      }
    }
  }

  /**
   * Calls a callback for each entry.
   * @param cb - The callback to call.
   * @param thisArg - Optional `this` argument for the callback.
   */
  public forEach(cb: ResultMapForEachCb<TCOMPOSITEID, TITEM>, thisArg?: unknown): void {
    for (const [key, value] of Array.from(this.entries())) {
      cb.call(thisArg, value, key, this);
    }
  }

  /**
   * Gets an iterator over the map entries.
   */
  public [Symbol.iterator](): IterableIterator<KeyValueEntry<TCOMPOSITEID, TITEM>> {
    return this.entries();
  }

  // ==================== Mutating methods ====================

  /**
   * Sets an item by its composite ID. Creates the collection if it doesn't exist and is mutable.
   * @param key - The composite ID of the item.
   * @param value - The value to set.
   * @returns `Success` with the value if set, `Failure` otherwise.
   */
  public set(key: TCOMPOSITEID, value: TITEM): DetailedResult<TITEM, ResultMapResultDetail> {
    return this._splitCompositeId(key).onSuccess(({ collectionId, itemId }) => {
      return this._getOrCreateMutableCollection(collectionId).onSuccess((collection) => {
        return collection.set(itemId, value);
      });
    });
  }

  /**
   * Adds an item by its composite ID. Fails if the item already exists.
   * @param key - The composite ID of the item.
   * @param value - The value to add.
   * @returns `Success` with the value if added, `Failure` otherwise.
   */
  public add(key: TCOMPOSITEID, value: TITEM): DetailedResult<TITEM, ResultMapResultDetail> {
    return this._splitCompositeId(key).onSuccess(({ collectionId, itemId }) => {
      return this._getOrCreateMutableCollection(collectionId).onSuccess((collection) => {
        return collection.add(itemId, value);
      });
    });
  }

  /**
   * Updates an existing item by its composite ID. Fails if the item doesn't exist.
   * @param key - The composite ID of the item.
   * @param value - The new value.
   * @returns `Success` with the value if updated, `Failure` otherwise.
   */
  public update(key: TCOMPOSITEID, value: TITEM): DetailedResult<TITEM, ResultMapResultDetail> {
    return this._splitAndLookupMutable(key).onSuccess(({ entry, itemId }) => {
      return entry.items.update(itemId, value);
    });
  }

  /**
   * Deletes an item by its composite ID.
   * @param key - The composite ID of the item.
   * @returns `Success` with the deleted value, `Failure` otherwise.
   */
  public delete(key: TCOMPOSITEID): DetailedResult<TITEM, ResultMapResultDetail> {
    return this._splitAndLookupMutable(key).onSuccess(({ entry, itemId }) => {
      return entry.items.delete(itemId);
    });
  }

  /**
   * Gets an existing item or adds a new one.
   * @param key - The composite ID of the item.
   * @param value - The value to add if not found.
   * @returns `Success` with the existing or new value.
   */
  public getOrAdd(key: TCOMPOSITEID, value: TITEM): DetailedResult<TITEM, ResultMapResultDetail>;

  /**
   * Gets an existing item or adds a new one using a factory.
   * @param key - The composite ID of the item.
   * @param factory - A factory function to create the value if not found. Receives the composite ID.
   * @returns `Success` with the existing or new value.
   */
  public getOrAdd(
    key: TCOMPOSITEID,
    factory: ResultMapValueFactory<TCOMPOSITEID, TITEM>
  ): DetailedResult<TITEM, ResultMapResultDetail>;

  public getOrAdd(
    key: TCOMPOSITEID,
    valueOrFactory: TITEM | ResultMapValueFactory<TCOMPOSITEID, TITEM>
  ): DetailedResult<TITEM, ResultMapResultDetail> {
    return this._splitCompositeId(key).onSuccess(({ collectionId, itemId }) => {
      return this._getOrCreateMutableCollection(collectionId).onSuccess((collection) => {
        // Use type guard to check if valueOrFactory is a factory function
        if (this._isFactory(valueOrFactory)) {
          return collection.getOrAdd(itemId, () => valueOrFactory(key));
        }
        return collection.getOrAdd(itemId, valueOrFactory);
      });
    });
  }

  /**
   * Clears all items from all mutable collections.
   * Immutable collections are not affected.
   */
  public clear(): void {
    for (const entry of Array.from(this._collections.values())) {
      if (isMutableEntry(entry)) {
        entry.items.clear();
      }
    }
  }

  /**
   * Returns a read-only view of this map.
   */
  public toReadOnly(): IReadOnlyResultMap<TCOMPOSITEID, TITEM> {
    return this;
  }

  // ==================== Convenience methods for split IDs ====================

  /**
   * Composes a collection ID and item ID into a composite ID.
   * @param collectionId - The collection ID.
   * @param itemId - The item ID.
   * @returns `Success` with the composite ID if valid, `Failure` otherwise.
   */
  public composeId(collectionId: TCOLLECTIONID, itemId: TITEMID): Result<TCOMPOSITEID> {
    const rawId = `${collectionId}${this._delimiter}${itemId}`;
    return this._compositeIdValidator.convert(rawId);
  }

  /**
   * Adds an item using separate collection and item IDs.
   * @param collectionId - The collection ID.
   * @param itemId - The item ID.
   * @param value - The value to add.
   * @returns `Success` with the composite ID if added, `Failure` otherwise.
   */
  public addToCollection(
    collectionId: TCOLLECTIONID,
    itemId: TITEMID,
    value: TITEM
  ): DetailedResult<TCOMPOSITEID, ResultMapResultDetail> {
    return this._getOrCreateMutableCollection(collectionId).onSuccess((collection) => {
      return collection.add(itemId, value).onSuccess(() => {
        return this.composeId(collectionId, itemId).withDetail('invalid-key', 'added');
      });
    });
  }

  /**
   * Sets an item using separate collection and item IDs.
   * @param collectionId - The collection ID.
   * @param itemId - The item ID.
   * @param value - The value to set.
   * @returns `Success` with the composite ID if set, `Failure` otherwise.
   */
  public setInCollection(
    collectionId: TCOLLECTIONID,
    itemId: TITEMID,
    value: TITEM
  ): DetailedResult<TCOMPOSITEID, ResultMapResultDetail> {
    return this._getOrCreateMutableCollection(collectionId).onSuccess((collection) => {
      return collection.set(itemId, value).onSuccess((_, detail) => {
        return this.composeId(collectionId, itemId).withDetail('invalid-key', detail);
      });
    });
  }

  /**
   * Updates an item using separate collection and item IDs.
   * @param collectionId - The collection ID.
   * @param itemId - The item ID.
   * @param value - The new value.
   * @returns `Success` with the composite ID if updated, `Failure` otherwise.
   */
  public updateInCollection(
    collectionId: TCOLLECTIONID,
    itemId: TITEMID,
    value: TITEM
  ): DetailedResult<TCOMPOSITEID, ResultMapResultDetail> {
    return this._getMutableCollection(collectionId).onSuccess((collection) => {
      return collection.update(itemId, value).onSuccess(() => {
        return this.composeId(collectionId, itemId).withDetail('invalid-key', 'updated');
      });
    });
  }

  /**
   * Deletes an item using separate collection and item IDs.
   * @param collectionId - The collection ID.
   * @param itemId - The item ID.
   * @returns `Success` with the composite ID if deleted, `Failure` otherwise.
   */
  public deleteFromCollection(
    collectionId: TCOLLECTIONID,
    itemId: TITEMID
  ): DetailedResult<TCOMPOSITEID, ResultMapResultDetail> {
    return this._getMutableCollection(collectionId).onSuccess((collection) => {
      return collection.delete(itemId).onSuccess(() => {
        return this.composeId(collectionId, itemId).withDetail('invalid-key', 'deleted');
      });
    });
  }

  // ==================== Collection-level methods ====================

  /**
   * Provides read-only access to the underlying collections map.
   * Use `collections.has(id)` and `collections.get(id)` to check existence and retrieve collections.
   */
  public get collections(): IReadOnlyValidatingResultMap<
    TCOLLECTIONID,
    AggregatedResultMapEntry<TCOLLECTIONID, TITEMID, TITEM>
  > {
    return this._collections;
  }

  /**
   * The number of collections.
   */
  public get collectionCount(): number {
    return this._collections.size;
  }

  /**
   * Adds a new collection from a pre-built entry object.
   * @param entry - The collection entry to add (JSON with items/entries, or pre-instantiated).
   * @returns `Success` with the entry if added, `Failure` otherwise.
   */
  public addCollectionEntry(
    entry: AggregatedResultMapEntryInit<TCOLLECTIONID, TITEMID, TITEM>
  ): DetailedResult<AggregatedResultMapEntry<TCOLLECTIONID, TITEMID, TITEM>, ResultMapResultDetail> {
    return AggregatedResultMapBase._entryConverter(this._collectionIdConverter, this._childKvConverters)
      .convert(entry)
      .withFailureDetail<ResultMapResultDetail>('invalid-value')
      .onSuccess((c) => this._collections.add(c.id, c));
  }

  /**
   * Adds a new collection with the specified ID and optional initial entries.
   * @param collectionId - The collection ID as a string (will be validated).
   * @param items - Optional initial entries for the collection.
   * @param options - Optional settings (isImmutable defaults to false).
   * @returns `Success` with the validated collection ID if added, `Failure` otherwise.
   */
  public addCollectionWithItems(
    collectionId: string,
    items?: Iterable<KeyValueEntry<string, unknown>>,
    options?: IAddCollectionWithItemsOptions
  ): Result<TCOLLECTIONID> {
    const isMutable = options?.isImmutable !== true;
    const entries = items ? Array.from(items) : [];
    return this._collectionIdConverter
      .convert(collectionId)
      .onSuccess((id) =>
        this.addCollectionEntry({ isMutable, id, entries }).asResult.onSuccess(() => Success.with(id))
      );
  }

  // ==================== Private helpers ====================

  /**
   * Type guard to check if a value is a factory function.
   */
  private _isFactory(
    valueOrFactory: TITEM | ResultMapValueFactory<TCOMPOSITEID, TITEM>
  ): valueOrFactory is ResultMapValueFactory<TCOMPOSITEID, TITEM> {
    return typeof valueOrFactory === 'function';
  }

  private _splitCompositeId(
    key: TCOMPOSITEID
  ): DetailedResult<Converters.ICompositeId<TCOLLECTIONID, TITEMID>, ResultMapResultDetail> {
    return this._compositeIdConverter.convert(key).withDetail('invalid-key', 'success');
  }

  private _splitAndLookup(
    key: TCOMPOSITEID
  ): DetailedResult<
    { entry: AggregatedResultMapEntry<TCOLLECTIONID, TITEMID, TITEM>; itemId: TITEMID },
    ResultMapResultDetail
  > {
    return this._splitCompositeId(key).onSuccess(({ collectionId, itemId }) => {
      return this._collections.get(collectionId).onSuccess((entry) => {
        return succeedWithDetail({ entry, itemId }, 'success');
      });
    });
  }

  private _splitAndLookupMutable(
    key: TCOMPOSITEID
  ): DetailedResult<
    { entry: IMutableAggregatedResultMapEntry<TCOLLECTIONID, TITEMID, TITEM>; itemId: TITEMID },
    ResultMapResultDetail
  > {
    return this._splitAndLookup(key).onSuccess(({ entry, itemId }) => {
      if (!isMutableEntry(entry)) {
        return failWithDetail(`Cannot modify immutable collection '${entry.id}'`, 'failure');
      }
      return succeedWithDetail({ entry, itemId }, 'success');
    });
  }

  /**
   * Gets an existing mutable collection by ID.
   * Returns failure if the collection doesn't exist or is immutable.
   */
  private _getMutableCollection(
    collectionId: TCOLLECTIONID
  ): DetailedResult<ValidatingResultMap<TITEMID, TITEM>, ResultMapResultDetail> {
    return this._collections.get(collectionId).onSuccess((entry) => {
      if (!isMutableEntry(entry)) {
        return failWithDetail(`Cannot modify immutable collection '${collectionId}'`, 'failure');
      }
      return succeedWithDetail(entry.items, 'exists');
    });
  }

  /**
   * Gets an existing mutable collection or creates a new one.
   */
  private _getOrCreateMutableCollection(
    collectionId: TCOLLECTIONID
  ): DetailedResult<ValidatingResultMap<TITEMID, TITEM>, ResultMapResultDetail> {
    const existing = this._collections.get(collectionId);
    if (existing.isSuccess()) {
      if (!isMutableEntry(existing.value)) {
        return failWithDetail(`Cannot modify immutable collection '${collectionId}'`, 'failure');
      }
      return succeedWithDetail(existing.value.items, 'exists');
    }

    // Create a new mutable collection
    const newItems = new ValidatingResultMap<TITEMID, TITEM>({
      converters: this._childKvConverters
    });
    const newEntry: IMutableAggregatedResultMapEntry<TCOLLECTIONID, TITEMID, TITEM> = {
      isMutable: true,
      id: collectionId,
      items: newItems
    };
    return this._collections.add(collectionId, newEntry).onSuccess(() => {
      return succeedWithDetail(newItems, 'added');
    });
  }

  // ==================== Static converter factories ====================

  /**
   * Constructs a composite id validator using other converters/validators and separator supplied in params.
   * @param params - Constructor params.
   * @returns The composite ID validator.
   */
  private static _compositeIdValidator<
    TCOMPOSITEID extends string,
    TCOLLECTIONID extends string,
    TITEMID extends string,
    TITEM
  >(
    params: IAggregatedResultMapConstructorParams<TCOMPOSITEID, TCOLLECTIONID, TITEMID, TITEM>
  ): Validator<TCOMPOSITEID, unknown> {
    return Validators.compositeId<TCOMPOSITEID, TCOLLECTIONID, TITEMID>({
      collectionId: Converters.asValidator(params.collectionIdConverter),
      separator: params.separator ?? '.',
      itemId: Converters.asValidator(params.itemIdConverter)
    });
  }

  /**
   * Creates a converter for pre-instantiated mutable entries.
   * These are entries that already have a ValidatingResultMap as their items property.
   */
  private static _instantiatedMutableConverter<TCOLLECTIONID extends string, TITEMID extends string, TITEM>(
    collectionIdConverter: Converter<TCOLLECTIONID, unknown> | Validator<TCOLLECTIONID, unknown>
  ): Converter<IMutableAggregatedResultMapEntry<TCOLLECTIONID, TITEMID, TITEM>, unknown> {
    return Converters.strictObject<IMutableAggregatedResultMapEntry<TCOLLECTIONID, TITEMID, TITEM>>({
      isMutable: Converters.literal(true),
      id: collectionIdConverter,
      items: Converters.isA<ValidatingResultMap<TITEMID, TITEM>>(
        'ValidatingResultMap',
        (t) => t instanceof ValidatingResultMap
      )
    });
  }

  /**
   * Creates a converter for pre-instantiated read-only entries.
   * These are entries that already have an IReadOnlyValidatingResultMap as their items property.
   */
  private static _instantiatedReadonlyConverter<TCOLLECTIONID extends string, TITEMID extends string, TITEM>(
    collectionIdConverter: Converter<TCOLLECTIONID, unknown> | Validator<TCOLLECTIONID, unknown>
  ): Converter<IReadonlyAggregatedResultMapEntry<TCOLLECTIONID, TITEMID, TITEM>, unknown> {
    return Converters.strictObject<IReadonlyAggregatedResultMapEntry<TCOLLECTIONID, TITEMID, TITEM>>({
      isMutable: Converters.literal(false),
      id: collectionIdConverter,
      items: Converters.isA<IReadOnlyValidatingResultMap<TITEMID, TITEM>>(
        'IReadOnlyValidatingResultMap',
        (t) => t instanceof ValidatingResultMap
      )
    });
  }

  /**
   * Creates a converter for JSON entries with an entries array.
   * Converts the entries array to a ValidatingResultMap.
   */
  private static _jsonWithEntriesConverter<TCOLLECTIONID extends string, TITEMID extends string, TITEM>(
    collectionIdConverter: Converter<TCOLLECTIONID, unknown> | Validator<TCOLLECTIONID, unknown>,
    childKvConverters: KeyValueConverters<TITEMID, TITEM>
  ): Converter<AggregatedResultMapEntry<TCOLLECTIONID, TITEMID, TITEM>, unknown> {
    // Converter for an array of [key, value] tuples
    const entriesArrayConverter = Converters.isA<KeyValueEntry<string, unknown>[]>(
      'entries array',
      (t): t is KeyValueEntry<string, unknown>[] =>
        Array.isArray(t) && t.every((item) => Array.isArray(item) && item.length === 2)
    );

    return Converters.object<{
      isMutable: boolean;
      id: TCOLLECTIONID;
      entries: KeyValueEntry<string, unknown>[];
    }>({
      isMutable: Converters.boolean,
      id: collectionIdConverter,
      entries: entriesArrayConverter
    }).map<AggregatedResultMapEntry<TCOLLECTIONID, TITEMID, TITEM>>((json) => {
      const entriesResult = childKvConverters.convertEntries(json.entries);
      if (entriesResult.isFailure()) {
        return fail(entriesResult.message);
      }
      const items = new ValidatingResultMap<TITEMID, TITEM>({
        converters: childKvConverters,
        entries: entriesResult.value
      });
      if (json.isMutable) {
        return succeed<AggregatedResultMapEntry<TCOLLECTIONID, TITEMID, TITEM>>({
          isMutable: true,
          id: json.id,
          items
        });
      }
      return succeed<AggregatedResultMapEntry<TCOLLECTIONID, TITEMID, TITEM>>({
        isMutable: false,
        id: json.id,
        items: items.toReadOnly()
      });
    });
  }

  /**
   * Creates a converter for JSON entries with an items object.
   * Converts the items object to a ValidatingResultMap.
   */
  private static _jsonWithItemsConverter<TCOLLECTIONID extends string, TITEMID extends string, TITEM>(
    collectionIdConverter: Converter<TCOLLECTIONID, unknown> | Validator<TCOLLECTIONID, unknown>,
    childKvConverters: KeyValueConverters<TITEMID, TITEM>
  ): Converter<AggregatedResultMapEntry<TCOLLECTIONID, TITEMID, TITEM>, unknown> {
    return Converters.object<{
      isMutable: boolean;
      id: TCOLLECTIONID;
      items: Record<string, unknown>;
    }>({
      isMutable: Converters.boolean,
      id: collectionIdConverter,
      items: Converters.generic<Record<string, unknown>>((from) => {
        if (typeof from === 'object' && from !== null && !Array.isArray(from)) {
          return succeed(from as Record<string, unknown>);
        }
        return fail('expected an object');
      })
    }).map<AggregatedResultMapEntry<TCOLLECTIONID, TITEMID, TITEM>>((json) => {
      // Convert Record to entries array
      const entries = Object.entries(json.items) as KeyValueEntry<string, unknown>[];
      const entriesResult = childKvConverters.convertEntries(entries);
      if (entriesResult.isFailure()) {
        return fail(entriesResult.message);
      }
      const items = new ValidatingResultMap<TITEMID, TITEM>({
        converters: childKvConverters,
        entries: entriesResult.value
      });
      if (json.isMutable) {
        return succeed<AggregatedResultMapEntry<TCOLLECTIONID, TITEMID, TITEM>>({
          isMutable: true,
          id: json.id,
          items
        });
      }
      return succeed<AggregatedResultMapEntry<TCOLLECTIONID, TITEMID, TITEM>>({
        isMutable: false,
        id: json.id,
        items: items.toReadOnly()
      });
    });
  }

  /**
   * Creates a unified entry converter that handles all entry formats.
   * Tries each format in order: instantiated mutable, instantiated readonly,
   * JSON with entries array, JSON with items object.
   */
  private static _entryConverter<TCOLLECTIONID extends string, TITEMID extends string, TITEM>(
    collectionIdConverter: Converter<TCOLLECTIONID, unknown> | Validator<TCOLLECTIONID, unknown>,
    childKvConverters: KeyValueConverters<TITEMID, TITEM>
  ): Converter<AggregatedResultMapEntry<TCOLLECTIONID, TITEMID, TITEM>, unknown> {
    return Converters.oneOf<AggregatedResultMapEntry<TCOLLECTIONID, TITEMID, TITEM>, unknown>([
      AggregatedResultMapBase._instantiatedMutableConverter<TCOLLECTIONID, TITEMID, TITEM>(
        collectionIdConverter
      ),
      AggregatedResultMapBase._instantiatedReadonlyConverter<TCOLLECTIONID, TITEMID, TITEM>(
        collectionIdConverter
      ),
      AggregatedResultMapBase._jsonWithEntriesConverter<TCOLLECTIONID, TITEMID, TITEM>(
        collectionIdConverter,
        childKvConverters
      ),
      AggregatedResultMapBase._jsonWithItemsConverter<TCOLLECTIONID, TITEMID, TITEM>(
        collectionIdConverter,
        childKvConverters
      )
    ]);
  }
}

/**
 * An aggregated result map that wraps a collection of {@link ValidatingResultMap | ValidatingResultMap} instances,
 * keyed by collection ID. Items are accessed via composite IDs that combine the collection ID
 * and item ID with a delimiter.
 * @public
 */
export class AggregatedResultMap<
  TCOMPOSITEID extends string,
  TCOLLECTIONID extends string,
  TITEMID extends string,
  TITEM
> extends AggregatedResultMapBase<TCOMPOSITEID, TCOLLECTIONID, TITEMID, TITEM> {
  /**
   * Constructs a new {@link AggregatedResultMap | AggregatedResultMap}.
   * @param params -
   */
  public constructor(
    params: IAggregatedResultMapConstructorParams<TCOMPOSITEID, TCOLLECTIONID, TITEMID, TITEM>
  ) {
    super(params);
  }

  /**
   * Creates a new {@link AggregatedResultMap | AggregatedResultMap}.
   * @param params - Parameters for constructing the map.
   * @returns `Success` with the new map if successful, `Failure` otherwise.
   */
  public static create<
    TCOMPOSITEID extends string,
    TCOLLECTIONID extends string,
    TITEMID extends string,
    TITEM
  >(
    params: IAggregatedResultMapConstructorParams<TCOMPOSITEID, TCOLLECTIONID, TITEMID, TITEM>
  ): Result<AggregatedResultMap<TCOMPOSITEID, TCOLLECTIONID, TITEMID, TITEM>> {
    return captureResult(() => new AggregatedResultMap(params));
  }
}
