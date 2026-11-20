[Home](../README.md) > ResourceManagerBuilder

# Class: ResourceManagerBuilder

Builder for a collection of Resources.Resource | resources. Collects
Resources.ResourceCandidate | candidates for each resource into a
Resources.ResourceBuilder | ResourceBuilder per resource, validates them against each other,
and builds a collection of Resources.Resource | resources once all candidates are collected.

**Implements:** [`IResourceManager<Resource>`](../interfaces/IResourceManager.md)

## Properties

<table><thead><tr><th>

Property

</th><th>

Modifiers

</th><th>

Type

</th><th>

Description

</th></tr></thead>
<tbody>
<tr><td>

[qualifiers](./ResourceManagerBuilder.qualifiers.md)

</td><td>

`readonly`

</td><td>

[IReadOnlyQualifierCollector](../interfaces/IReadOnlyQualifierCollector.md)

</td><td>

The Qualifiers.IReadOnlyQualifierCollector | qualifiers used by this resource manager.

</td></tr>
<tr><td>

[resourceTypes](./ResourceManagerBuilder.resourceTypes.md)

</td><td>

`readonly`

</td><td>

[ReadOnlyResourceTypeCollector](../type-aliases/ReadOnlyResourceTypeCollector.md)

</td><td>

The ResourceTypes.ReadOnlyResourceTypeCollector | resource types used by this resource manager.

</td></tr>
<tr><td>

[qualifierTypes](./ResourceManagerBuilder.qualifierTypes.md)

</td><td>

`readonly`

</td><td>

[ReadOnlyQualifierTypeCollector](../type-aliases/ReadOnlyQualifierTypeCollector.md)

</td><td>

The QualifierTypes.ReadOnlyQualifierTypeCollector | qualifier types used by this resource manager.

</td></tr>
<tr><td>

[conditions](./ResourceManagerBuilder.conditions.md)

</td><td>

`readonly`

</td><td>

[ReadOnlyConditionCollector](../type-aliases/ReadOnlyConditionCollector.md)

</td><td>

A Conditions.ConditionCollector | ConditionCollector which

</td></tr>
<tr><td>

[resourceIds](./ResourceManagerBuilder.resourceIds.md)

</td><td>

`readonly`

</td><td>

readonly [ResourceId](../type-aliases/ResourceId.md)[]

</td><td>

The resource IDs that this resource manager can resolve.

</td></tr>
<tr><td>

[conditionSets](./ResourceManagerBuilder.conditionSets.md)

</td><td>

`readonly`

</td><td>

[ReadOnlyConditionSetCollector](../type-aliases/ReadOnlyConditionSetCollector.md)

</td><td>

A Conditions.ConditionSetCollector | ConditionSetCollector which

</td></tr>
<tr><td>

[decisions](./ResourceManagerBuilder.decisions.md)

</td><td>

`readonly`

</td><td>

[ReadOnlyAbstractDecisionCollector](../type-aliases/ReadOnlyAbstractDecisionCollector.md)

</td><td>

A Decisions.AbstractDecisionCollector | AbstractDecisionCollector which

</td></tr>
<tr><td>

[resources](./ResourceManagerBuilder.resources.md)

</td><td>

`readonly`

</td><td>

IReadOnlyValidatingResultMap&lt;[ResourceId](../type-aliases/ResourceId.md), [ResourceBuilder](ResourceBuilder.md)&gt;

</td><td>

A read-only map of Resources.ResourceBuilder | resource builders used by the manager.

</td></tr>
<tr><td>

[size](./ResourceManagerBuilder.size.md)

</td><td>

`readonly`

</td><td>

number

</td><td>

The number of Resources.Resource | resources contained by the manager.

</td></tr>
<tr><td>

[numResources](./ResourceManagerBuilder.numResources.md)

</td><td>

`readonly`

</td><td>

number

</td><td>

The number of resources in this resource manager.

</td></tr>
<tr><td>

[numCandidates](./ResourceManagerBuilder.numCandidates.md)

</td><td>

`readonly`

</td><td>

number

</td><td>

The number of candidates in this resource manager.

</td></tr>
<tr><td>

[builtResources](./ResourceManagerBuilder.builtResources.md)

</td><td>

`readonly`

</td><td>

IReadOnlyValidatingResultMap&lt;[ResourceId](../type-aliases/ResourceId.md), [Resource](Resource.md)&gt;

</td><td>

A read-only result map of all built resources, keyed by resource ID.

</td></tr>
</tbody></table>

## Methods

<table><thead><tr><th>

Method

</th><th>

Modifiers

</th><th>

Description

</th></tr></thead>
<tbody>
<tr><td>

[create(params)](./ResourceManagerBuilder.create.md)

</td><td>

`static`

</td><td>

Creates a new Resources.ResourceManagerBuilder | ResourceManagerBuilder object.

</td></tr>
<tr><td>

[createPredefined(name, qualifierDefaultValues)](./ResourceManagerBuilder.createPredefined.md)

</td><td>

`static`

</td><td>

Creates a new Resources.ResourceManagerBuilder | ResourceManagerBuilder object from a predefined system configuration.

</td></tr>
<tr><td>

[createFromCompiledResourceCollection(compiledCollection, systemConfig)](./ResourceManagerBuilder.createFromCompiledResourceCollection.md)

</td><td>

`static`

</td><td>

Creates a new Resources.ResourceManagerBuilder | ResourceManagerBuilder from a
ResourceJson.Compiled.ICompiledResourceCollection | compiled resource collection.

</td></tr>
<tr><td>

[addLooseCandidate(decl)](./ResourceManagerBuilder.addLooseCandidate.md)

</td><td>



</td><td>

Given a ResourceJson.Json.ILooseResourceCandidateDecl | resource candidate declaration, builds and adds

</td></tr>
<tr><td>

[addResource(decl)](./ResourceManagerBuilder.addResource.md)

</td><td>



</td><td>



</td></tr>
<tr><td>

[addCondition(decl)](./ResourceManagerBuilder.addCondition.md)

</td><td>



</td><td>

Adds a condition to the manager.

</td></tr>
<tr><td>

[addConditionSet(conditions)](./ResourceManagerBuilder.addConditionSet.md)

</td><td>



</td><td>

Adds a condition set to the manager.

</td></tr>
<tr><td>

[getAllResources()](./ResourceManagerBuilder.getAllResources.md)

</td><td>



</td><td>

Gets a read-only array of all Resources.ResourceBuilder | resource builders present in the manager.

</td></tr>
<tr><td>

[getAllCandidates()](./ResourceManagerBuilder.getAllCandidates.md)

</td><td>



</td><td>

Gets a read-only array of all Resources.ResourceCandidate | resource candidates present in the manager.

</td></tr>
<tr><td>

[getBuiltResource(id)](./ResourceManagerBuilder.getBuiltResource.md)

</td><td>



</td><td>

Gets an individual Resources.Resource | built resource from the manager.

</td></tr>
<tr><td>

[validateContext(context)](./ResourceManagerBuilder.validateContext.md)

</td><td>



</td><td>

Validates a context declaration against the qualifiers managed by this resource manager.

</td></tr>
<tr><td>

[getAllBuiltResources()](./ResourceManagerBuilder.getAllBuiltResources.md)

</td><td>



</td><td>

Gets a read-only array of all Resources.Resource | built resources in the manager.

</td></tr>
<tr><td>

[getBuiltResourceTree()](./ResourceManagerBuilder.getBuiltResourceTree.md)

</td><td>



</td><td>

Builds and returns a hierarchical tree representation of all resources managed by this builder.

</td></tr>
<tr><td>

[getAllBuiltCandidates()](./ResourceManagerBuilder.getAllBuiltCandidates.md)

</td><td>



</td><td>

Gets a read-only array of all Resources.Resource | built resources in the manager.

</td></tr>
<tr><td>

[build()](./ResourceManagerBuilder.build.md)

</td><td>



</td><td>

Builds the Resources.Resource | resources from the collected Resources.ResourceCandidate | candidates.

</td></tr>
<tr><td>

[getCandidatesForContext(context, options)](./ResourceManagerBuilder.getCandidatesForContext.md)

</td><td>



</td><td>

Gets a read-only array of all Resources.ResourceCandidate | resource candidates that can match the supplied context.

</td></tr>
<tr><td>

[getResourcesForContext(context, options)](./ResourceManagerBuilder.getResourcesForContext.md)

</td><td>



</td><td>

Gets a read-only array of all Resources.ResourceBuilder | resource builders that have at least one candidate

</td></tr>
<tr><td>

[getBuiltCandidatesForContext(context, options)](./ResourceManagerBuilder.getBuiltCandidatesForContext.md)

</td><td>



</td><td>

Gets a read-only array of all Resources.ResourceCandidate | built resource candidates that can match the supplied context.

</td></tr>
<tr><td>

[getBuiltResourcesForContext(context, options)](./ResourceManagerBuilder.getBuiltResourcesForContext.md)

</td><td>



</td><td>

Gets a read-only array of all Resources.Resource | built resources that have at least one candidate

</td></tr>
<tr><td>

[getCompiledResourceCollection(options)](./ResourceManagerBuilder.getCompiledResourceCollection.md)

</td><td>



</td><td>

Gets a compiled resource collection from the current state of the resource manager builder.

</td></tr>
<tr><td>

[getResourceCollectionDecl(options)](./ResourceManagerBuilder.getResourceCollectionDecl.md)

</td><td>



</td><td>

Gets a resource collection declaration containing all built resources in a flat array structure.

</td></tr>
<tr><td>

[clone(options)](./ResourceManagerBuilder.clone.md)

</td><td>



</td><td>

Creates a clone of this ResourceManagerBuilder with optional configuration overrides.

</td></tr>
</tbody></table>
