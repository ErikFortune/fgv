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
  DetailedResult,
  MessageAggregator,
  Result,
  fail,
  failWithDetail,
  succeed,
  succeedWithDetail
} from '../base';
import { Converter, Converters } from '../conversion';
import { Validator } from '../validation';
import { KeyValueEntry } from './common';
import { KeyValueConverters } from './keyValueConverters';
import { IReadOnlyResultMapValidator } from './resultMapValidator';
import { ResultMapForEachCb, ResultMapResultDetail } from './readonlyResultMap';
import { ResultMap } from './resultMap';
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
  readonly entries: Iterable<KeyValueEntry<string, unknown>>;
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
 * Parameters for constructing an {@link AggregatedResultMap}.
 * @public
 */
export interface IAggregatedResultMapConstructorParams<
  TCOMPOSITEID extends string,
  TCOLLECTIONID extends string,
  TITEMID extends string,
  TITEM
> {
  readonly compositeIdValidator: Validator<TCOMPOSITEID, unknown>;
  readonly collectionIdConverter: Converter<TCOLLECTIONID, unknown> | Validator<TCOLLECTIONID, unknown>;
  readonly itemIdConverter: Converter<TITEMID, unknown> | Validator<TITEMID, unknown>;
  readonly itemConverter: Converter<TITEM, unknown> | Validator<TITEM, unknown>;
  readonly delimiter?: string;
  readonly collections?: AggregatedResultMapEntryInit<TCOLLECTIONID, TITEMID, TITEM>[];
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
 * Internal parameters for the private constructor.
 */
interface IAggregatedResultMapInternalParams<
  TCOMPOSITEID extends string,
  TCOLLECTIONID extends string,
  TITEMID extends string,
  TITEM
> {
  readonly compositeIdValidator: Validator<TCOMPOSITEID, unknown>;
  readonly collectionIdConverter: Converter<TCOLLECTIONID, unknown> | Validator<TCOLLECTIONID, unknown>;
  readonly itemIdConverter: Converter<TITEMID, unknown> | Validator<TITEMID, unknown>;
  readonly itemConverter: Converter<TITEM, unknown> | Validator<TITEM, unknown>;
  readonly delimiter: string;
  readonly childKvConverters: KeyValueConverters<TITEMID, TITEM>;
  readonly compositeIdConverter: Converter<Converters.ICompositeId<TCOLLECTIONID, TITEMID>, unknown>;
  readonly collections: ResultMap<TCOLLECTIONID, AggregatedResultMapEntry<TCOLLECTIONID, TITEMID, TITEM>>;
  readonly kvConverters: KeyValueConverters<TCOMPOSITEID, TITEM>;
}

/**
 * An aggregated result map that wraps a collection of {@link ValidatingResultMap} instances,
 * keyed by collection ID. Items are accessed via composite IDs that combine the collection ID
 * and item ID with a delimiter.
 * @public
 */
export class AggregatedResultMap<
  TCOMPOSITEID extends string,
  TCOLLECTIONID extends string,
  TITEMID extends string,
  TITEM
> implements IReadOnlyValidatingResultMap<TCOMPOSITEID, TITEM>
{
  private readonly _childKvConverters: KeyValueConverters<TITEMID, TITEM>;
  private readonly _collections: ResultMap<
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
  private readonly _validating: AggregatedResultMapValidator<TCOMPOSITEID, TCOLLECTIONID, TITEMID, TITEM>;

  private constructor(
    params: IAggregatedResultMapInternalParams<TCOMPOSITEID, TCOLLECTIONID, TITEMID, TITEM>
  ) {
    this._compositeIdValidator = params.compositeIdValidator;
    this._collectionIdConverter = params.collectionIdConverter;
    this._itemIdConverter = params.itemIdConverter;
    this._itemConverter = params.itemConverter;
    this._delimiter = params.delimiter;
    this._childKvConverters = params.childKvConverters;
    this._compositeIdConverter = params.compositeIdConverter;
    this._collections = params.collections;
    this._validating = new AggregatedResultMapValidator<TCOMPOSITEID, TCOLLECTIONID, TITEMID, TITEM>(
      this,
      params.kvConverters
    );
  }

  /**
   * Creates a new {@link AggregatedResultMap}.
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
    const delimiter = params.delimiter ?? '.';
    const initCollections = params.collections ?? [];

    const childKvConverters = new KeyValueConverters<TITEMID, TITEM>({
      key: params.itemIdConverter,
      value: params.itemConverter
    });

    const compositeIdConverter = Converters.compositeId(
      params.collectionIdConverter,
      delimiter,
      params.itemIdConverter
    );

    const kvConverters = new KeyValueConverters<TCOMPOSITEID, TITEM>({
      key: params.compositeIdValidator,
      value: params.itemConverter
    });

    const entryConverter = AggregatedResultMap._entryConverter(
      params.collectionIdConverter,
      childKvConverters
    );

    // Convert all input collections
    const aggregator = new MessageAggregator();
    const convertedEntries: AggregatedResultMapEntry<TCOLLECTIONID, TITEMID, TITEM>[] = [];

    for (const entry of initCollections) {
      const result = entryConverter.convert(entry);
      if (result.isSuccess()) {
        convertedEntries.push(result.value);
      } else {
        aggregator.addMessage(result.message);
      }
    }

    if (aggregator.hasMessages) {
      return fail(`Failed to create AggregatedResultMap: ${aggregator.toString()}`);
    }

    // Build the inner ResultMap
    const collectionsMapResult = ResultMap.create<
      TCOLLECTIONID,
      AggregatedResultMapEntry<TCOLLECTIONID, TITEMID, TITEM>
    >(convertedEntries.map((e) => [e.id, e]));

    return collectionsMapResult.onSuccess((collections) => {
      return succeed(
        new AggregatedResultMap<TCOMPOSITEID, TCOLLECTIONID, TITEMID, TITEM>({
          compositeIdValidator: params.compositeIdValidator,
          collectionIdConverter: params.collectionIdConverter,
          itemIdConverter: params.itemIdConverter,
          itemConverter: params.itemConverter,
          delimiter,
          childKvConverters,
          compositeIdConverter,
          collections,
          kvConverters
        })
      );
    });
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
        const compositeId = `${collectionEntry.id}${this._delimiter}${itemId}` as TCOMPOSITEID;
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
   * @param factory - A factory function to create the value if not found.
   * @returns `Success` with the existing or new value.
   */
  public getOrAdd(
    key: TCOMPOSITEID,
    factory: (key: TITEMID) => Result<TITEM>
  ): DetailedResult<TITEM, ResultMapResultDetail>;

  public getOrAdd(
    key: TCOMPOSITEID,
    valueOrFactory: TITEM | ((key: TITEMID) => Result<TITEM>)
  ): DetailedResult<TITEM, ResultMapResultDetail> {
    return this._splitCompositeId(key).onSuccess(({ collectionId, itemId }) => {
      return this._getOrCreateMutableCollection(collectionId).onSuccess((collection) => {
        return collection.getOrAdd(itemId, valueOrFactory as TITEM);
      });
    });
  }

  // ==================== Collection-level methods ====================

  /**
   * Gets a collection by its ID.
   * @param collectionId - The ID of the collection.
   * @returns `Success` with the collection if found, `Failure` otherwise.
   */
  public getCollection(
    collectionId: TCOLLECTIONID
  ): DetailedResult<AggregatedResultMapEntry<TCOLLECTIONID, TITEMID, TITEM>, ResultMapResultDetail> {
    return this._collections.get(collectionId);
  }

  /**
   * Checks if a collection exists.
   * @param collectionId - The ID of the collection.
   * @returns `true` if the collection exists, `false` otherwise.
   */
  public hasCollection(collectionId: TCOLLECTIONID): boolean {
    return this._collections.has(collectionId);
  }

  /**
   * Adds a new collection.
   * @param entry - The collection entry to add.
   * @returns `Success` with the entry if added, `Failure` otherwise.
   */
  public addCollection(
    entry: AggregatedResultMapEntryInit<TCOLLECTIONID, TITEMID, TITEM>
  ): DetailedResult<AggregatedResultMapEntry<TCOLLECTIONID, TITEMID, TITEM>, ResultMapResultDetail> {
    const entryConverter = AggregatedResultMap._entryConverter(
      this._collectionIdConverter,
      this._childKvConverters
    );
    const convertResult = entryConverter.convert(entry);
    if (convertResult.isFailure()) {
      return failWithDetail(convertResult.message, 'invalid-value');
    }
    return this._collections.add(convertResult.value.id, convertResult.value);
  }

  /**
   * Iterates over all collections.
   */
  public collections(): IterableIterator<AggregatedResultMapEntry<TCOLLECTIONID, TITEMID, TITEM>> {
    return this._collections.values();
  }

  /**
   * The number of collections.
   */
  public get collectionCount(): number {
    return this._collections.size;
  }

  // ==================== Private helpers ====================

  private _splitCompositeId(
    key: TCOMPOSITEID
  ): DetailedResult<Converters.ICompositeId<TCOLLECTIONID, TITEMID>, ResultMapResultDetail> {
    const result = this._compositeIdConverter.convert(key);
    if (result.isFailure()) {
      return failWithDetail(result.message, 'invalid-key');
    }
    return succeedWithDetail(result.value, 'success');
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
      if (!entry.isMutable) {
        return failWithDetail(`Cannot modify immutable collection '${entry.id}'`, 'failure');
      }
      return succeedWithDetail(
        { entry: entry as IMutableAggregatedResultMapEntry<TCOLLECTIONID, TITEMID, TITEM>, itemId },
        'success'
      );
    });
  }

  private _getMutableCollection(
    collectionId: TCOLLECTIONID
  ): DetailedResult<ValidatingResultMap<TITEMID, TITEM>, ResultMapResultDetail> {
    return this._collections.get(collectionId).onSuccess((entry) => {
      if (!entry.isMutable) {
        return failWithDetail(`Cannot modify immutable collection '${collectionId}'`, 'failure');
      }
      return succeedWithDetail(entry.items, 'exists');
    });
  }

  private _getOrCreateMutableCollection(
    collectionId: TCOLLECTIONID
  ): DetailedResult<ValidatingResultMap<TITEMID, TITEM>, ResultMapResultDetail> {
    const existing = this._collections.get(collectionId);
    if (existing.isSuccess()) {
      if (!existing.value.isMutable) {
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

  // ==================== Static converters ====================

  private static _entryConverter<TCOLLECTIONID extends string, TITEMID extends string, TITEM>(
    collectionIdConverter: Converter<TCOLLECTIONID, unknown> | Validator<TCOLLECTIONID, unknown>,
    childKvConverters: KeyValueConverters<TITEMID, TITEM>
  ): Converter<AggregatedResultMapEntry<TCOLLECTIONID, TITEMID, TITEM>, unknown> {
    // Converter for pre-instantiated entries (with ValidatingResultMap)
    const instantiatedMutableConverter = Converters.strictObject<
      IMutableAggregatedResultMapEntry<TCOLLECTIONID, TITEMID, TITEM>
    >({
      isMutable: Converters.literal(true),
      id: collectionIdConverter,
      items: Converters.isA<ValidatingResultMap<TITEMID, TITEM>>(
        'ValidatingResultMap',
        (t) => t instanceof ValidatingResultMap
      )
    });

    const instantiatedReadonlyConverter = Converters.strictObject<
      IReadonlyAggregatedResultMapEntry<TCOLLECTIONID, TITEMID, TITEM>
    >({
      isMutable: Converters.literal(false),
      id: collectionIdConverter,
      items: Converters.isA<IReadOnlyValidatingResultMap<TITEMID, TITEM>>(
        'IReadOnlyValidatingResultMap',
        (t) => t instanceof ValidatingResultMap
      )
    });

    // Converter for JSON with entries array
    const jsonWithEntriesConverter: Converter<
      AggregatedResultMapEntry<TCOLLECTIONID, TITEMID, TITEM>,
      unknown
    > = Converters.object<{
      isMutable: boolean;
      id: TCOLLECTIONID;
      entries: Iterable<KeyValueEntry<string, unknown>>;
    }>({
      isMutable: Converters.boolean,
      id: collectionIdConverter,
      entries: Converters.isA<Iterable<KeyValueEntry<string, unknown>>>(
        'Iterable',
        (t): t is Iterable<KeyValueEntry<string, unknown>> =>
          t !== null && typeof t === 'object' && Symbol.iterator in t
      )
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

    // Converter for JSON with items object
    const jsonWithItemsConverter: Converter<
      AggregatedResultMapEntry<TCOLLECTIONID, TITEMID, TITEM>,
      unknown
    > = Converters.object<{
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

    return Converters.oneOf<AggregatedResultMapEntry<TCOLLECTIONID, TITEMID, TITEM>, unknown>([
      instantiatedMutableConverter,
      instantiatedReadonlyConverter,
      jsonWithEntriesConverter,
      jsonWithItemsConverter
    ]);
  }
}
