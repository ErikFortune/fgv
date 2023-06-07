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

import { IsoAlpha2RegionCode, IsoAlpha3RegionCode, UnM49RegionCode } from '../iana/model';

/**
 * @public
 */
export type IntermediateRegionTier = 'region' | 'subRegion' | 'intermediateRegion';
/**
 * @public
 */
export type RegionTier = 'global' | IntermediateRegionTier;

/**
 * @public
 */
export interface IGlobalRegion {
  name: string;
  code: UnM49RegionCode;
  tier: 'global';
  /* eslint-disable no-use-before-define */
  regions: IIntermediateRegion[];
  areas: ICountryOrArea[];
  /* eslint-enable no-use-before-define */
}

/**
 * @public
 */
export interface IIntermediateRegion {
  name: string;
  code: UnM49RegionCode;
  tier: RegionTier;
  /* eslint-disable no-use-before-define */
  parent: Region;
  regions: IIntermediateRegion[];
  areas: ICountryOrArea[];
  /* eslint-enable no-use-before-define */
}

/**
 * @public
 */
export type Region = IGlobalRegion | IIntermediateRegion;

/**
 * @public
 */
export interface ICountryOrArea {
  name: string;
  code: UnM49RegionCode;
  tier: 'area';
  parent: Region;
  isoAlpha2?: IsoAlpha2RegionCode;
  isoAlpha3?: IsoAlpha3RegionCode;
  leastDevelopedCountry: boolean;
  landlockedDevelopingCountry: boolean;
  smallIslandDevelopingState: boolean;
}
