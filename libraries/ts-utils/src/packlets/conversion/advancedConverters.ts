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

import { fail, isKeyOf, succeed } from '../base';
import { Validator } from '../validation';
import { BaseConverter } from './baseConverter';
import { Converter } from './converter';
import { literal, oneOf } from './basicConverters';
import { FieldConverters, ObjectConverter } from './objectConverter';

/**
 * Represents a composite ID constructed of two strongly-typed string IDs
 * separated by a delimiter.
 * @public
 */
export interface ICompositeId<TCOLLECTIONID extends string, TITEMID extends string> {
  readonly collectionId: TCOLLECTIONID;
  readonly separator: string;
  readonly itemId: TITEMID;
}

/**
 * Creates an {@link ObjectConverter | ObjectConverter} for a strongly-typed {@link Converters.ICompositeId | CompositeId}.
 * @param collectionIdValidator - {@link Converter | Converter} or {@link Validator | Validator} for the collection ID portion.
 * @param separator - The separator string.
 * @param itemIdValidator - {@link Converter | Converter} or {@link Validator | Validator} for the item ID portion.
 * @returns An {@link ObjectConverter | ObjectConverter} for the strongly-typed composite ICompositeId.
 * @public
 */
export function compositeIdFromObject<TCOLLECTIONID extends string, TITEMID extends string, TC = unknown>(
  collectionIdValidator: Converter<TCOLLECTIONID, TC> | Validator<TCOLLECTIONID, TC>,
  separator: string,
  itemIdValidator: Converter<TITEMID, TC> | Validator<TITEMID, TC>
): ObjectConverter<ICompositeId<TCOLLECTIONID, TITEMID>, TC> {
  return new ObjectConverter<ICompositeId<TCOLLECTIONID, TITEMID>, TC>({
    collectionId: collectionIdValidator,
    separator: literal(separator),
    itemId: itemIdValidator
  });
}

/**
 * Converts a composite ID string into a strongly-typed {@link Converters.ICompositeId | CompositeId}.
 * @param collectionIdConverter - {@link Converter | Converter} or {@link Validator | Validator} for the collection ID portion.
 * @param separator - The separator string.
 * @param itemIdConverter - {@link Converter | Converter} or {@link Validator | Validator} for the item ID portion.
 * @returns A {@link Converter | Converter} for the strongly-typed {@link Converters.ICompositeId | CompositeId}.
 * @public
 */
export function compositeIdFromString<TCOLLECTIONID extends string, TITEMID extends string, TC = unknown>(
  collectionIdConverter: Converter<TCOLLECTIONID, TC> | Validator<TCOLLECTIONID, TC>,
  separator: string,
  itemIdConverter: Converter<TITEMID, TC> | Validator<TITEMID, TC>
): Converter<ICompositeId<TCOLLECTIONID, TITEMID>, TC> {
  return new BaseConverter<ICompositeId<TCOLLECTIONID, TITEMID>, TC>(
    (from: unknown, __self?: Converter<ICompositeId<TCOLLECTIONID, TITEMID>, TC>, context?: TC) => {
      if (typeof from !== 'string') {
        return fail(`${from}: invalid non-string composite ID.`);
      }
      const parts = from.split(separator);
      if (parts.length < 2) {
        return fail(`${from}: invalid composite ID - separator '${separator}' not found.`);
      } else if (parts.length > 2) {
        return fail(`${from}: invalid composite ID - multiple separators '${separator}.' found.`);
      }
      return collectionIdConverter.convert(parts[0], context).onSuccess((collectionId) => {
        return itemIdConverter.convert(parts[1], context).onSuccess((itemId) => {
          return succeed({
            collectionId,
            separator,
            itemId
          });
        });
      });
    }
  );
}

/**
 * Creates a {@link Converter | Converter} for a strongly-typed {@link Converters.ICompositeId | CompositeId} from
 * either a string or an object representation.
 * @param collectionIdConverter - {@link Converter | Converter} or {@link Validator | Validator} for the collection ID portion.
 * @param separator - The separator string.
 * @param itemIdConverter - {@link Converter | Converter} or {@link Validator | Validator} for the item ID portion.
 * @returns A {@link Converter | Converter} for the strongly-typed {@link Converters.ICompositeId | CompositeId}.
 * @public
 */
export function compositeId<TCOLLECTIONID extends string, TITEMID extends string, TC = unknown>(
  collectionIdConverter: Converter<TCOLLECTIONID, TC> | Validator<TCOLLECTIONID, TC>,
  separator: string,
  itemIdConverter: Converter<TITEMID, TC> | Validator<TITEMID, TC>
): Converter<ICompositeId<TCOLLECTIONID, TITEMID>, TC> {
  return oneOf<ICompositeId<TCOLLECTIONID, TITEMID>, TC>([
    compositeIdFromString(collectionIdConverter, separator, itemIdConverter),
    compositeIdFromObject(collectionIdConverter, separator, itemIdConverter)
  ]);
}

/**
 * Converts a strongly-typed {@link Converters.ICompositeId | CompositeId} into a string.
 * @param compositeIdValidator - {@link Converter | Converter} or {@link Validator | Validator} for the strongly-typed {@link Converters.ICompositeId | CompositeId}.
 * @param collectionIdConverter - {@link Converter | Converter} or {@link Validator | Validator} for the collection ID portion.
 * @param separator - The separator string.
 * @param itemIdConverter - {@link Converter | Converter} or {@link Validator | Validator} for the item ID portion.
 * @returns A {@link Converter | Converter} which produces a composite ID string.
 * @public
 */
export function compositeIdString<
  T extends string,
  TCOLLECTIONID extends string,
  TITEMID extends string,
  TC = unknown
>(
  compositeIdValidator: Validator<T, TC>,
  collectionIdConverter: Converter<TCOLLECTIONID, TC> | Validator<TCOLLECTIONID, TC>,
  separator: string,
  itemIdConverter: Converter<TITEMID, TC> | Validator<TITEMID, TC>
): Converter<T, TC> {
  const objectConverter = compositeIdFromObject(collectionIdConverter, separator, itemIdConverter);
  return new BaseConverter<T, TC>((from: unknown, __self?: Converter<T, TC>, context?: TC) => {
    if (typeof from === 'string') {
      return compositeIdValidator.validate(from, context);
    }
    return objectConverter.convert(from, context).onSuccess((compositeId) => {
      return compositeIdValidator.validate(`${compositeId.collectionId}${separator}${compositeId.itemId}`);
    });
  });
}

/**
 * Helper to create a {@link Converter | Converter} which converts a source object to a new object with a
 * different shape.
 *
 * @remarks
 * On successful conversion, the resulting {@link Converter | Converter} returns {@link Success | Success} with a new
 * object, which contains the converted values under the key names specified at initialization time.
 * It returns {@link Failure | Failure} with an error message if any fields to be extracted do not exist
 * or cannot be converted.
 *
 * Fields that succeed but convert to undefined are omitted from the result object but do not
 * fail the conversion.
 *
 * @param properties - An object with key names that correspond to the target object and an
 * appropriate {@link Conversion.FieldConverters | FieldConverter} which extracts and converts
 * a single filed from the source object.
 * @returns A {@link Converter | Converter} with the specified conversion behavior.
 * @public
 */
export function transform<T, TC = unknown>(properties: FieldConverters<T, TC>): Converter<T, TC> {
  return new BaseConverter((from: unknown, __self, context?: TC) => {
    // eslint bug thinks key is used before defined

    const converted = {} as { [key in keyof T]: T[key] };
    const errors: string[] = [];

    for (const key in properties) {
      if (properties[key]) {
        const result = properties[key].convert(from, context);
        if (result.isSuccess() && result.value !== undefined) {
          converted[key] = result.value;
        } else if (result.isFailure()) {
          errors.push(result.message);
        }
      }
    }

    return errors.length === 0 ? succeed(converted) : fail(errors.join('\n'));
  });
}

/**
 * Per-property converters and configuration for each field in the destination object of
 * a {@link Converters.transformObject} call.
 * @public
 */
export type FieldTransformers<TSRC, TDEST, TC = unknown> = {
  [key in keyof TDEST]: {
    /**
     * The name of the property in the source object to be converted.
     */
    from: keyof TSRC;
    /**
     * The converter or validator used to convert the property.
     */
    converter: Converter<TDEST[key], TC> | Validator<TDEST[key], TC>;
    /**
     * If `true` then a missing source property is ignored.  If `false` or omitted
     * then a missing source property causes an error.
     */
    optional?: boolean;
  };
};

/**
 * Options for a {@link Converters.transformObject} call.
 * @public
 */

export interface TransformObjectOptions<TSRC> {
  /**
   * If `strict` is `true` then unused properties in the source object cause
   * an error, otherwise they are ignored.
   */
  strict: true;

  /**
   * An optional list of source properties to be ignored when strict mode
   * is enabled.
   */
  ignore?: (keyof TSRC)[];

  /**
   * An optional description of this transform to be used for error messages.
   */
  description?: string;
}

/**
 * Helper to create a strongly-typed {@link Converter | Converter} which converts a source object to a
 * new object with a different shape.
 *
 * @remarks
 * On successful conversion, the resulting {@link Converter | Converter} returns {@link Success | Success} with a new
 * object, which contains the converted values under the key names specified at initialization time.
 *
 * It returns {@link Failure | Failure} with an error message if any fields to be extracted do not exist
 * or cannot be converted.
 *
 * @param destinationFields - An object with key names that correspond to the target object and an
 * appropriate {@link Converters.FieldTransformers | FieldTransformers} which specifies the name
 * of the corresponding property in the source object, the converter or validator used for each source
 * property and any other configuration to guide the conversion.
 * @param options - Options which affect the transformation.
 *
 * @returns A {@link Converter | Converter} with the specified conversion behavior.
 * @public
 */
export function transformObject<TSRC, TDEST, TC = unknown>(
  destinationFields: FieldTransformers<TSRC, TDEST, TC>,
  options?: TransformObjectOptions<TSRC>
): Converter<TDEST, TC> {
  return new BaseConverter((from: unknown, __self, context?: TC) => {
    // eslint bug thinks key is used before defined

    const converted = {} as { [key in keyof TDEST]: TDEST[key] };
    const errors: string[] = [];
    const used: Set<keyof TSRC> = new Set(options?.ignore);

    if (typeof from === 'object' && !Array.isArray(from) && from !== null) {
      for (const destinationKey in destinationFields) {
        if (destinationFields[destinationKey]) {
          const srcKey = destinationFields[destinationKey].from;
          const converter = destinationFields[destinationKey].converter;

          if (isKeyOf(srcKey, from)) {
            const result = converter.convert(from[srcKey], context);
            if (result.isSuccess() && result.value !== undefined) {
              converted[destinationKey] = result.value;
            } else if (result.isFailure()) {
              errors.push(`${srcKey}->${destinationKey}: ${result.message}`);
            }
            used.add(srcKey);
          } else if (destinationFields[destinationKey].optional !== true) {
            errors.push(`${String(srcKey)}: required property missing in source object.`);
          }
        }
      }

      if (options?.strict === true) {
        for (const key in from) {
          if (isKeyOf(key, from) && !used.has(key as keyof TSRC)) {
            errors.push(`${key}: unexpected property in source object`);
          }
        }
      }
    } else {
      errors.push('source is not an object');
    }

    return errors.length === 0
      ? succeed(converted)
      : fail(options?.description ? `${options.description}:\n  ${errors.join('\n  ')}` : errors.join('\n'));
  });
}
