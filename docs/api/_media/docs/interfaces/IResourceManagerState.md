[Home](../README.md) > IResourceManagerState

# Interface: IResourceManagerState

Represents the current state of the resource manager.
Tracks processing status, data, and any errors.

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

[isProcessing](./IResourceManagerState.isProcessing.md)

</td><td>



</td><td>

boolean

</td><td>

Whether the system is currently processing resources

</td></tr>
<tr><td>

[processedResources](./IResourceManagerState.processedResources.md)

</td><td>



</td><td>

[IExtendedProcessedResources](IExtendedProcessedResources.md) | null

</td><td>

The processed resource system, or null if not yet processed

</td></tr>
<tr><td>

[error](./IResourceManagerState.error.md)

</td><td>



</td><td>

string | null

</td><td>

Current error message, or null if no error

</td></tr>
<tr><td>

[hasProcessedData](./IResourceManagerState.hasProcessedData.md)

</td><td>



</td><td>

boolean

</td><td>

Whether any resource data has been successfully processed

</td></tr>
<tr><td>

[activeConfiguration](./IResourceManagerState.activeConfiguration.md)

</td><td>



</td><td>

ISystemConfiguration | null

</td><td>

The active system configuration

</td></tr>
<tr><td>

[isLoadedFromBundle](./IResourceManagerState.isLoadedFromBundle.md)

</td><td>



</td><td>

boolean

</td><td>

Whether the current data was loaded from a bundle

</td></tr>
<tr><td>

[bundleMetadata](./IResourceManagerState.bundleMetadata.md)

</td><td>



</td><td>

IBundleMetadata | null

</td><td>

Bundle metadata if loaded from bundle

</td></tr>
</tbody></table>
