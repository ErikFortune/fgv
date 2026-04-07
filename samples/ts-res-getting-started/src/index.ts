import * as TsRes from '@fgv/ts-res';
import { Converters as JsonConverters, FileTree } from '@fgv/ts-json-base';
import { Yaml } from '@fgv/ts-extras';

type ProductCard = {
  readonly id: string;
  readonly title: string;
  readonly description: string;
  readonly subtitle?: string;
  readonly badge?: string;
};

type PageHeader = {
  readonly title: string;
  readonly subtitle: string;
};

const qualifierTypes = TsRes.QualifierTypes.QualifierTypeCollector.create({
  qualifierTypes: [
    TsRes.QualifierTypes.LanguageQualifierType.create().orThrow(),
    TsRes.QualifierTypes.TerritoryQualifierType.create().orThrow(),
    TsRes.QualifierTypes.LiteralQualifierType.create({
      name: 'audience',
      enumeratedValues: ['public', 'internal']
    }).orThrow()
  ]
}).orThrow();

const qualifiers = TsRes.Qualifiers.QualifierCollector.create({
  qualifierTypes,
  qualifiers: [
    { name: 'language', typeName: 'language', defaultPriority: 900 },
    { name: 'currentTerritory', typeName: 'territory', defaultPriority: 800 },
    { name: 'audience', typeName: 'audience', defaultPriority: 700 }
  ]
}).orThrow();

const resourceTypes = TsRes.ResourceTypes.ResourceTypeCollector.create({
  resourceTypes: [TsRes.ResourceTypes.JsonResourceType.create().orThrow()]
}).orThrow();

const resourceManager = TsRes.Resources.ResourceManagerBuilder.create({
  qualifiers,
  resourceTypes
}).orThrow();

const fileTree = FileTree.forFilesystem({ prefix: __dirname }).orThrow();

const importManager = TsRes.Import.ImportManager.create({
  resources: resourceManager,
  fileTree,
  fileContentConverter: Yaml.yamlConverter(JsonConverters.jsonObject),
  fileContentExtensions: ['.yaml', '.yml']
}).orThrow();

importManager.importFromFileSystem('resources/catalog').orThrow();
resourceManager.build().orThrow();

const resolver = TsRes.Runtime.ResourceResolver.create({
  resourceManager,
  qualifierTypes: resourceManager.qualifiers.qualifierTypes,
  contextQualifierProvider: TsRes.Runtime.ValidatingSimpleContextQualifierProvider.create({
    qualifiers: resourceManager.qualifiers,
    qualifierValues: {
      language: 'en',
      currentTerritory: 'CA',
      audience: 'internal'
    }
  }).orThrow()
}).orThrow();

const heroResource = resourceManager.getBuiltResource('catalog.cards.hero').orThrow();
const detailResource = resourceManager.getBuiltResource('catalog.cards.detail').orThrow();
const headerResource = resourceManager.getBuiltResource('catalog.page.header').orThrow();

const singleItemResolution = resolver.resolveResource(headerResource).orThrow().json;
const composedResolution = resolver.resolveComposedResourceValue(detailResource).orThrow();
const manualComposition = resolver.resolveAllResourceCandidates(detailResource).orThrow();

const flattenedManualComposition: Record<string, unknown> = {};
for (const candidate of [...manualComposition].reverse()) {
  Object.assign(flattenedManualComposition, candidate.json);
}

console.log({
  heroResource: heroResource.id,
  singleItemResolution,
  composedResolution,
  flattenedManualComposition
});
