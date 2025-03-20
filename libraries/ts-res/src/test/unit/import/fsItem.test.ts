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

import '@fgv/ts-utils-jest';
import { FileTree } from '@fgv/ts-utils';
import * as TsRes from '../../../index';

const resourceFiles: FileTree.IInMemoryFile[] = [
  {
    path: 'resources.json',
    contents: { helloMyNameIs: 'default resources' }
  },
  {
    path: '/US/resources.json',
    contents: { helloMyNameIs: 'resources for US' }
  },
  {
    path: '/home=CA/resources.json',
    contents: { helloMyNameIs: 'resources for CA' }
  },
  {
    path: '/resources.home=PR/language=es-419.json',
    contents: { helloMyNameIs: 'resources for PR in es-419' }
  },
  {
    path: '/resources.home=PR/language=en.json',
    contents: { helloMyNameIs: 'resources for PR in English' }
  },
  {
    path: '/resources.home=MX.json',
    contents: { helloMyNameIs: 'resources for MX' }
  },
  {
    path: '/US/resources.language=en-US.json',
    contents: { helloMyNameIs: 'resources for en-US in US' }
  },
  {
    path: '/resources/AQ.json',
    contents: { helloMyNameIs: 'resources for AQ' }
  },
  {
    path: '/resources/language=fr.json',
    contents: { helloMyNameIs: 'resources for fr' }
  },
  {
    path: '/resources/home=CA,language=fr.json',
    contents: { helloMyNameIs: 'resources for CA in fr' }
  },
  {
    path: '/broken/resources.home=Antarctica/language=en-US.json',
    contents: { helloMyNameIs: 'resources for Antarctica' }
  },
  {
    path: '/broken/resources/home=Mars.json',
    contents: { helloMyNameIs: 'resources for Mars' }
  },
  {
    path: '/resources.home=PR/readme.txt',
    contents: 'This is a readme file'
  }
];

describe('FsItem', () => {
  let qualifierTypes: TsRes.QualifierTypes.QualifierTypeCollector;
  let qualifiers: TsRes.Qualifiers.QualifierCollector;
  let files: FileTree.IInMemoryFile[];
  let tree: FileTree.FileTree;

  beforeEach(() => {
    qualifierTypes = TsRes.QualifierTypes.QualifierTypeCollector.create({
      qualifierTypes: [
        TsRes.QualifierTypes.LanguageQualifierType.create().orThrow(),
        TsRes.QualifierTypes.TerritoryQualifierType.create().orThrow(),
        TsRes.QualifierTypes.LiteralQualifierType.create().orThrow()
      ]
    }).orThrow();

    const qualifierDecls: TsRes.Qualifiers.IQualifierDecl[] = [
      {
        name: 'homeTerritory',
        typeName: 'territory',
        defaultPriority: 800,
        token: 'home',
        tokenIsOptional: true
      },
      { name: 'currentTerritory', typeName: 'territory', defaultPriority: 700 },
      { name: 'language', typeName: 'language', defaultPriority: 600 },
      { name: 'some_thing', typeName: 'literal', defaultPriority: 500 }
    ];
    qualifiers = TsRes.Qualifiers.QualifierCollector.create({
      qualifierTypes,
      qualifiers: qualifierDecls
    }).orThrow();

    files = JSON.parse(JSON.stringify(resourceFiles));
    tree = FileTree.inMemory(files).orThrow();
  });

  describe('create static method', () => {
    test('creates a new FsItem from a valid unconditional file path', () => {
      expect(TsRes.Import.FsItem.createForPath('/US/resources.json', qualifiers, tree)).toSucceedAndSatisfy(
        (item) => {
          expect(item.item.absolutePath).toEqual('/US/resources.json');
          expect(item.baseName).toEqual('resources');
          expect(item.conditions.length).toEqual(0);
          expect(item.item.type).toEqual('file');
        }
      );
    });

    test('creates a new FsItem from a valid conditional file path', () => {
      expect(
        TsRes.Import.FsItem.createForPath('/resources.home=MX.json', qualifiers, tree)
      ).toSucceedAndSatisfy((item) => {
        expect(item.item.absolutePath).toEqual('/resources.home=MX.json');
        expect(item.baseName).toEqual('resources');
        expect(item.conditions.length).toEqual(1);
        expect(item.conditions[0].qualifier.name).toEqual('homeTerritory');
        expect(item.conditions[0].value).toEqual('MX');
        expect(item.item.type).toEqual('file');
      });
    });

    test('creates a new FsItem from a valid conditional file path with multiple conditions', () => {
      expect(
        TsRes.Import.FsItem.createForPath('/resources/home=CA,language=fr.json', qualifiers, tree)
      ).toSucceedAndSatisfy((item) => {
        expect(item.item.absolutePath).toEqual('/resources/home=CA,language=fr.json');
        expect(item.baseName).toEqual('');
        expect(item.conditions.length).toEqual(2);
        expect(item.conditions[0].qualifier.name).toEqual('homeTerritory');
        expect(item.conditions[0].value).toEqual('CA');
        expect(item.conditions[1].qualifier.name).toEqual('language');
        expect(item.conditions[1].value).toEqual('fr');
        expect(item.item.type).toEqual('file');
      });
    });

    test('creates a new FsItem from a file with an entirely conditional name', () => {
      expect(
        TsRes.Import.FsItem.createForPath('/resources.home=PR/language=es-419.json', qualifiers, tree)
      ).toSucceedAndSatisfy((item) => {
        expect(item.item.absolutePath).toEqual('/resources.home=PR/language=es-419.json');
        expect(item.baseName).toEqual('');
        expect(item.conditions.length).toEqual(1);
        expect(item.conditions[0].qualifier.name).toEqual('language');
        expect(item.conditions[0].value).toEqual('es-419');
        expect(item.item.type).toEqual('file');
      });
    });

    test('creates a new FsItem from a valid unconditional directory path', () => {
      expect(TsRes.Import.FsItem.createForPath('/home=CA', qualifiers, tree)).toSucceedAndSatisfy((item) => {
        expect(item.item.absolutePath).toEqual('/home=CA');
        expect(item.baseName).toEqual('');
        expect(item.conditions.length).toEqual(1);
        expect(item.conditions[0].qualifier.name).toEqual('homeTerritory');
        expect(item.conditions[0].value).toEqual('CA');
        expect(item.item.type).toEqual('directory');
      });
    });

    test('creates a new FsItem from a valid conditional directory path', () => {
      expect(TsRes.Import.FsItem.createForPath('/home=CA', qualifiers, tree)).toSucceedAndSatisfy((item) => {
        expect(item.item.absolutePath).toEqual('/home=CA');
        expect(item.baseName).toEqual('');
        expect(item.conditions.length).toEqual(1);
        expect(item.conditions[0].qualifier.name).toEqual('homeTerritory');
        expect(item.conditions[0].value).toEqual('CA');
        expect(item.item.type).toEqual('directory');
      });
    });

    test('fails for a non-existent file', () => {
      expect(TsRes.Import.FsItem.createForPath('/US/nonexistent.json', qualifiers, tree)).toFailWith(
        /not found/i
      );
    });

    test('fails for a file with an invalid condition value', () => {
      expect(
        TsRes.Import.FsItem.createForPath('/broken/resources/home=Mars.json', qualifiers, tree)
      ).toFailWith(/invalid condition value/i);
    });

    test('fails for a directory with an invalid condition value', () => {
      expect(
        TsRes.Import.FsItem.createForPath('/broken/resources.home=Antarctica', qualifiers, tree)
      ).toFailWith(/invalid condition value/i);
    });

    test('fails with detail "skipped" for a non-json file', () => {
      expect(
        TsRes.Import.FsItem.createForPath('/resources.home=PR/readme.txt', qualifiers, tree)
      ).toFailWithDetail(/not a JSON file/i, 'skipped');
    });
  });

  describe('getContext', () => {
    test('returns an empty context for an unconditional file', () => {
      expect(TsRes.Import.FsItem.createForPath('/US/resources.json', qualifiers, tree)).toSucceedAndSatisfy(
        (item) => {
          expect(item.getContext()).toSucceedAndSatisfy((context) => {
            expect(context.baseId).toBe('resources');
            expect(context.conditions).toEqual([]);
          });
        }
      );
    });

    test('returns a context for a conditional file', () => {
      expect(
        TsRes.Import.FsItem.createForPath('/resources.home=MX.json', qualifiers, tree)
      ).toSucceedAndSatisfy((item) => {
        expect(item.getContext()).toSucceedAndSatisfy((context) => {
          expect(context.baseId).toBe('resources');
          expect(context.conditions.length).toEqual(1);
          expect(context.conditions[0].qualifierName).toEqual('homeTerritory');
          expect(context.conditions[0].value).toEqual('MX');
        });
      });
    });
  });
});
