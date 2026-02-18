[Home](../README.md) > Internal

# Namespace: Internal

Internal calculation utilities for library-runtime

## Classes

<table><thead><tr><th>

Name

</th><th>

Description

</th></tr></thead>
<tbody>
<tr><td>

[LinearScaler](./classes/LinearScaler.md)

</td><td>

Generic linear scaler for units like grams and milliliters.

</td></tr>
<tr><td>

[GramScaler](./classes/GramScaler.md)

</td><td>

Contextual scaler for gram measurements.

</td></tr>
<tr><td>

[PinchScaler](./classes/PinchScaler.md)

</td><td>

Scaler for pinch measurements - always returns the original amount.

</td></tr>
<tr><td>

[SpoonScaler](./classes/SpoonScaler.md)

</td><td>

Scaler for spoon measurements (tsp/Tbsp) with fractional support.

</td></tr>
<tr><td>

[UnitScalerRegistry](./classes/UnitScalerRegistry.md)

</td><td>

Registry of unit scalers.

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

[IWeightCalculationContext](./interfaces/IWeightCalculationContext.md)

</td><td>

Context for weight calculations that provides ingredient density lookup.

</td></tr>
<tr><td>

[IWeightContribution](./interfaces/IWeightContribution.md)

</td><td>

Result of calculating weight contribution for a single ingredient.

</td></tr>
<tr><td>

[IVariationScaleOptions](./interfaces/IVariationScaleOptions.md)

</td><td>

Options for variation scaling (precision and minimum amount only)

</td></tr>
<tr><td>

[IFillingRecipeScaleOptions](./interfaces/IFillingRecipeScaleOptions.md)

</td><td>

Options for filling recipe scaling (extends variation options with variation selection)

</td></tr>
<tr><td>

[IFraction](./interfaces/IFraction.md)

</td><td>

Represents a fraction for display purposes

</td></tr>
<tr><td>

[IScaledAmount](./interfaces/IScaledAmount.md)

</td><td>

Result of scaling an amount in a specific unit.

</td></tr>
<tr><td>

[IUnitScaler](./interfaces/IUnitScaler.md)

</td><td>

Interface for unit-specific scalers

</td></tr>
<tr><td>

[ILinearScalerOptions](./interfaces/ILinearScalerOptions.md)

</td><td>

Options for linear scaling

</td></tr>
<tr><td>

[ISpoonScalerOptions](./interfaces/ISpoonScalerOptions.md)

</td><td>

Options for spoon scaling

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

[contributesToWeight](./functions/contributesToWeight.md)

</td><td>

Check if a unit contributes to weight calculations.

</td></tr>
<tr><td>

[isWeightExcluded](./functions/isWeightExcluded.md)

</td><td>

Check if a unit is excluded from weight calculations.

</td></tr>
<tr><td>

[calculateIngredientWeight](./functions/calculateIngredientWeight.md)

</td><td>

Calculate the weight contribution for a single ingredient.

</td></tr>
<tr><td>

[calculateTotalWeight](./functions/calculateTotalWeight.md)

</td><td>

Calculate the total weight from all ingredients with unit conversion.

</td></tr>
<tr><td>

[calculateWeightContributions](./functions/calculateWeightContributions.md)

</td><td>

Calculate weight contributions for all ingredients.

</td></tr>
<tr><td>

[calculateBaseWeight](./functions/calculateBaseWeight.md)

</td><td>

Calculates the base weight from filling recipe variation (sum of ingredient amounts)

</td></tr>
<tr><td>

[recalculateFillingRecipeVariation](./functions/recalculateFillingRecipeVariation.md)

</td><td>

Recalculates base weight for filling recipe variation and returns updated variation

</td></tr>
<tr><td>

[supportsScaling](./functions/supportsScaling.md)

</td><td>

Check if a unit supports scaling

</td></tr>
<tr><td>

[scaleAmount](./functions/scaleAmount.md)

</td><td>

Scale an ingredient amount using the appropriate scaler for the unit

</td></tr>
<tr><td>

[calculateFromIngredients](./functions/calculateFromIngredients.md)

</td><td>

Calculates blended characteristics from resolved ingredients

</td></tr>
<tr><td>

[calculateFromFillingRecipeIngredients](./functions/calculateFromFillingRecipeIngredients.md)

</td><td>

Resolves recipe ingredients and calculates blended characteristics

</td></tr>
<tr><td>

[calculateForFillingRecipe](./functions/calculateForFillingRecipe.md)

</td><td>

Resolves and calculates characteristics for a complete recipe

</td></tr>
<tr><td>

[validateGanache](./functions/validateGanache.md)

</td><td>

Validates ganache analysis against standard guidelines

</td></tr>
<tr><td>

[calculateGanache](./functions/calculateGanache.md)

</td><td>

Performs complete ganache calculation with validation

</td></tr>
</tbody></table>

## Variables

<table><thead><tr><th>

Name

</th><th>

Description

</th></tr></thead>
<tbody>
<tr><td>

[defaultWeightContext](./variables/defaultWeightContext.md)

</td><td>

Default weight calculation context that returns 1.0 density for all ingredients.

</td></tr>
<tr><td>

[STANDARD_FRACTIONS](./variables/STANDARD_FRACTIONS.md)

</td><td>

Standard fractions supported for tsp/Tbsp display.

</td></tr>
<tr><td>

[defaultScalerRegistry](./variables/defaultScalerRegistry.md)

</td><td>

Default scaler registry instance

</td></tr>
</tbody></table>
