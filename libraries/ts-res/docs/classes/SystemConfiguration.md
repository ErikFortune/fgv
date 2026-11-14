[Home](../README.md) > SystemConfiguration

# Class: SystemConfiguration

A system configuration for both runtime or build.

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

[qualifierTypes](./SystemConfiguration.qualifierTypes.md)

</td><td>

`readonly`

</td><td>

[ReadOnlyQualifierTypeCollector](../type-aliases/ReadOnlyQualifierTypeCollector.md)

</td><td>

The QualifierTypes.QualifierTypeCollector | qualifier types that this system configuration uses.

</td></tr>
<tr><td>

[qualifiers](./SystemConfiguration.qualifiers.md)

</td><td>

`readonly`

</td><td>

[IReadOnlyQualifierCollector](../interfaces/IReadOnlyQualifierCollector.md)

</td><td>

The QualifierTypes.QualifierTypeCollector | qualifier types that this system configuration uses.

</td></tr>
<tr><td>

[resourceTypes](./SystemConfiguration.resourceTypes.md)

</td><td>

`readonly`

</td><td>

[ReadOnlyResourceTypeCollector](../type-aliases/ReadOnlyResourceTypeCollector.md)

</td><td>

The ResourceTypes.ResourceTypeCollector | resource types that this system configuration uses.

</td></tr>
<tr><td>

[name](./SystemConfiguration.name.md)

</td><td>

`readonly`

</td><td>

string | undefined

</td><td>

The name of this system configuration.

</td></tr>
<tr><td>

[description](./SystemConfiguration.description.md)

</td><td>

`readonly`

</td><td>

string | undefined

</td><td>

The description of this system configuration.

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

[create(config, initParams)](./SystemConfiguration.create.md)

</td><td>

`static`

</td><td>

Creates a new Config.SystemConfiguration | SystemConfiguration from the supplied

</td></tr>
<tr><td>

[loadFromFile(path, initParams)](./SystemConfiguration.loadFromFile.md)

</td><td>

`static`

</td><td>

Loads a Config.SystemConfiguration | SystemConfiguration from a file.

</td></tr>
<tr><td>

[getConfig()](./SystemConfiguration.getConfig.md)

</td><td>



</td><td>

Returns the Config.Model.ISystemConfiguration | system configuration that this

</td></tr>
</tbody></table>
