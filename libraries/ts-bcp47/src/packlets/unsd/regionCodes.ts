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

import * as Iana from '../iana';
import * as Model from './csv/model';

import { Result, allSucceed, succeed } from '@fgv/ts-utils';
import { ICountryOrArea, Region } from './common';
import { loadM49csvFileSync, m49CsvFile } from './csv/converters';

// eslint-disable-next-line @rushstack/packlets/mechanics
import defaultRegions from '../../data/unsd/m49.json';
import { Areas } from './areas';
import { Regions } from './regions';

/**
 * @public
 */
export class RegionCodes {
  public readonly regions: Regions;
  public readonly areas: Areas;

  /**
   * @internal
   */
  protected constructor() {
    this.regions = new Regions();
    this.areas = new Areas();
  }

  public static create(rows: Model.IM49CsvRow[]): Result<RegionCodes> {
    const codes = new RegionCodes();
    return codes._importRows(rows).onSuccess(() => {
      return succeed(codes);
    });
  }

  public static createFromJson(from: unknown): Result<RegionCodes> {
    return m49CsvFile.convert(from).onSuccess(RegionCodes.create);
  }

  public static loadDefault(): Result<RegionCodes> {
    return this.createFromJson(defaultRegions);
  }

  public static loadCsv(path: string): Result<RegionCodes> {
    return loadM49csvFileSync(path).onSuccess((rows) => {
      return this.create(rows);
    });
  }

  public tryGetRegionOrArea(code: Iana.Model.UnM49RegionCode): Region | ICountryOrArea | undefined {
    // istanbul ignore next - numeric area not allowed in bcp-47 so right side of ?? shouldn't be hit.
    return this.regions.tryGetRegion(code) ?? this.areas.tryGetArea(code);
  }

  public getIsContained(container: Region, contained: ICountryOrArea | Region): boolean {
    let next: Region | ICountryOrArea | undefined = contained;
    while (next) {
      if (next === container) {
        return true;
      }
      next = next.tier !== 'global' ? next.parent : undefined;
    }
    return false;
  }

  /**
   * Imports a single parsed row of UN M.49 region code data
   * @param row - The parsed row to be imported.
   * @returns `Success` with `true` if the row was successfully
   * imported, or `Failure` with details if an error occurs.
   * @internal
   */
  protected _importRow(row: Model.IM49CsvRow): Result<true> {
    return this.regions
      .getOrAddRegionChildRegion('region', this.regions.global, row.regionCode, row.regionName)
      .onSuccess((region) => {
        return this.regions.getOrAddRegionChildRegion(
          'subRegion',
          region,
          row.subRegionCode,
          row.subRegionName
        );
      })
      .onSuccess((region) => {
        return this.regions.getOrAddRegionChildRegion(
          'intermediateRegion',
          region,
          row.intermediateRegionCode,
          row.intermediateRegionName
        );
      })
      .onSuccess((region) => {
        return this.areas.addArea({
          name: row.countryOrArea,
          code: row.m49Code,
          tier: 'area',
          parent: region,
          isoAlpha2: row.isoAlpha2RegionCode,
          isoAlpha3: row.isoAlpha3RegionCode,
          leastDevelopedCountry: row.leastDevelopedCountry,
          landlockedDevelopingCountry: row.landLockedDevelopingCountry,
          smallIslandDevelopingState: row.smallIslandDevelopingState
        });
      })
      .onSuccess(() => {
        return succeed(true);
      });
  }

  /**
   * Imports multiple parsed rows from UN M.49 region code data
   * @param rows - The parsed rows to be imported.
   * @returns `Success` with `true` if the rows were successfully
   * imported, or `Failure` with details if an error occurs.
   * @internal
   */
  protected _importRows(rows: Model.IM49CsvRow[]): Result<true> {
    return allSucceed(
      rows.map((row) => this._importRow(row)),
      true
    );
  }
}
