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

// Browser entry point - excludes Node.js filesystem dependencies

import * as Bundle from './packlets/bundle';
import * as QualifierTypes from './packlets/qualifier-types';
import * as Qualifiers from './packlets/qualifiers';
import * as Conditions from './packlets/conditions';
// eslint-disable-next-line @rushstack/packlets/mechanics -- browser-specific entry point excludes Node.js fs dependencies
import * as Config from './packlets/config/index.browser';
import * as Context from './packlets/context';
import * as Decisions from './packlets/decisions';
import * as ResourceJson from './packlets/resource-json';
import * as Resources from './packlets/resources';
import * as ResourceTypes from './packlets/resource-types';
// eslint-disable-next-line @rushstack/packlets/mechanics -- browser-specific entry point excludes Node.js fs dependencies
import * as Import from './packlets/import/index.browser';
import * as Runtime from './packlets/runtime';
// eslint-disable-next-line @rushstack/packlets/mechanics -- browser-specific entry point excludes Node.js fs dependencies
import * as ZipArchive from './packlets/zip-archive/index.browser';

export * from './packlets/common';

import { Condition, ConditionSet } from './packlets/conditions';
import { Decision } from './packlets/decisions';
import { QualifierType } from './packlets/qualifier-types';
import { Qualifier } from './packlets/qualifiers';
import { ResourceType } from './packlets/resource-types';
import { Resource, ResourceCandidate, ResourceManagerBuilder } from './packlets/resources';
import { IResourceManager, ResourceResolver } from './packlets/runtime';
import { BundleBuilder, BundleLoader } from './packlets/bundle';

export {
  Bundle,
  BundleBuilder,
  BundleLoader,
  Condition,
  Conditions,
  ConditionSet,
  Config,
  Context,
  Decision,
  Decisions,
  Import,
  IResourceManager,
  Qualifier,
  QualifierType,
  QualifierTypes,
  Qualifiers,
  Resource,
  ResourceCandidate,
  ResourceJson,
  ResourceResolver,
  ResourceManagerBuilder,
  ResourceType,
  ResourceTypes,
  Resources,
  Runtime,
  ZipArchive
};

// Excluded from browser:
// - Config: SystemConfiguration.loadFromFile() (requires Node.js fs via JsonFile)
// - Import: PathImporter, FsItemImporter, FsItem.createForPath() (require Node.js fs)
// - ZipArchive: ZipArchiveCreator methods using file paths (require Node.js fs)
