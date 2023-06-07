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
import { ICountryOrArea } from './common';

/**
 * @public
 */
export class Areas {
  /**
   * @internal
   */
  protected _m49: Map<Iana.Model.UnM49RegionCode, ICountryOrArea> = new Map();

  /**
   * @internal
   */
  protected _isoAlpha2: Map<Iana.Model.IsoAlpha2RegionCode, ICountryOrArea> = new Map();

  /**
   * @internal
   */
  protected _isoAlpha3: Map<Iana.Model.IsoAlpha3RegionCode, ICountryOrArea> = new Map();

  public addArea(area: ICountryOrArea): Result<ICountryOrArea> {
    const existing = {
      m49: this._m49.get(area.code),
      alpha2: area.isoAlpha2 ? this._isoAlpha2.get(area.isoAlpha2) : undefined,
      alpha3: area.isoAlpha3 ? this._isoAlpha3.get(area.isoAlpha3) : undefined
    };
    if (existing.m49) {
      return fail(`${area.name}: Region ${existing.m49.name} already exists with M.49 code ${area.code}`);
    } else if (existing.alpha2) {
      return fail(
        `${area.name}: Region ${existing.alpha2.name} already exists with ISO Alpha-2 code ${area.isoAlpha2}`
      );
    } else if (existing.alpha3) {
      return fail(
        `${area.name}: Region ${existing.alpha3.name} already exists with ISO Alpha-3 code ${area.isoAlpha3}`
      );
    }
    const added = { ...area };
    this._m49.set(area.code, added);
    if (area.isoAlpha2) {
      this._isoAlpha2.set(area.isoAlpha2, added);
    }
    if (area.isoAlpha3) {
      this._isoAlpha3.set(area.isoAlpha3, added);
    }
    area.parent.areas.push(added);
    return succeed(added);
  }

  public tryGetArea(from: Iana.Model.UnM49RegionCode): ICountryOrArea | undefined {
    return this._m49.get(from);
  }

  public tryGetAlpha2Area(from: Iana.Model.IsoAlpha2RegionCode): ICountryOrArea | undefined {
    return this._isoAlpha2.get(from.toUpperCase() as Iana.Model.IsoAlpha2RegionCode);
  }

  public tryGetAlpha3Area(from: Iana.Model.IsoAlpha3RegionCode): ICountryOrArea | undefined {
    return this._isoAlpha3.get(from.toUpperCase() as Iana.Model.IsoAlpha3RegionCode);
  }

  public getArea(from: Iana.Model.UnM49RegionCode): Result<ICountryOrArea> {
    const got = this._m49.get(from);
    return got ? succeed(got) : fail(`${from}: area not found`);
  }

  public getAlpha2Area(from: Iana.Model.IsoAlpha2RegionCode): Result<ICountryOrArea> {
    const got = this._isoAlpha2.get(from.toUpperCase() as Iana.Model.IsoAlpha2RegionCode);
    return got ? succeed(got) : fail(`${from}: alpha-2 area not found`);
  }

  public getAlpha3Area(from: Iana.Model.IsoAlpha3RegionCode): Result<ICountryOrArea> {
    const got = this._isoAlpha3.get(from.toUpperCase() as Iana.Model.IsoAlpha3RegionCode);
    return got ? succeed(got) : fail(`${from}: alpha-3 area not found`);
  }

  public getAll(): ICountryOrArea[] {
    return Array.from(this._m49.values());
  }
}
