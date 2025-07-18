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

import { ISystemConfiguration } from '../json';

import * as QualifierTypes from '../../qualifier-types';
import * as Qualifiers from '../../qualifiers';
import * as ResourceTypes from '../../resource-types';

/**
 * Default qualifier types.
 * @remarks
 * The default qualifier types are:
 * - language: recognizes BCP 47 language tags, accepts a comma-separated list of language tags in the context
 * - territory: recognizes ISO 3166-1 alpha-2 territory codes, accepts a single code in the context
 * @public
 */
export const DefaultQualifierTypes: ReadonlyArray<QualifierTypes.Config.ISystemQualifierTypeConfig> = [
  {
    name: 'language',
    systemType: 'language',
    configuration: {
      allowContextList: true
    }
  },
  {
    name: 'territory',
    systemType: 'territory',
    configuration: {
      allowContextList: false
    }
  }
];

/**
 * Qualifier definitions in which territory is the primary qualifier, with
 * language as a secondary qualifier.
 * @remarks
 * The default qualifiers are:
 * - currentTerritory(token: geo): territory qualifier, priority 850
 * - language(token: lang): language qualifier, priority 800
 * @public
 */
export const TerritoryPriorityQualifiers: ReadonlyArray<Qualifiers.IQualifierDecl> = [
  {
    name: 'currentTerritory',
    token: 'geo',
    typeName: 'territory',
    defaultPriority: 850
  },
  {
    name: 'language',
    token: 'lang',
    typeName: 'language',
    defaultPriority: 800
  }
];

/**
 * Qualifier definitions in which language is the primary qualifier, with
 * territory as a secondary qualifier.
 * @remarks
 * The default qualifiers are:
 * - language(token: lang): language qualifier, priority 850
 * - currentTerritory(token: geo): territory qualifier, priority 800
 * @public
 */
export const LanguagePriorityQualifiers: ReadonlyArray<Qualifiers.IQualifierDecl> = [
  {
    name: 'language',
    token: 'lang',
    typeName: 'language',
    defaultPriority: 850
  },
  {
    name: 'currentTerritory',
    token: 'geo',
    typeName: 'territory',
    defaultPriority: 800
  }
];

/**
 * Default resource types.
 * @public
 */
export const DefaultResourceTypes: ReadonlyArray<ResourceTypes.Config.IResourceTypeConfig> = [
  {
    name: 'json',
    typeName: 'json'
  }
];

/**
 * System configuration with territory as the primary qualifier, and
 * language as a secondary qualifier.
 * @public
 */
export const TerritoryPrioritySystemConfiguration: ISystemConfiguration = {
  name: 'default',
  description: 'Default system configuration',
  qualifierTypes: [...DefaultQualifierTypes],
  qualifiers: [...TerritoryPriorityQualifiers],
  resourceTypes: [...DefaultResourceTypes]
};

/**
 * System configuration with language as the primary qualifier, and
 * territory as a secondary qualifier.
 * @public
 */
export const LanguagePrioritySystemConfiguration: ISystemConfiguration = {
  name: 'default',
  description: 'Default system configuration',
  qualifierTypes: [...DefaultQualifierTypes],
  qualifiers: [...LanguagePriorityQualifiers],
  resourceTypes: [...DefaultResourceTypes]
};

/**
 * The default system configuration gives priority to territory as the primary qualifier,
 * with language as a secondary qualifier.
 * @public
 */
export const DefaultSystemConfiguration: ISystemConfiguration = TerritoryPrioritySystemConfiguration;
