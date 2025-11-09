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

import * as ResourceTypes from '../../resource-types';
import * as QualifierTypes from '../../qualifier-types';
import * as Qualifiers from '../../qualifiers';
import { ISystemConfiguration } from '../json';

/**
 * Example extended qualifier types.
 * @public
 */
export const ExtendedQualifierTypes: ReadonlyArray<QualifierTypes.Config.ISystemQualifierTypeConfig> = [
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
      allowContextList: false,
      acceptLowercase: false
    }
  },
  {
    name: 'role',
    systemType: 'literal',
    configuration: {
      enumeratedValues: ['admin', 'agent', 'user', 'guest']
    }
  },
  {
    name: 'environment',
    systemType: 'literal',
    configuration: {
      enumeratedValues: ['production', 'integration', 'development', 'test', 'ephemeral']
    }
  },
  {
    name: 'currency',
    systemType: 'literal',
    configuration: {
      caseSensitive: true,
      enumeratedValues: ['USD', 'EUR', 'GBP', 'JPY', 'CNY']
    }
  },
  {
    name: 'market',
    systemType: 'literal',
    configuration: {
      enumeratedValues: [
        'world',
        'americas',
        'europe',
        'asia',
        'oceania',
        'africa',
        'middle-east',
        'latin-america',
        'caribbean',
        'central-america',
        'south-america',
        'north-america',
        'nordics',
        'baltic',
        'balkans',
        'eastern-europe',
        'western-europe',
        'central-europe',
        'eastern-africa',
        'western-africa',
        'central-africa',
        'north-africa',
        'south-africa',
        'middle-africa',
        'southeast-asia'
      ],
      hierarchy: {
        americas: 'world',
        europe: 'world',
        asia: 'world',
        oceania: 'world',
        africa: 'world',
        'middle-east': 'world',
        'latin-america': 'americas',
        caribbean: 'americas',
        'central-america': 'americas',
        'south-america': 'americas',
        'north-america': 'americas',
        nordics: 'europe',
        baltic: 'europe',
        balkans: 'europe',
        'eastern-europe': 'europe',
        'western-europe': 'europe',
        'central-europe': 'europe',
        'eastern-africa': 'africa',
        'western-africa': 'africa',
        'central-africa': 'africa',
        'north-africa': 'africa',
        'south-africa': 'africa',
        'middle-africa': 'africa',
        'southeast-asia': 'asia'
      }
    }
  }
];

/**
 * Example extended qualifiers.
 * @public
 */
export const ExtendedQualifiers: ReadonlyArray<Qualifiers.IQualifierDecl> = [
  {
    name: 'homeTerritory',
    token: 'home',
    typeName: 'territory',
    defaultPriority: 900
  },
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
  },
  {
    name: 'market',
    typeName: 'market',
    defaultPriority: 750
  },
  {
    name: 'role',
    typeName: 'role',
    defaultPriority: 700
  },
  {
    name: 'environment',
    token: 'env',
    typeName: 'environment',
    defaultPriority: 650
  },
  {
    name: 'currency',
    typeName: 'currency',
    defaultPriority: 600
  }
];

/**
 * Example resource types.
 * @public
 */
export const ExtendedResourceTypes: ReadonlyArray<ResourceTypes.Config.IResourceTypeConfig> = [
  {
    name: 'json',
    typeName: 'json'
  }
];

/**
 * An example system configuration demonstrating various configuration options.
 * @public
 */
export const ExtendedSystemConfiguration: ISystemConfiguration = {
  name: 'extended-example',
  description: 'An example system configuration demonstrating various configuration options',
  qualifierTypes: [...ExtendedQualifierTypes],
  qualifiers: [...ExtendedQualifiers],
  resourceTypes: [...ExtendedResourceTypes]
};
