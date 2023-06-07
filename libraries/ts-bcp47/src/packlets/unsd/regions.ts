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

import { Result, fail, succeed } from '@fgv/ts-utils';
import * as Iana from '../iana';
import { IGlobalRegion, IntermediateRegionTier, Region } from './common';

/* eslint-disable @typescript-eslint/naming-convention */
export const GlobalRegionName: string = 'World';
export const GlobalRegionCode: Iana.Model.UnM49RegionCode = '001' as Iana.Model.UnM49RegionCode;
/* eslint-enable @typescript-eslint/naming-convention */

/**
 * @public
 */
export class Regions {
  public readonly global: IGlobalRegion;
  /**
   * @internal
   */
  protected readonly _regions: Map<Iana.Model.UnM49RegionCode, Region>;

  public constructor() {
    this.global = { name: GlobalRegionName, code: GlobalRegionCode, tier: 'global', regions: [], areas: [] };
    this._regions = new Map();
  }

  public tryGetRegion(from: Iana.Model.UnM49RegionCode): Region | undefined {
    return this._regions.get(from);
  }

  public getRegion(from: Iana.Model.UnM49RegionCode): Result<Region> {
    const got = this._regions.get(from);
    return got ? succeed(got) : fail(`${from}: region not found`);
  }

  public getOrAddRegionChildRegion(
    tier: IntermediateRegionTier,
    parent: Region,
    code: Iana.Model.UnM49RegionCode | undefined,
    name: string | undefined
  ): Result<Region> {
    if (!code && !name) {
      return succeed(parent);
    } else if (!code || !name) {
      return fail(`${code}(${name}): code and name must both be present`);
    }

    const existing = this._regions.get(code);
    if (existing) {
      if (existing.name !== name) {
        return fail(`${code}: cannot add ${name} - already exists as ${existing.name}`);
      }
      if (existing.tier !== tier) {
        return fail(`${code}: cannot add ${name} as tier ${tier} - already exists as tier ${existing.tier}`);
      }
      if (existing.parent !== parent) {
        const haveParent = `${existing.parent.code}/${existing.parent.name}`;
        const wantParent = `${parent.code}/${parent.name}`;
        return fail(
          `${code}: cannot add ${name} with parent ${wantParent} - already exists with parent ${haveParent}`
        );
      }
      return succeed(existing);
    }

    const added = { name, code, tier, parent, regions: [], areas: [] };
    this._regions.set(code, added);
    parent.regions.push(added);
    return succeed(added);
  }

  public getAll(): Region[] {
    return Array.from(this._regions.values());
  }
}
