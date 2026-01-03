// AUTO-GENERATED FILE - DO NOT EDIT DIRECTLY
// Run 'rushx build:data' to regenerate from source YAML files in data/ingredients/
//
// Source files:
//   - data/ingredients/cacao-barry.yaml
//   - data/ingredients/common.yaml
//   - data/ingredients/felchlin.yaml
//   - data/ingredients/guittard.yaml

import { JsonObject } from '@fgv/ts-json-base';

/* eslint-disable @typescript-eslint/naming-convention */
/**
 * Generated ingredient collections from source YAML files.
 * @public
 */
export const ingredientCollections: Record<string, JsonObject> = {
  'cacao-barry': {
    'zephyr-caramel-35': {
      baseId: 'zephyr-caramel-35',
      name: 'Cacao Barry Zéphyr™ Caramel 35%',
      category: 'chocolate',
      chocolateType: 'caramelized',
      cacaoPercentage: 35,
      ganacheCharacteristics: {
        cacaoFat: 35,
        sugar: 24,
        milkFat: 6,
        water: 1,
        solids: 34,
        otherFats: 0
      },
      fluidityStars: 5,
      description:
        "Delightful caramelized white chocolate with silky texture and strong caramel milk taste, reminiscent of Brittany's 'caramel au beurre salé'",
      tags: ['caramelized', 'white', 'salted-caramel', 'silky'],
      allergens: ['milk'],
      certifications: ['halal', 'vegetarian', 'kosher-dairy']
    },
    'madirofolo-65': {
      baseId: 'madirofolo-65',
      name: 'Cacao Barry Madirofolo 65%',
      category: 'chocolate',
      chocolateType: 'dark',
      cacaoPercentage: 65,
      ganacheCharacteristics: {
        cacaoFat: 38,
        sugar: 33,
        milkFat: 0,
        water: 1,
        solids: 28,
        otherFats: 0
      },
      fluidityStars: 4,
      description:
        'Madagascar single-origin dark chocolate with citrus bitterness, sour wood notes, and hint of liquorice',
      tags: ['dark', 'single-origin', 'madagascar', 'organic', 'citrus'],
      origins: ['Madagascar'],
      beanVarieties: 'Trinitario',
      certifications: ['organic', 'halal', 'vegetarian', 'kosher-dairy', 'traceable-beans']
    },
    'guayaquil-64': {
      baseId: 'guayaquil-64',
      name: 'Cacao Barry Extra-Bitter Guayaquil 64%',
      category: 'chocolate',
      chocolateType: 'dark',
      cacaoPercentage: 64,
      ganacheCharacteristics: {
        cacaoFat: 41,
        sugar: 34,
        milkFat: 0,
        water: 1,
        solids: 24,
        otherFats: 0
      },
      fluidityStars: 4,
      description:
        'Most versatile dark couverture with powerful cocoa flavor, hints of coffee and chestnut, exceptional fluidity',
      tags: ['dark', 'versatile', 'coffee-notes', 'chestnut', 'multi-origin'],
      origins: ['Ecuador', 'Ghana', "Côte d'Ivoire"],
      beanVarieties: ['Forastero'],
      certifications: ['halal', 'vegetarian', 'kosher-dairy', 'vegan', 'traceable-beans']
    },
    'zephyr-white-34': {
      baseId: 'zephyr-white-34',
      name: 'Cacao Barry Zéphyr™ White 34%',
      category: 'chocolate',
      chocolateType: 'white',
      cacaoPercentage: 34,
      ganacheCharacteristics: {
        cacaoFat: 34,
        sugar: 39,
        milkFat: 6,
        water: 1,
        solids: 20,
        otherFats: 0
      },
      fluidityStars: 5,
      description:
        'Extremely soft and subtly sweet white chocolate with smooth texture and strong flavor of whole milk',
      tags: ['white', 'soft', 'milk-flavor', 'smooth', 'heritage'],
      origins: ['West Africa'],
      beanVarieties: ['Forastero'],
      allergens: ['milk'],
      certifications: ['halal', 'vegetarian', 'kosher-dairy']
    },
    'tanzanie-75': {
      baseId: 'tanzanie-75',
      name: 'Cacao Barry Tanzanie 75%',
      category: 'chocolate',
      chocolateType: 'dark',
      cacaoPercentage: 75,
      ganacheCharacteristics: {
        cacaoFat: 45,
        sugar: 22,
        milkFat: 0,
        water: 1,
        solids: 32,
        otherFats: 0
      },
      fluidityStars: 5,
      description:
        'Single-origin Tanzanian dark chocolate with harmonious blend of acidity and intense cocoa bitterness, vegetal and woody notes with citrus hints',
      tags: ['dark', 'single-origin', 'tanzania', 'fruity', 'woody', 'citrus'],
      origins: ['Tanzania', 'Lake Malawi regions'],
      beanVarieties: ['Criollo', 'Trinitario'],
      certifications: ['halal', 'vegetarian', 'kosher-dairy', 'without-lecithin']
    }
  },
  common: {
    'heavy-cream-35': {
      baseId: 'heavy-cream-35',
      name: 'Heavy Cream (35% fat)',
      category: 'dairy',
      ganacheCharacteristics: {
        cacaoFat: 0,
        sugar: 0,
        milkFat: 35,
        water: 60,
        solids: 5,
        otherFats: 0
      },
      fatContent: 35,
      waterContent: 60,
      allergens: ['milk'],
      vegan: false
    },
    'heavy-cream-38': {
      baseId: 'heavy-cream-38',
      name: 'Heavy Cream (38% fat)',
      category: 'dairy',
      ganacheCharacteristics: {
        cacaoFat: 0,
        sugar: 0,
        milkFat: 38,
        water: 57,
        solids: 5,
        otherFats: 0
      },
      fatContent: 38,
      waterContent: 57,
      allergens: ['milk'],
      vegan: false
    },
    'butter-82': {
      baseId: 'butter-82',
      name: 'Unsalted Butter (82% fat)',
      category: 'fat',
      ganacheCharacteristics: {
        cacaoFat: 0,
        sugar: 0,
        milkFat: 0,
        water: 16,
        solids: 2,
        otherFats: 82
      },
      meltingPoint: 32,
      allergens: ['milk'],
      vegan: false
    },
    'clarified-butter': {
      baseId: 'clarified-butter',
      name: 'Clarified Butter (Ghee)',
      category: 'fat',
      ganacheCharacteristics: {
        cacaoFat: 0,
        sugar: 0,
        milkFat: 0,
        water: 0,
        solids: 0,
        otherFats: 100
      },
      meltingPoint: 35,
      allergens: ['milk']
    },
    'coconut-oil': {
      baseId: 'coconut-oil',
      name: 'Coconut Oil',
      category: 'fat',
      ganacheCharacteristics: {
        cacaoFat: 0,
        sugar: 0,
        milkFat: 0,
        water: 0,
        solids: 0,
        otherFats: 100
      },
      meltingPoint: 24,
      vegan: true
    },
    'glucose-de43': {
      baseId: 'glucose-de43',
      name: 'Glucose Syrup (DE 43)',
      category: 'sugar',
      ganacheCharacteristics: {
        cacaoFat: 0,
        sugar: 80,
        milkFat: 0,
        water: 20,
        solids: 0,
        otherFats: 0
      },
      sweetnessPotency: 0.4,
      vegan: true
    },
    'invert-sugar': {
      baseId: 'invert-sugar',
      name: 'Invert Sugar (Trimoline)',
      category: 'sugar',
      ganacheCharacteristics: {
        cacaoFat: 0,
        sugar: 77,
        milkFat: 0,
        water: 23,
        solids: 0,
        otherFats: 0
      },
      sweetnessPotency: 1.2,
      vegan: true
    },
    sorbitol: {
      baseId: 'sorbitol',
      name: 'Sorbitol (70% solution)',
      category: 'sugar',
      ganacheCharacteristics: {
        cacaoFat: 0,
        sugar: 70,
        milkFat: 0,
        water: 30,
        solids: 0,
        otherFats: 0
      },
      sweetnessPotency: 0.6,
      vegan: true
    },
    'granulated-sugar': {
      baseId: 'granulated-sugar',
      name: 'Granulated Sugar',
      category: 'sugar',
      ganacheCharacteristics: {
        cacaoFat: 0,
        sugar: 100,
        milkFat: 0,
        water: 0,
        solids: 0,
        otherFats: 0
      },
      sweetnessPotency: 1,
      vegan: true
    },
    'muscovado-sugar': {
      baseId: 'muscovado-sugar',
      name: 'Muscovado Sugar',
      category: 'sugar',
      ganacheCharacteristics: {
        cacaoFat: 0,
        sugar: 95,
        milkFat: 0,
        water: 3,
        solids: 2,
        otherFats: 0
      },
      sweetnessPotency: 1,
      vegan: true
    }
  },
  felchlin: {
    'maracaibo-65': {
      baseId: 'maracaibo-65',
      name: 'Felchlin Maracaibo Clasificado 65%',
      category: 'chocolate',
      chocolateType: 'dark',
      cacaoPercentage: 65,
      ganacheCharacteristics: {
        cacaoFat: 36,
        sugar: 34,
        milkFat: 0,
        water: 1,
        solids: 29,
        otherFats: 0
      },
      fluidityStars: 3,
      description: 'Venezuelan single-origin dark chocolate with complex flavor profile',
      tags: ['single-origin'],
      origins: ['Venezuela'],
      vegan: true
    },
    'arriba-72': {
      baseId: 'arriba-72',
      name: 'Felchlin Arriba Nacional 72%',
      category: 'chocolate',
      chocolateType: 'dark',
      cacaoPercentage: 72,
      ganacheCharacteristics: {
        cacaoFat: 40,
        sugar: 26,
        milkFat: 0,
        water: 1,
        solids: 33,
        otherFats: 0
      },
      fluidityStars: 3,
      description: 'Ecuadorian Arriba Nacional cocoa, floral and fruity notes',
      tags: ['ecuadorian', 'single-origin', 'dark', 'arriba'],
      origins: ['Ecuador'],
      beanVarieties: ['Nacional'],
      vegan: true
    },
    'sao-palme-75': {
      baseId: 'sao-palme-75',
      name: 'Felchlin Sao Palme 75%',
      category: 'chocolate',
      chocolateType: 'dark',
      cacaoPercentage: 75,
      ganacheCharacteristics: {
        cacaoFat: 42,
        sugar: 24,
        milkFat: 0,
        water: 1,
        solids: 33,
        otherFats: 0
      },
      fluidityStars: 3,
      description: 'Intense dark chocolate with pronounced cacao flavor',
      tags: ['dark', 'intense'],
      vegan: true
    },
    'sao-palme-60': {
      baseId: 'sao-palme-60',
      name: 'Felchlin Sao Palme 60%',
      category: 'chocolate',
      chocolateType: 'dark',
      cacaoPercentage: 60,
      ganacheCharacteristics: {
        cacaoFat: 34,
        sugar: 38,
        milkFat: 0,
        water: 1,
        solids: 27,
        otherFats: 0
      },
      fluidityStars: 3,
      description: 'Balanced dark chocolate, good for ganaches and enrobing',
      tags: ['dark', 'balanced'],
      vegan: true
    },
    'sao-palme-43': {
      baseId: 'sao-palme-43',
      name: 'Felchlin Sao Palme Lait 43%',
      category: 'chocolate',
      chocolateType: 'milk',
      cacaoPercentage: 43,
      ganacheCharacteristics: {
        cacaoFat: 24,
        sugar: 40,
        milkFat: 5,
        water: 1,
        solids: 30,
        otherFats: 0
      },
      fluidityStars: 3,
      description: 'Premium milk chocolate with high cacao content',
      tags: ['milk', 'premium'],
      allergens: ['milk'],
      vegan: false
    },
    'sao-palme-36': {
      baseId: 'sao-palme-36',
      name: 'Felchlin Sao Palme Lait 36%',
      category: 'chocolate',
      chocolateType: 'milk',
      cacaoPercentage: 36,
      ganacheCharacteristics: {
        cacaoFat: 20,
        sugar: 42,
        milkFat: 6,
        water: 1,
        solids: 31,
        otherFats: 0
      },
      fluidityStars: 3,
      description: 'Classic milk chocolate for confectionery',
      tags: ['milk', 'classic'],
      allergens: ['milk'],
      vegan: false
    },
    'accra-62': {
      baseId: 'accra-62',
      name: 'Felchlin Accra 62%',
      category: 'chocolate',
      chocolateType: 'dark',
      cacaoPercentage: 62,
      ganacheCharacteristics: {
        cacaoFat: 35,
        sugar: 36,
        milkFat: 0,
        water: 1,
        solids: 28,
        otherFats: 0
      },
      fluidityStars: 3,
      description: 'West African cocoa with robust flavor',
      tags: ['dark', 'african', 'single-origin'],
      origins: ['West Africa'],
      vegan: true
    },
    'edelweiss-36': {
      baseId: 'edelweiss-36',
      name: 'Felchlin Edelweiss 36%',
      category: 'chocolate',
      chocolateType: 'white',
      cacaoPercentage: 36,
      ganacheCharacteristics: {
        cacaoFat: 24,
        sugar: 48,
        milkFat: 6,
        water: 1,
        solids: 21,
        otherFats: 0
      },
      fluidityStars: 3,
      description: 'Swiss white chocolate with pure vanilla',
      tags: ['white', 'swiss'],
      allergens: ['milk'],
      vegan: false
    },
    'bionda-36': {
      baseId: 'bionda-36',
      name: 'Felchlin Bionda Caramello 36%',
      category: 'chocolate',
      chocolateType: 'caramelized',
      cacaoPercentage: 36,
      ganacheCharacteristics: {
        cacaoFat: 22,
        sugar: 50,
        milkFat: 5,
        water: 1,
        solids: 22,
        otherFats: 0
      },
      fluidityStars: 3,
      description: 'Caramelized white chocolate with dulce de leche notes',
      tags: ['caramelized', 'blond', 'dulce'],
      allergens: ['milk'],
      vegan: false
    }
  },
  guittard: {
    'coucher-du-soleil-72': {
      baseId: 'coucher-du-soleil-72',
      name: 'Coucher du Soleil 72%',
      category: 'chocolate',
      chocolateType: 'dark',
      cacaoPercentage: 72,
      ganacheCharacteristics: {
        cacaoFat: 42,
        sugar: 27,
        milkFat: 0,
        water: 1,
        solids: 30,
        otherFats: 2
      },
      fluidityStars: 4,
      viscosityMcm: 65,
      description:
        'Dark and rich chocolate with a smooth, creamy mouthfeel. Full-bodied throughout with a clean, fresh finish',
      manufacturer: 'Guittard',
      tags: ['dark', 'bittersweet', 'couverture', 'smooth', 'full-bodied'],
      origins: ['South Pacific', 'West Africa', 'South America blend'],
      beanVarieties: ['Forastero', 'Trinitario'],
      applications: ['enrobing', 'molding', 'confectionery', 'ganache', 'mousse'],
      certifications: ['fair-trade', 'all-natural', 'real-vanilla', 'non-gmo', 'peanut-free', 'gluten-free'],
      traceAllergens: ['milk'],
      temperingCurve: {
        meltingPoint: 45,
        workingTemperature: 31
      },
      vegan: true
    },
    'lever-du-soleil-61': {
      baseId: 'lever-du-soleil-61',
      name: 'Lever du Soleil 61%',
      category: 'chocolate',
      chocolateType: 'dark',
      cacaoPercentage: 61,
      ganacheCharacteristics: {
        cacaoFat: 38,
        sugar: 37,
        milkFat: 0,
        water: 1,
        solids: 24,
        otherFats: 2
      },
      fluidityStars: 4,
      description: 'Dark chocolate couverture with balanced sweetness and smooth texture',
      manufacturer: 'Guittard',
      tags: ['dark', 'bittersweet', 'couverture', 'balanced'],
      origins: ['South Pacific', 'West Africa', 'South America blend'],
      beanVarieties: ['Forastero', 'Trinitario'],
      applications: ['enrobing', 'molding', 'confectionery', 'ganache', 'mousse'],
      certifications: ['fair-trade', 'all-natural', 'real-vanilla', 'non-gmo', 'peanut-free', 'gluten-free'],
      traceAllergens: ['milk'],
      temperingCurve: {
        meltingPoint: 45,
        workingTemperature: 31
      },
      vegan: true
    },
    'creme-francaise-31': {
      baseId: 'creme-francaise-31',
      name: 'Crème Française 31%',
      category: 'chocolate',
      chocolateType: 'white',
      cacaoPercentage: 31,
      ganacheCharacteristics: {
        cacaoFat: 20,
        sugar: 47,
        milkFat: 8,
        water: 1,
        solids: 24,
        otherFats: 0
      },
      fluidityStars: 4,
      viscosityMcM: 75,
      description:
        'French-style white chocolate with sweet fresh cream flavor, nutty undertones and lingering hint of citrus. Balanced, sweet dairy and rich cocoa butter taste',
      manufacturer: 'Guittard',
      tags: ['white', 'french-style', 'creamy', 'citrus', 'nutty'],
      applications: ['ganache', 'mousse', 'baking', 'ice-cream', 'sorbet', 'confectionery', 'drinks'],
      certifications: ['fair-trade', 'all-natural', 'real-vanilla', 'non-gmo', 'peanut-free', 'gluten-free'],
      allergens: ['milk'],
      temperingCurve: {
        meltingPoint: 45
      },
      vegan: false
    },
    'letoile-du-nord-64': {
      baseId: 'letoile-du-nord-64',
      name: "L'Étoile du Nord 64%",
      category: 'chocolate',
      chocolateType: 'dark',
      cacaoPercentage: 64,
      ganacheCharacteristics: {
        cacaoFat: 37,
        sugar: 34,
        milkFat: 0,
        water: 1,
        solids: 28,
        otherFats: 2
      },
      fluidityStars: 4,
      viscosityMcM: 85,
      description:
        'High impact, lingering bittersweet chocolate balanced with minimal sweetness, dark color with warm chocolate and spice notes',
      manufacturer: 'Guittard',
      tags: ['dark', 'bittersweet', 'high-impact', 'spice', 'minimal-sweetness'],
      applications: ['cremeux', 'ganache', 'mousse', 'baking', 'ice-cream', 'sorbet'],
      certifications: ['fair-trade', 'all-natural', 'real-vanilla', 'non-gmo', 'peanut-free', 'gluten-free'],
      traceAllergens: ['milk'],
      temperingCurve: {
        meltingPoint: 45,
        workingTemperature: 31
      },
      vegan: true
    },
    'la-nuit-noire-55': {
      baseId: 'la-nuit-noire-55',
      name: 'La Nuit Noire 55%',
      category: 'chocolate',
      chocolateType: 'dark',
      cacaoPercentage: 55,
      ganacheCharacteristics: {
        cacaoFat: 33,
        sugar: 43,
        milkFat: 0,
        water: 1,
        solids: 23,
        otherFats: 2
      },
      fluidityStars: 3,
      viscosityMcM: 115,
      description:
        'Classic deep chocolate flavor with pronounced fudge and multi-dimensional, balanced flavor profile. Nutty with lingering chocolate and vanilla finish',
      manufacturer: 'Guittard',
      tags: ['dark', 'classic', 'fudge', 'nutty', 'vanilla', 'balanced'],
      applications: ['cremeux', 'ganache', 'mousse'],
      certifications: ['fair-trade', 'all-natural', 'real-vanilla', 'non-gmo', 'peanut-free', 'gluten-free'],
      traceAllergens: ['milk'],
      temperingCurve: {
        meltingPoint: 45,
        workingTemperature: 31
      },
      vegan: true
    },
    'soleil-dor-38': {
      baseId: 'soleil-dor-38',
      name: "Soleil d'Or 38%",
      category: 'chocolate',
      chocolateType: 'milk',
      cacaoPercentage: 38,
      ganacheCharacteristics: {
        cacaoFat: 20,
        sugar: 40,
        milkFat: 8,
        water: 1,
        solids: 31,
        otherFats: 0
      },
      fluidityStars: 4,
      description:
        'Bold, rich upfront chocolate flavor accented with subtle caramel notes and lingering hint of cinnamon, fresh dairy flavor and spicy finish',
      manufacturer: 'Guittard',
      tags: ['milk', 'bold', 'caramel', 'cinnamon', 'dairy', 'spicy'],
      applications: ['cremeux', 'ganache', 'mousse', 'baking', 'ice-cream', 'sorbet'],
      certifications: ['fair-trade', 'all-natural', 'real-vanilla', 'non-gmo', 'peanut-free', 'gluten-free'],
      allergens: ['milk'],
      temperingCurve: {
        meltingPoint: 45,
        workingTemperature: 30
      },
      vegan: false
    }
  }
};
/* eslint-enable @typescript-eslint/naming-convention */
