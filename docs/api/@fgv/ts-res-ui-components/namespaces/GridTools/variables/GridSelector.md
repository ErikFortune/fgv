[**@fgv Monorepo API Documentation**](../../../../../README.md)

***

[@fgv Monorepo API Documentation](../../../../../README.md) / [@fgv/ts-res-ui-components](../../../README.md) / [GridTools](../README.md) / GridSelector

# Variable: GridSelector

> `const` **GridSelector**: `React.FC`\<`IGridSelectorProps`\>

GridSelector component for switching between multiple grid configurations.

Provides different presentation modes for selecting which grid to display,
supporting tabs, cards, accordion, and dropdown interfaces. Enables users
to quickly switch between different views of their resource data.

## Example

```tsx
<GridSelector
  gridConfigurations={[
    { id: 'users', title: 'User Data', ... },
    { id: 'products', title: 'Product Catalog', ... }
  ]}
  activeGridId="users"
  presentation="tabs"
  onGridChange={setActiveGridId}
/>
```
