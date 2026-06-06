[Home](../README.md) > QualifierTypes

# Namespace: QualifierTypes

## Namespaces

<table><thead><tr><th>

Name

</th><th>

Description

</th></tr></thead>
<tbody>
<tr><td>

[Config](./Config/README.md)

</td><td>



</td></tr>
<tr><td>

[Convert](./Convert/README.md)

</td><td>



</td></tr>
</tbody></table>

## Classes

<table><thead><tr><th>

Name

</th><th>

Description

</th></tr></thead>
<tbody>
<tr><td>

[LanguageQualifierType](./classes/LanguageQualifierType.md)

</td><td>

QualifierTypes.QualifierType | Qualifier type which matches BCP-47 language tags
applying https://github.com/ErikFortune/fgv/tree/main/libraries/ts-bcp47#tag-matching | similarity matching.

</td></tr>
<tr><td>

[LiteralQualifierType](./classes/LiteralQualifierType.md)

</td><td>

A QualifierTypes.QualifierType | qualifier that matches a literal value,

</td></tr>
<tr><td>

[LiteralValueHierarchy](./classes/LiteralValueHierarchy.md)

</td><td>

A class that implements a hierarchy of literal values.

</td></tr>
<tr><td>

[TerritoryQualifierType](./classes/TerritoryQualifierType.md)

</td><td>

Qualifier type for territory values.

</td></tr>
<tr><td>

[QualifierTypeCollector](./classes/QualifierTypeCollector.md)

</td><td>

Collector for QualifierTypes.QualifierType | QualifierType objects.

</td></tr>
</tbody></table>

## Interfaces

<table><thead><tr><th>

Name

</th><th>

Description

</th></tr></thead>
<tbody>
<tr><td>

[IQualifierType](./interfaces/IQualifierType.md)

</td><td>

Interface for a qualifier type.

</td></tr>
<tr><td>

[IQualifierTypeCreateParams](./interfaces/IQualifierTypeCreateParams.md)

</td><td>

Parameters used to create a base QualifierTypes.QualifierType | qualifier type.

</td></tr>
<tr><td>

[ILanguageQualifierTypeCreateParams](./interfaces/ILanguageQualifierTypeCreateParams.md)

</td><td>

Interface defining the parameters that can be used to create a new

</td></tr>
<tr><td>

[ILiteralQualifierTypeCreateParams](./interfaces/ILiteralQualifierTypeCreateParams.md)

</td><td>

Interface defining the parameters that can be used to create a new

</td></tr>
<tr><td>

[ILiteralValue](./interfaces/ILiteralValue.md)

</td><td>

Describes a single valid literal value including optional parent and child values.

</td></tr>
<tr><td>

[ILiteralValueHierarchyCreateParams](./interfaces/ILiteralValueHierarchyCreateParams.md)

</td><td>

Describes the parameters used to create a new

</td></tr>
<tr><td>

[ITerritoryQualifierTypeCreateParams](./interfaces/ITerritoryQualifierTypeCreateParams.md)

</td><td>

Parameters used to create a new QualifierTypes.TerritoryQualifierType | TerritoryQualifierType instance.

</td></tr>
<tr><td>

[IQualifierTypeCollectorCreateParams](./interfaces/IQualifierTypeCollectorCreateParams.md)

</td><td>

Parameters for creating a new QualifierTypes.QualifierTypeCollector | QualifierTypeCollector.

</td></tr>
</tbody></table>

## Type Aliases

<table><thead><tr><th>

Name

</th><th>

Description

</th></tr></thead>
<tbody>
<tr><td>

[ReadOnlyQualifierTypeCollector](./type-aliases/ReadOnlyQualifierTypeCollector.md)

</td><td>

Interface exposing non-mutating members of a

</td></tr>
<tr><td>

[SystemQualifierType](./type-aliases/SystemQualifierType.md)

</td><td>

A discriminated union of all system qualifier types.

</td></tr>
</tbody></table>

## Functions

<table><thead><tr><th>

Name

</th><th>

Description

</th></tr></thead>
<tbody>
<tr><td>

[createQualifierTypeFromConfig](./functions/createQualifierTypeFromConfig.md)

</td><td>

Creates a QualifierTypes.QualifierType | QualifierType from a configuration object.

</td></tr>
<tr><td>

[createQualifierTypeFromSystemConfig](./functions/createQualifierTypeFromSystemConfig.md)

</td><td>

Creates a QualifierTypes.SystemQualifierType | SystemQualifierType from a system configuration object.

</td></tr>
</tbody></table>
