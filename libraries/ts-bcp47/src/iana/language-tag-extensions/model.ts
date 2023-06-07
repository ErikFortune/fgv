/*
 * Copyright (c) 2022 Erik Fortune
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
/* eslint-disable @typescript-eslint/naming-convention */

import * as Iana from '../../iana';

import { Brand } from '@fgv/ts-utils';
import { IDatedRegistry } from '../model';

/**
 * @public
 */
export type ExtensionSingleton = Brand<string, 'ExtensionSingleton'>;

/**
 * @internal
 */
export interface LanguageTagExtensionRegistryEntry {
  /* eslint-disable @typescript-eslint/naming-convention */
  Identifier: ExtensionSingleton;
  Description: string[];
  Comments: string[];
  Added: Iana.Model.YearMonthDaySpec;
  RFC: string;
  Authority: string;
  Contact_Email: string;
  Mailing_List: string;
  URL: string;
  /* eslint-enable @typescript-eslint/naming-convention */
}

/**
 * @internal
 */
export interface ILanguageTagExtension {
  identifier: ExtensionSingleton;
  description: string[];
  comments: string[];
  added: Iana.Model.YearMonthDaySpec;
  rfc: string;
  authority: string;
  contactEmail: string;
  mailingList: string;
  url: string;
}

/**
 * @internal
 */
export type LanguageTagExtensions = IDatedRegistry<ILanguageTagExtension>;
