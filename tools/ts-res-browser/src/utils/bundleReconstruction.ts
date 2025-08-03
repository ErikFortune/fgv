import { Result, succeed, fail } from '@fgv/ts-utils';
import { Resources, Config, ResourceJson, Bundle, Import, Runtime } from '@fgv/ts-res';
import { TsResSystem } from './tsResIntegration';

/**
 * Reconstructs a complete TsResSystem from bundle data by properly building
 * a ResourceManagerBuilder with all the resources from the bundle.
 */
export function reconstructSystemFromBundle(bundleComponents: Bundle.IBundleComponents): Result<TsResSystem> {
  console.log('=== RECONSTRUCTING SYSTEM FROM BUNDLE ===');

  return Config.SystemConfiguration.create(
    bundleComponents.systemConfiguration.getConfig().orThrow()
  ).onSuccess((systemConfiguration) => {
    try {
      // Create the ResourceManagerBuilder with proper configuration
      const resourceManagerBuilder = Resources.ResourceManagerBuilder.create({
        qualifiers: systemConfiguration.qualifiers,
        resourceTypes: systemConfiguration.resourceTypes
      }).orThrow();

      // Reconstruct resources from the compiled collection
      const compiledCollection = bundleComponents.compiledCollection;
      console.log('Compiled collection resource types:', compiledCollection.resourceTypes);
      console.log('System configuration resource types size:', systemConfiguration.resourceTypes.size);

      if (compiledCollection.resources) {
        for (const compiledResource of compiledCollection.resources) {
          const candidatesResult = reconstructCandidatesFromCompiled(
            compiledResource,
            compiledCollection,
            systemConfiguration
          );

          if (candidatesResult.isSuccess()) {
            const candidates = candidatesResult.value;
            // Add each candidate individually to maintain proper order
            for (const candidateDecl of candidates) {
              const addResult = resourceManagerBuilder.addLooseCandidate(candidateDecl);
              if (addResult.isFailure()) {
                console.warn(
                  `Failed to add candidate for resource ${compiledResource.id}:`,
                  addResult.message
                );
              }
            }
          } else {
            console.warn(
              `Failed to reconstruct candidates for resource ${compiledResource.id}:`,
              candidatesResult.message
            );
          }
        }
      }

      // Create import manager
      const importManager = Import.ImportManager.create({
        resources: resourceManagerBuilder
      }).orThrow();

      // Create context qualifier provider
      const contextQualifierProvider = Runtime.ValidatingSimpleContextQualifierProvider.create({
        qualifiers: systemConfiguration.qualifiers
      }).orThrow();

      const system: TsResSystem = {
        qualifierTypes: systemConfiguration.qualifierTypes,
        qualifiers: systemConfiguration.qualifiers,
        resourceTypes: systemConfiguration.resourceTypes,
        resourceManager: resourceManagerBuilder,
        importManager,
        contextQualifierProvider
      };

      console.log('=== BUNDLE RECONSTRUCTION COMPLETE ===');
      console.log('Reconstructed resources:', compiledCollection.resources?.length || 0);

      return succeed(system);
    } catch (error) {
      return fail(
        `Failed to reconstruct system from bundle: ${error instanceof Error ? error.message : String(error)}`
      );
    }
  });
}

/**
 * Reconstructs candidate declarations from compiled resource data.
 */
function reconstructCandidatesFromCompiled(
  compiledResource: ResourceJson.Compiled.ICompiledResource,
  compiledCollection: ResourceJson.Compiled.ICompiledResourceCollection,
  systemConfiguration: Config.SystemConfiguration
): Result<ResourceJson.Json.ILooseResourceCandidateDecl[]> {
  try {
    // Get the resource type from the compiled collection
    const resourceTypeData = compiledCollection.resourceTypes?.[compiledResource.type];
    if (!resourceTypeData) {
      return fail(`Resource type not found for index ${compiledResource.type} in compiled collection`);
    }

    // Get the decision to understand the candidate structure
    const decision = compiledCollection.decisions?.[compiledResource.decision];
    if (!decision) {
      return fail(`Decision not found for index ${compiledResource.decision}`);
    }

    // Reconstruct candidates
    const candidates: ResourceJson.Json.ILooseResourceCandidateDecl[] = [];
    if (compiledResource.candidates) {
      for (let candidateIndex = 0; candidateIndex < compiledResource.candidates.length; candidateIndex++) {
        const compiledCandidate = compiledResource.candidates[candidateIndex];

        // Get the condition set for this candidate
        let conditionSetIndex = 0; // Default to unconditional
        if (decision.conditionSets && candidateIndex < decision.conditionSets.length) {
          conditionSetIndex = decision.conditionSets[candidateIndex];
        }

        const conditionSet = compiledCollection.conditionSets?.[conditionSetIndex];

        // Reconstruct conditions for this candidate
        const conditions: Array<{
          qualifierName: string;
          operator?: string;
          value: string;
        }> = [];

        if (conditionSet && conditionSet.conditions) {
          for (const conditionIndex of conditionSet.conditions) {
            const condition = compiledCollection.conditions?.[conditionIndex];
            if (condition) {
              const qualifier = compiledCollection.qualifiers?.[condition.qualifierIndex];
              if (qualifier) {
                conditions.push({
                  qualifierName: qualifier.name,
                  operator: condition.op,
                  value: condition.value
                });
              }
            }
          }
        }

        // Create candidate declaration
        const candidateDecl: ResourceJson.Json.ILooseResourceCandidateDecl = {
          id: compiledResource.id,
          resourceTypeName: resourceTypeData.name,
          json: compiledCandidate.json,
          ...(conditions.length > 0 && { conditions }),
          ...(compiledCandidate.isPartial && { isPartial: true }),
          ...(compiledCandidate.mergeMethod !== 'replace' && { mergeMethod: compiledCandidate.mergeMethod })
        };

        candidates.push(candidateDecl);
      }
    }

    return succeed(candidates);
  } catch (error) {
    return fail(
      `Failed to reconstruct resource ${compiledResource.id}: ${
        error instanceof Error ? error.message : String(error)
      }`
    );
  }
}
