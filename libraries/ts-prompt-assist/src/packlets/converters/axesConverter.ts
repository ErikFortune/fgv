/*
 * Copyright (c) 2026 Erik Fortune
 * SPDX-License-Identifier: MIT
 */

import { Converter, Converters, Result, fail, succeed } from '@fgv/ts-utils';
import { Qualifiers } from '@fgv/ts-res';

/**
 * Shape of the YAML body of `_qualifiers.yaml`. The store carries the
 * declarations; the library converts them into a `QualifierCollector` via
 * ts-res's `qualifierDecl` Converter at `PromptLibrary.create` time.
 * @public
 */
export interface IQualifiersFileContents {
  readonly qualifiers: ReadonlyArray<Qualifiers.IQualifierDecl>;
}

/**
 * Converter for the `_qualifiers.yaml` body. Delegates per-declaration
 * validation to ts-res's own `qualifierDecl` Converter (does NOT shadow).
 * @public
 */
export const qualifiersFileConverter: Converter<IQualifiersFileContents> =
  Converters.generic<IQualifiersFileContents>((from: unknown): Result<IQualifiersFileContents> => {
    if (typeof from !== 'object' || from === null) {
      return fail('qualifiers file: expected an object');
    }
    const raw = from as { readonly qualifiers?: unknown };
    return Converters.arrayOf(Qualifiers.Convert.qualifierDecl)
      .convert(raw.qualifiers)
      .withErrorFormat((msg) => `qualifiers file: ${msg}`)
      .onSuccess((qualifiers) => succeed<IQualifiersFileContents>({ qualifiers }));
  });
