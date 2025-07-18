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

/* eslint-disable @rushstack/typedef-var */

import { Converters } from '@fgv/ts-utils';
import { ISystemConfiguration } from './json';
import * as QualifierTypes from '../qualifier-types';
import * as Qualifiers from '../qualifiers';
import * as ResourceTypes from '../resource-types';
import { allPredefinedSystemConfigurations } from './common';

/**
 * A `Converter` for {@link Config.Model.ISystemConfiguration | ISystemConfiguration} objects.
 * @returns A `Converter` for {@link Config.Model.ISystemConfiguration | ISystemConfiguration} objects.
 * @public
 */
export const systemConfiguration = Converters.strictObject<ISystemConfiguration>({
  name: Converters.optionalString,
  description: Converters.optionalString,
  qualifierTypes: Converters.arrayOf(QualifierTypes.Config.Convert.systemQualifierTypeConfig),
  qualifiers: Converters.arrayOf(Qualifiers.Convert.qualifierDecl),
  resourceTypes: Converters.arrayOf(ResourceTypes.Config.Convert.resourceTypeConfig)
});

/**
 * A `Converter` for {@link Config.PredefinedSystemConfiguration | PredefinedSystemConfiguration} values.
 * @returns A `Converter` for {@link Config.PredefinedSystemConfiguration | PredefinedSystemConfiguration} values.
 * @public
 */
export const predefinedSystemConfiguration = Converters.enumeratedValue(allPredefinedSystemConfigurations);
