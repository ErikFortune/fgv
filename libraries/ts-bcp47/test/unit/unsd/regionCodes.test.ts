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

import '@fgv/ts-utils-jest';
import * as Csv from '../../../src/unsd/csv';
import { IsoAlpha2RegionCode, IsoAlpha3RegionCode, UnM49RegionCode } from '../../../src/iana/model';
import { RegionCodes } from '../../../src/unsd';

describe('RegionCodes class', () => {
  describe('loadCsv static method', () => {
    test('constructs from a valid csv file', () => {
      expect(RegionCodes.loadCsv('test/data/unsd/m49.csv')).toSucceedAndSatisfy((rc: RegionCodes) => {
        expect(rc.areas.getAll()).toHaveLength(249);
        expect(rc.regions.getAll()).toHaveLength(30);

        expect(rc.regions.tryGetRegion('419' as UnM49RegionCode)).toBeDefined();
        expect(rc.regions.getRegion('002' as UnM49RegionCode)).toSucceed();
        expect(rc.regions.getRegion('010' as UnM49RegionCode)).toFail();

        expect(rc.areas.tryGetArea('010' as UnM49RegionCode)).toBeDefined();
        expect(rc.areas.tryGetAlpha2Area('US' as IsoAlpha2RegionCode)).toBeDefined();
        expect(rc.areas.tryGetAlpha3Area('DEU' as IsoAlpha3RegionCode)).toBeDefined();

        expect(rc.areas.getArea('398' as UnM49RegionCode)).toSucceed();
        expect(rc.areas.getArea('001' as UnM49RegionCode)).toFail();
        expect(rc.areas.getAlpha2Area('fr' as IsoAlpha2RegionCode)).toSucceed();
        expect(rc.areas.getAlpha2Area('zz' as IsoAlpha2RegionCode)).toFail();
        expect(rc.areas.getAlpha3Area('ggy' as IsoAlpha3RegionCode)).toSucceed();
        expect(rc.areas.getAlpha3Area('xyz' as IsoAlpha3RegionCode)).toFail();
      });
    });
  });

  describe('createFromCsv static method', () => {
    test('fails if a region has conflicting names', () => {
      const testData: Csv.Model.M49CsvRow[] = [
        {
          globalCode: '001' as UnM49RegionCode,
          globalName: 'World',
          regionCode: '002' as UnM49RegionCode,
          regionName: 'North',
          m49Code: '003' as UnM49RegionCode,
          countryOrArea: 'Country',
          leastDevelopedCountry: false,
          landLockedDevelopingCountry: false,
          smallIslandDevelopingState: false
        },
        {
          globalCode: '001' as UnM49RegionCode,
          globalName: 'World',
          regionCode: '002' as UnM49RegionCode,
          regionName: 'South',
          m49Code: '003' as UnM49RegionCode,
          countryOrArea: 'Country',
          leastDevelopedCountry: false,
          landLockedDevelopingCountry: false,
          smallIslandDevelopingState: false
        }
      ];
      expect(RegionCodes.create(testData)).toFailWith(/already exists as North/i);
    });

    test('fails if a region has conflicting tiers', () => {
      const testData: Csv.Model.M49CsvRow[] = [
        {
          globalCode: '001' as UnM49RegionCode,
          globalName: 'World',
          regionCode: '002' as UnM49RegionCode,
          regionName: 'North',
          m49Code: '003' as UnM49RegionCode,
          countryOrArea: 'Country',
          leastDevelopedCountry: false,
          landLockedDevelopingCountry: false,
          smallIslandDevelopingState: false
        },
        {
          globalCode: '001' as UnM49RegionCode,
          globalName: 'World',
          subRegionCode: '002' as UnM49RegionCode,
          subRegionName: 'North',
          m49Code: '003' as UnM49RegionCode,
          countryOrArea: 'Country',
          leastDevelopedCountry: false,
          landLockedDevelopingCountry: false,
          smallIslandDevelopingState: false
        }
      ];
      expect(RegionCodes.create(testData)).toFailWith(/already exists as tier region/i);
    });

    test('fails if a region has conflicting tiers', () => {
      const testData: Csv.Model.M49CsvRow[] = [
        {
          globalCode: '001' as UnM49RegionCode,
          globalName: 'World',
          regionCode: '002' as UnM49RegionCode,
          regionName: 'North',
          subRegionCode: '003' as UnM49RegionCode,
          subRegionName: 'North west',
          m49Code: '010' as UnM49RegionCode,
          countryOrArea: 'Country',
          leastDevelopedCountry: false,
          landLockedDevelopingCountry: false,
          smallIslandDevelopingState: false
        },
        {
          globalCode: '001' as UnM49RegionCode,
          globalName: 'World',
          regionCode: '005' as UnM49RegionCode,
          regionName: 'West',
          subRegionCode: '003' as UnM49RegionCode,
          subRegionName: 'North west',
          m49Code: '003' as UnM49RegionCode,
          countryOrArea: 'Country',
          leastDevelopedCountry: false,
          landLockedDevelopingCountry: false,
          smallIslandDevelopingState: false
        }
      ];
      expect(RegionCodes.create(testData)).toFailWith(/already exists with parent 002/i);
    });

    test('fails if a region has a code but no name', () => {
      const testData: Csv.Model.M49CsvRow[] = [
        {
          globalCode: '001' as UnM49RegionCode,
          globalName: 'World',
          regionCode: '002' as UnM49RegionCode,
          regionName: '',
          m49Code: '010' as UnM49RegionCode,
          countryOrArea: 'Country',
          leastDevelopedCountry: false,
          landLockedDevelopingCountry: false,
          smallIslandDevelopingState: false
        }
      ];
      expect(RegionCodes.create(testData)).toFailWith(/must both be present/i);
    });

    test('fails if a region has a name but no code', () => {
      const testData: Csv.Model.M49CsvRow[] = [
        {
          globalCode: '001' as UnM49RegionCode,
          globalName: 'World',
          regionName: 'North',
          m49Code: '010' as UnM49RegionCode,
          countryOrArea: 'Country',
          leastDevelopedCountry: false,
          landLockedDevelopingCountry: false,
          smallIslandDevelopingState: false
        }
      ];
      expect(RegionCodes.create(testData)).toFailWith(/must both be present/i);
    });

    test('fails if multiple area/country records have the same M.49 code', () => {
      const testData: Csv.Model.M49CsvRow[] = [
        {
          globalCode: '001' as UnM49RegionCode,
          globalName: 'World',
          regionCode: '002' as UnM49RegionCode,
          regionName: 'North',
          m49Code: '003' as UnM49RegionCode,
          countryOrArea: 'Country',
          leastDevelopedCountry: false,
          landLockedDevelopingCountry: false,
          smallIslandDevelopingState: false
        },
        {
          globalCode: '001' as UnM49RegionCode,
          globalName: 'World',
          regionCode: '002' as UnM49RegionCode,
          regionName: 'North',
          m49Code: '003' as UnM49RegionCode,
          countryOrArea: 'Country',
          leastDevelopedCountry: false,
          landLockedDevelopingCountry: false,
          smallIslandDevelopingState: false
        }
      ];
      expect(RegionCodes.create(testData)).toFailWith(/already exists with M.49 code 003/i);
    });

    test('fails if multiple area/country records have the same alpha-2 code', () => {
      const testData: Csv.Model.M49CsvRow[] = [
        {
          globalCode: '001' as UnM49RegionCode,
          globalName: 'World',
          regionCode: '002' as UnM49RegionCode,
          regionName: 'North',
          m49Code: '003' as UnM49RegionCode,
          countryOrArea: 'Country 1',
          isoAlpha2RegionCode: 'AA' as IsoAlpha2RegionCode,
          leastDevelopedCountry: false,
          landLockedDevelopingCountry: false,
          smallIslandDevelopingState: false
        },
        {
          globalCode: '001' as UnM49RegionCode,
          globalName: 'World',
          regionCode: '002' as UnM49RegionCode,
          regionName: 'North',
          m49Code: '004' as UnM49RegionCode,
          countryOrArea: 'Country 2',
          isoAlpha2RegionCode: 'AA' as IsoAlpha2RegionCode,
          leastDevelopedCountry: false,
          landLockedDevelopingCountry: false,
          smallIslandDevelopingState: false
        }
      ];
      expect(RegionCodes.create(testData)).toFailWith(/already exists with ISO Alpha-2 code AA/i);
    });

    test('fails if multiple area/country records have the same alpha-3 code', () => {
      const testData: Csv.Model.M49CsvRow[] = [
        {
          globalCode: '001' as UnM49RegionCode,
          globalName: 'World',
          regionCode: '002' as UnM49RegionCode,
          regionName: 'North',
          m49Code: '003' as UnM49RegionCode,
          countryOrArea: 'Country 1',
          isoAlpha3RegionCode: 'ABC' as IsoAlpha3RegionCode,
          leastDevelopedCountry: false,
          landLockedDevelopingCountry: false,
          smallIslandDevelopingState: false
        },
        {
          globalCode: '001' as UnM49RegionCode,
          globalName: 'World',
          regionCode: '002' as UnM49RegionCode,
          regionName: 'North',
          m49Code: '004' as UnM49RegionCode,
          countryOrArea: 'Country 2',
          isoAlpha3RegionCode: 'ABC' as IsoAlpha3RegionCode,
          leastDevelopedCountry: false,
          landLockedDevelopingCountry: false,
          smallIslandDevelopingState: false
        }
      ];
      expect(RegionCodes.create(testData)).toFailWith(/already exists with ISO Alpha-3 code ABC/i);
    });
  });
});
