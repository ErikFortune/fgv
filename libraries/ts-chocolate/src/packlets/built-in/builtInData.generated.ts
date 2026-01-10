// AUTO-GENERATED FILE - DO NOT EDIT DIRECTLY
// Run 'rushx build:data' to regenerate from source YAML files
//
// Source files:
//   - data/published/ingredients/cacao-barry.yaml
//   - data/published/ingredients/callebaut.yaml
//   - data/published/ingredients/common.yaml
//   - data/published/ingredients/felchlin.yaml
//   - data/published/ingredients/guittard.yaml
//   - data/published/recipes/common.yaml
//   - data/published/recipes/fgv.json
//   - data/published/molds/common.yaml
//   - data/published/molds/cw.yaml
//   - data/published/procedures/common.yaml
//   - data/published/confections/common.yaml

import { JsonObject } from '@fgv/ts-json-base';

/* eslint-disable @typescript-eslint/naming-convention */
/**
 * Generated ingredient collections from source YAML files.
 * @public
 */
export const ingredientCollections: Record<string, JsonObject> = {
  'cacao-barry': {
    metadata: {
      name: 'Cacao Barry Chocolates',
      description: 'French chocolate couvertures from Cacao Barry'
    },
    items: {
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
    }
  },
  callebaut: {
    metadata: {
      name: 'Callebaut Chocolates',
      description: 'Belgian chocolate couvertures from Barry Callebaut'
    },
    items: {
      '811-dark-54': {
        baseId: '811-dark-54',
        name: 'Callebaut Recipe N° 811 Dark 54.5%',
        category: 'chocolate',
        chocolateType: 'dark',
        cacaoPercentage: 54.5,
        ganacheCharacteristics: {
          cacaoFat: 37,
          sugar: 43,
          milkFat: 0,
          water: 1,
          solids: 19,
          otherFats: 0
        },
        fluidityStars: 3,
        description:
          "Iconic Belgian dark chocolate with full-bodied taste, solid cocoa body and fine fruity notes. One of Octaaf Callebaut's original recipes, loved by chefs worldwide for its exceptional versatility",
        manufacturer: 'Callebaut',
        tags: ['dark', 'semisweet', 'versatile', 'fruity', 'roasted-cocoa', 'iconic'],
        origins: ['Ivory Coast', 'Ghana', 'Ecuador'],
        beanVarieties: ['Forastero', 'Trinitario'],
        applications: [
          'confectionery',
          'ganache',
          'mousse',
          'enrobing',
          'molding',
          'baking',
          'sauces',
          'drinks'
        ],
        certifications: ['halal', 'kosher-dairy', 'vegetarian', 'vegan', 'cocoa-horizons'],
        traceAllergens: ['milk', 'soy'],
        temperingCurve: {
          meltingPoint: 45,
          workingTemperature: 31
        },
        vegan: true
      },
      '823-milk-33': {
        baseId: '823-milk-33',
        name: 'Callebaut Recipe N° 823 Milk 33.6%',
        category: 'chocolate',
        chocolateType: 'milk',
        cacaoPercentage: 33.6,
        ganacheCharacteristics: {
          cacaoFat: 30,
          sugar: 42,
          milkFat: 6,
          water: 1,
          solids: 21,
          otherFats: 0
        },
        fluidityStars: 3,
        description:
          'Classic Belgian milk chocolate with deep warm color, smooth cocoa body and sweet caramelly notes. Full-bodied taste and great workability, pairs well with spicy, fruity, dairy or liqueur-like flavors',
        manufacturer: 'Callebaut',
        tags: ['milk', 'caramel', 'smooth', 'versatile', 'classic', 'full-bodied'],
        origins: ['Ivory Coast', 'Ghana', 'Ecuador'],
        beanVarieties: ['Forastero'],
        applications: ['molding', 'enrobing', 'ganache', 'mousse', 'confectionery'],
        certifications: ['halal', 'kosher-dairy', 'vegetarian', 'cocoa-horizons'],
        allergens: ['milk', 'soy'],
        temperingCurve: {
          meltingPoint: 45,
          workingTemperature: 30
        },
        vegan: false
      },
      'w2-white-28': {
        baseId: 'w2-white-28',
        name: 'Callebaut Recipe N° W2 White 28%',
        category: 'chocolate',
        chocolateType: 'white',
        cacaoPercentage: 28,
        ganacheCharacteristics: {
          cacaoFat: 30,
          sugar: 45,
          milkFat: 6,
          water: 1,
          solids: 18,
          otherFats: 0
        },
        fluidityStars: 3,
        description:
          'All-purpose white chocolate with pronounced milky, creamy, caramelly and vanilla notes in perfect balance. Smooth and creamy mouthfeel with elegant satin shine and crisp snap when tempered',
        manufacturer: 'Callebaut',
        tags: ['white', 'creamy', 'vanilla', 'balanced', 'versatile', 'milky'],
        origins: ['Belgium', 'West Africa'],
        applications: ['ganache', 'mousse', 'confectionery', 'enrobing', 'glazes', 'ice-cream'],
        certifications: ['halal', 'kosher-dairy', 'vegetarian', 'gluten-free', 'cocoa-horizons'],
        allergens: ['milk', 'soy'],
        temperingCurve: {
          meltingPoint: 40,
          workingTemperature: 28
        },
        vegan: false
      },
      '70-30-38-dark-70': {
        baseId: '70-30-38-dark-70',
        name: 'Callebaut Recipe N° 70-30-38 Extra Bitter 70.5%',
        category: 'chocolate',
        chocolateType: 'dark',
        cacaoPercentage: 70.5,
        ganacheCharacteristics: {
          cacaoFat: 38,
          sugar: 26,
          milkFat: 0,
          water: 1,
          solids: 33,
          otherFats: 2
        },
        fluidityStars: 2,
        description:
          'Intense yet balanced dark chocolate with solid body of roasted cocoa, powerful bitter notes and fresh fruity hints. Lower fluidity makes it ideal for flavoring cremeux, dessert sauces and baked goods',
        manufacturer: 'Callebaut',
        tags: ['dark', 'extra-bitter', 'intense', 'roasted', 'fruity', 'powerful'],
        origins: ['Ivory Coast', 'Ghana', 'Ecuador'],
        beanVarieties: ['Forastero', 'Trinitario'],
        applications: ['cremeux', 'sauces', 'baking', 'ganache', 'mousse', 'cookies'],
        certifications: ['halal', 'kosher-dairy', 'vegetarian', 'vegan', 'cocoa-horizons'],
        traceAllergens: ['soy'],
        temperingCurve: {
          meltingPoint: 45,
          workingTemperature: 32
        },
        vegan: true
      },
      'gold-caramel-30': {
        baseId: 'gold-caramel-30',
        name: 'Callebaut Gold Caramelized White 30.4%',
        category: 'chocolate',
        chocolateType: 'caramelized',
        cacaoPercentage: 30.4,
        ganacheCharacteristics: {
          cacaoFat: 30,
          sugar: 38,
          milkFat: 7,
          water: 1,
          solids: 22,
          otherFats: 2
        },
        fluidityStars: 3,
        description:
          'Unique caramelized white chocolate with pale amber color and golden hue. Rich notes of toffee, butter, cream and an exciting dash of salt. Expertly crafted with caramelized sugar and caramelized milk',
        manufacturer: 'Callebaut',
        tags: ['caramelized', 'white', 'toffee', 'buttery', 'salted', 'golden', 'unique'],
        applications: ['confectionery', 'desserts', 'baking', 'ice-cream', 'ganache', 'mousse'],
        certifications: ['halal', 'kosher-dairy', 'vegetarian', 'gluten-free', 'non-gmo', 'cocoa-horizons'],
        allergens: ['milk', 'soy'],
        temperingCurve: {
          meltingPoint: 40,
          workingTemperature: 28
        },
        vegan: false
      },
      'ruby-rb1-33': {
        baseId: 'ruby-rb1-33',
        name: 'Callebaut Ruby RB1 33.6%',
        category: 'chocolate',
        chocolateType: 'ruby',
        cacaoPercentage: 33.6,
        ganacheCharacteristics: {
          cacaoFat: 30,
          sugar: 36,
          milkFat: 6,
          water: 1,
          solids: 27,
          otherFats: 0
        },
        fluidityStars: 3,
        description:
          'Revolutionary ruby chocolate born from the ruby cocoa bean with intense fruitiness and fresh sour notes. Natural pink color without added colorants or fruit flavorings. A completely new chocolate experience',
        manufacturer: 'Callebaut',
        tags: ['ruby', 'fruity', 'sour', 'pink', 'natural', 'innovative', 'unique'],
        origins: ['Ivory Coast', 'Ghana', 'Ecuador'],
        applications: ['pralines', 'frozen-desserts', 'mousse', 'glazes', 'confectionery'],
        certifications: ['halal', 'kosher-dairy', 'vegetarian', 'cocoa-horizons'],
        allergens: ['milk', 'soy'],
        temperingCurve: {
          meltingPoint: 40,
          workingTemperature: 28
        },
        vegan: false
      },
      '845-milk-32': {
        baseId: '845-milk-32',
        name: 'Callebaut Recipe N° 845 Milk 32.7%',
        category: 'chocolate',
        chocolateType: 'milk',
        cacaoPercentage: 32.7,
        ganacheCharacteristics: {
          cacaoFat: 30,
          sugar: 40,
          milkFat: 7,
          water: 1,
          solids: 22,
          otherFats: 0
        },
        fluidityStars: 3,
        description:
          'Intense milk chocolate with pronounced caramel notes and rich milky taste. Special milk selection shapes the creamy notes after conching. All-round chocolate for molded or enrobed confectionery and ganaches',
        manufacturer: 'Callebaut',
        tags: ['milk', 'caramel', 'intense', 'creamy', 'rich', 'all-round'],
        origins: ['Ivory Coast', 'Ghana', 'Ecuador'],
        beanVarieties: ['Forastero'],
        applications: ['molding', 'enrobing', 'ganache', 'confectionery', 'mousse'],
        certifications: ['halal', 'kosher-dairy', 'vegetarian', 'cocoa-horizons'],
        allergens: ['milk', 'soy'],
        temperingCurve: {
          meltingPoint: 45,
          workingTemperature: 30
        },
        vegan: false
      }
    }
  },
  common: {
    metadata: {
      name: 'Common Ingredients',
      description: 'Dairy, fats, sugars, and generic chocolates for recipe substitution'
    },
    items: {
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
          milkFat: 82,
          water: 18,
          solids: 2,
          otherFats: 0
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
          milkFat: 100,
          water: 0,
          solids: 0,
          otherFats: 0
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
      },
      'coconut-cream': {
        baseId: 'coconut-cream',
        name: 'Coconut Cream (Full Fat)',
        category: 'fat',
        ganacheCharacteristics: {
          cacaoFat: 0,
          sugar: 2,
          milkFat: 0,
          water: 53,
          solids: 5,
          otherFats: 40
        },
        meltingPoint: 24,
        vegan: true,
        tags: ['vegan', 'dairy-free', 'coconut']
      },
      'chocolate-dark-64': {
        baseId: 'chocolate-dark-64',
        name: 'Generic Dark Chocolate (64%)',
        description: 'Reference dark chocolate for recipe substitution. Use any quality 64% dark couverture.',
        category: 'chocolate',
        chocolateType: 'dark',
        cacaoPercentage: 64,
        ganacheCharacteristics: {
          cacaoFat: 38,
          sugar: 32,
          milkFat: 0,
          water: 1,
          solids: 29,
          otherFats: 0
        },
        tags: ['generic', 'dark', 'substitutable']
      },
      'chocolate-milk-38': {
        baseId: 'chocolate-milk-38',
        name: 'Generic Milk Chocolate (38%)',
        description: 'Reference milk chocolate for recipe substitution. Use any quality 38% milk couverture.',
        category: 'chocolate',
        chocolateType: 'milk',
        cacaoPercentage: 38,
        ganacheCharacteristics: {
          cacaoFat: 22,
          sugar: 42,
          milkFat: 6,
          water: 1,
          solids: 26,
          otherFats: 3
        },
        allergens: ['milk'],
        tags: ['generic', 'milk', 'substitutable']
      },
      'chocolate-white-34': {
        baseId: 'chocolate-white-34',
        name: 'Generic White Chocolate (34%)',
        description:
          'Reference white chocolate for recipe substitution. Use any quality 34% white couverture.',
        category: 'chocolate',
        chocolateType: 'white',
        cacaoPercentage: 34,
        ganacheCharacteristics: {
          cacaoFat: 34,
          sugar: 40,
          milkFat: 5,
          water: 1,
          solids: 18,
          otherFats: 2
        },
        allergens: ['milk'],
        tags: ['generic', 'white', 'substitutable']
      },
      'hazelnut-paste': {
        baseId: 'hazelnut-paste',
        name: 'Hazelnut Paste (100% Hazelnuts)',
        category: 'fat',
        ganacheCharacteristics: {
          cacaoFat: 0,
          sugar: 4,
          milkFat: 0,
          water: 3,
          solids: 38,
          otherFats: 55
        },
        meltingPoint: 30,
        vegan: true,
        allergens: ['nuts'],
        tags: ['gianduja', 'praline', 'hazelnut']
      },
      'cocoa-powder': {
        baseId: 'cocoa-powder',
        name: 'Dutch-Process Cocoa Powder',
        category: 'other',
        description: 'Alkalized cocoa powder for truffle coating and finishing',
        ganacheCharacteristics: {
          cacaoFat: 12,
          sugar: 0,
          milkFat: 0,
          water: 3,
          solids: 85,
          otherFats: 0
        },
        vegan: true,
        tags: ['coating', 'truffle', 'cocoa', 'finishing']
      }
    }
  },
  felchlin: {
    metadata: {
      name: 'Felchlin Chocolates',
      description: 'Swiss chocolate couvertures from Max Felchlin AG'
    },
    items: {
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
    }
  },
  guittard: {
    metadata: {
      name: 'Guittard Chocolates',
      description: 'American chocolate couvertures from Guittard Chocolate Company'
    },
    items: {
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
        certifications: [
          'fair-trade',
          'all-natural',
          'real-vanilla',
          'non-gmo',
          'peanut-free',
          'gluten-free'
        ],
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
        certifications: [
          'fair-trade',
          'all-natural',
          'real-vanilla',
          'non-gmo',
          'peanut-free',
          'gluten-free'
        ],
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
        certifications: [
          'fair-trade',
          'all-natural',
          'real-vanilla',
          'non-gmo',
          'peanut-free',
          'gluten-free'
        ],
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
        certifications: [
          'fair-trade',
          'all-natural',
          'real-vanilla',
          'non-gmo',
          'peanut-free',
          'gluten-free'
        ],
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
        certifications: [
          'fair-trade',
          'all-natural',
          'real-vanilla',
          'non-gmo',
          'peanut-free',
          'gluten-free'
        ],
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
        certifications: [
          'fair-trade',
          'all-natural',
          'real-vanilla',
          'non-gmo',
          'peanut-free',
          'gluten-free'
        ],
        allergens: ['milk'],
        temperingCurve: {
          meltingPoint: 45,
          workingTemperature: 30
        },
        vegan: false
      }
    }
  }
};

/**
 * Generated recipe collections from source YAML files.
 * @public
 */
export const recipeCollections: Record<string, JsonObject> = {
  common: {
    metadata: {
      name: 'Common Recipes',
      description: 'Seed data ganache recipes for the recipes library'
    },
    items: {
      'dark-ganache-classic': {
        baseId: 'dark-ganache-classic',
        name: 'Classic Dark Ganache',
        category: 'ganache',
        description:
          'Traditional dark chocolate ganache with 64% couverture. Rich, intense chocolate flavor perfect for truffles and bonbon fillings.',
        tags: ['classic', 'dark', 'truffle', 'bonbon'],
        goldenVersionSpec: '2026-01-01-01',
        usage: [],
        versions: [
          {
            versionSpec: '2026-01-01-01',
            createdDate: '2026-01-01',
            ingredients: [
              {
                ingredient: {
                  ids: ['cacao-barry.guayaquil-64', 'common.chocolate-dark-64', 'felchlin.arriba-72'],
                  preferredId: 'cacao-barry.guayaquil-64'
                },
                amount: 400
              },
              {
                ingredient: {
                  ids: ['common.heavy-cream-35']
                },
                amount: 200
              },
              {
                ingredient: {
                  ids: ['common.butter-82']
                },
                amount: 20,
                notes: 'Added at 35°C for shine'
              }
            ],
            baseWeight: 620,
            yield: '~50 bonbons',
            notes: 'Standard 2:1 ratio with butter finish'
          }
        ]
      },
      'milk-ganache-classic': {
        baseId: 'milk-ganache-classic',
        name: 'Classic Milk Ganache',
        category: 'ganache',
        description:
          'Smooth milk chocolate ganache with caramel notes. Higher chocolate ratio compensates for milk solids.',
        tags: ['classic', 'milk', 'truffle', 'bonbon'],
        goldenVersionSpec: '2026-01-01-01',
        usage: [],
        versions: [
          {
            versionSpec: '2026-01-01-01',
            createdDate: '2026-01-01',
            ingredients: [
              {
                ingredient: {
                  ids: ['guittard.soleil-dor-38']
                },
                amount: 350
              },
              {
                ingredient: {
                  ids: ['common.heavy-cream-35']
                },
                amount: 200
              },
              {
                ingredient: {
                  ids: ['common.butter-82']
                },
                amount: 20,
                notes: 'Added at 35°C for shine'
              }
            ],
            baseWeight: 570,
            yield: '~45 bonbons',
            notes: '1.75:1 ratio for proper set with milk chocolate'
          }
        ]
      },
      'white-ganache-classic': {
        baseId: 'white-ganache-classic',
        name: 'Classic White Ganache',
        category: 'ganache',
        description:
          'Delicate white chocolate ganache with creamy vanilla notes. Higher chocolate ratio needed for proper emulsion and set.',
        tags: ['classic', 'white', 'truffle', 'bonbon'],
        goldenVersionSpec: '2026-01-01-01',
        usage: [],
        versions: [
          {
            versionSpec: '2026-01-01-01',
            createdDate: '2026-01-01',
            ingredients: [
              {
                ingredient: {
                  ids: ['cacao-barry.zephyr-white-34']
                },
                amount: 500
              },
              {
                ingredient: {
                  ids: ['common.heavy-cream-35']
                },
                amount: 200
              },
              {
                ingredient: {
                  ids: ['common.butter-82']
                },
                amount: 15,
                notes: 'Added at 32°C for shine'
              }
            ],
            baseWeight: 715,
            yield: '~55 bonbons',
            notes: '2.5:1 ratio essential for white chocolate emulsion'
          }
        ]
      },
      'vegan-ganache-coconut-cream': {
        baseId: 'vegan-ganache-coconut-cream',
        name: 'Vegan Ganache (Coconut Cream)',
        category: 'ganache',
        description:
          'Dairy-free ganache using full-fat coconut cream. Subtle coconut undertones complement the dark chocolate.',
        tags: ['vegan', 'dairy-free', 'dark', 'coconut'],
        goldenVersionSpec: '2026-01-01-01',
        usage: [],
        versions: [
          {
            versionSpec: '2026-01-01-01',
            createdDate: '2026-01-01',
            ingredients: [
              {
                ingredient: {
                  ids: ['cacao-barry.guayaquil-64']
                },
                amount: 400
              },
              {
                ingredient: {
                  ids: ['common.coconut-cream']
                },
                amount: 200,
                notes: 'Use full-fat, refrigerate and use solid portion'
              }
            ],
            baseWeight: 600,
            yield: '~48 bonbons',
            notes: 'Coconut cream provides fat and moisture similar to dairy cream'
          }
        ]
      },
      'vegan-ganache-coconut-oil': {
        baseId: 'vegan-ganache-coconut-oil',
        name: 'Vegan Ganache (Coconut Oil)',
        category: 'ganache',
        description:
          'Dairy-free ganache using coconut oil and water. Neutral flavor profile lets chocolate shine.',
        tags: ['vegan', 'dairy-free', 'dark', 'neutral'],
        goldenVersionSpec: '2026-01-01-01',
        usage: [],
        versions: [
          {
            versionSpec: '2026-01-01-01',
            createdDate: '2026-01-01',
            ingredients: [
              {
                ingredient: {
                  ids: ['cacao-barry.guayaquil-64']
                },
                amount: 400
              },
              {
                ingredient: {
                  ids: ['common.coconut-oil']
                },
                amount: 150,
                notes: 'Melted, at 35°C'
              },
              {
                ingredient: {
                  ids: ['common.glucose-de43']
                },
                amount: 30,
                notes: 'For texture and shelf life'
              }
            ],
            baseWeight: 580,
            yield: '~46 bonbons',
            notes: 'Oil-based method gives firmer set and neutral flavor'
          }
        ]
      },
      'caramelized-ganache': {
        baseId: 'caramelized-ganache',
        name: 'Caramelized Ganache',
        category: 'ganache',
        description:
          'Luxurious ganache made with caramelized white chocolate. Notes of dulce de leche and salted caramel.',
        tags: ['caramelized', 'blonde', 'truffle', 'bonbon', 'salted-caramel'],
        goldenVersionSpec: '2026-01-01-01',
        usage: [],
        versions: [
          {
            versionSpec: '2026-01-01-01',
            createdDate: '2026-01-01',
            ingredients: [
              {
                ingredient: {
                  ids: ['cacao-barry.zephyr-caramel-35']
                },
                amount: 450
              },
              {
                ingredient: {
                  ids: ['common.heavy-cream-35']
                },
                amount: 180
              },
              {
                ingredient: {
                  ids: ['common.butter-82']
                },
                amount: 20,
                notes: 'Salted butter works beautifully here'
              }
            ],
            baseWeight: 650,
            yield: '~52 bonbons',
            notes: 'Slightly higher chocolate ratio for caramelized varieties'
          }
        ]
      },
      'gianduja-basic': {
        baseId: 'gianduja-basic',
        name: 'Basic Gianduja',
        category: 'gianduja',
        description: 'Classic Italian hazelnut-chocolate combination. Smooth, nutty, and luxurious.',
        tags: ['gianduja', 'hazelnut', 'italian', 'praline'],
        goldenVersionSpec: '2026-01-01-01',
        usage: [],
        versions: [
          {
            versionSpec: '2026-01-01-01',
            createdDate: '2026-01-01',
            ingredients: [
              {
                ingredient: {
                  ids: ['felchlin.sao-palme-43']
                },
                amount: 300
              },
              {
                ingredient: {
                  ids: ['common.hazelnut-paste']
                },
                amount: 200,
                notes: '100% roasted hazelnuts, finely ground'
              },
              {
                ingredient: {
                  ids: ['common.butter-82']
                },
                amount: 50,
                notes: 'For smoothness'
              }
            ],
            baseWeight: 550,
            yield: '~44 bonbons',
            notes: 'Traditional 60:40 chocolate to hazelnut ratio'
          }
        ]
      }
    }
  },
  fgv: {
    format: 'encrypted-collection-v1',
    secretName: 'fgv',
    algorithm: 'AES-256-GCM',
    iv: 'QznjcBurAr+UKYSz',
    authTag: '9lX1AeMiw+XQGud1kNzEAg==',
    encryptedData:
      '36XwpREG1wwixCc1DvyCyXcyI2YjThOXJu2Q2SDMKDAmF4YitiFq7uP9lr76Ari+DfKGr/lSpqT4oF1cojeSy6Hu3y+SYynm7AE4Q+FkWUbvHl5muA7YAsY6do+/07QA5wor+lquUl0BNGCzH98nuWc81CeARMGghfr705ghebdk2f6/KhqZZIxap6rHwugRAdQczC8Xc7BSXmVO5+I5DytcPYouInKxHrGbv/zeP2BvP+b2JlBEoiqB1Wz7zT/O4oUgJPfonXVCy1dULJZqYU7NRWAAJtKq8MO4RQa/SYhgB6DQWKW6xL+xsciQ2Zz6yVA/eYc/JDcD1bF9pavjN62VjbOtkQudynW4oUPWxkS7+SGb8RzttnS8PcUjpDcJjzgHKkGW3vxLvTOlYvAgAB0kb7UduSN50xMh95h5GJC5et5ilAhCHMOwIE6AtbaTJ9SEMMpjr2YWgIo5l83wiw3rwY6RFFp4hk8/wd7t4w8WbQVhIftPOVxwx+C76qw0g/jSt/TXWKWOtQzlnISmDFFmsqMjF795XjKl3ctwajCZHYgujFTFwnLNlcon6rlBCD/oZYpIZVIMxfJBOXcRnWXbi81a3D+8V1jwS+MuuS6ajCiBouX1UzzDssM/4rsNVs0hekXRTOp/sT4b7lTmC2JeYmwVdkRcqSTu+9clix8E/QN5FskECnN9/vE5BIw2uaditTUyX1P5zPdMyfMFoE4W9ng7Awh3XaOjiWpUu+8XfHV5oZV+1lzLnbo6+7CCZ7xPJA=='
  }
};

/**
 * Generated mold collections from source YAML files.
 * @public
 */
export const moldCollections: Record<string, JsonObject> = {
  common: {
    metadata: {
      name: 'Common Molds',
      description: 'Generic chocolate mold shapes'
    },
    items: {
      'dome-25mm': {
        baseId: 'dome-25mm',
        manufacturer: 'Generic',
        productNumber: 'DOME-25',
        description: '25mm hemisphere dome',
        cavityCount: 24,
        cavityWeight: 8,
        cavityDimensions: {
          width: 25,
          length: 25,
          depth: 12
        },
        format: 'series-2000',
        tags: ['dome', 'hemisphere', 'truffle'],
        notes: 'Standard 25mm dome for truffles'
      },
      'dome-30mm': {
        baseId: 'dome-30mm',
        manufacturer: 'Generic',
        productNumber: 'DOME-30',
        description: '30mm hemisphere dome',
        cavityCount: 15,
        cavityWeight: 14,
        cavityDimensions: {
          width: 30,
          length: 30,
          depth: 15
        },
        format: 'series-2000',
        tags: ['dome', 'hemisphere', 'truffle'],
        notes: 'Standard 30mm dome for larger truffles'
      },
      'bullet-28mm': {
        baseId: 'bullet-28mm',
        manufacturer: 'Generic',
        productNumber: 'BULLET-28',
        description: '28mm bullet/ogive shape',
        cavityCount: 21,
        cavityWeight: 10,
        cavityDimensions: {
          width: 28,
          length: 28,
          depth: 18
        },
        format: 'series-2000',
        tags: ['bullet', 'ogive', 'praline'],
        notes: 'Classic bullet shape for pralines'
      },
      'square-25mm': {
        baseId: 'square-25mm',
        manufacturer: 'Generic',
        productNumber: 'SQ-25',
        description: '25mm square',
        cavityCount: 24,
        cavityWeight: 10,
        cavityDimensions: {
          width: 25,
          length: 25,
          depth: 16
        },
        format: 'series-2000',
        tags: ['square', 'geometric'],
        notes: 'Simple square mold for ganache'
      }
    }
  },
  cw: {
    metadata: {
      name: 'Chocolate World Molds',
      description: 'Chocolate World polycarbonate molds'
    },
    items: {
      'chocolate-world-cw-2227': {
        baseId: 'chocolate-world-cw-2227',
        manufacturer: 'Chocolate World',
        productNumber: 'CW 2227',
        description: 'Hex Swirl',
        cavityCount: 32,
        cavityWeight: 10,
        cavityDimensions: {
          width: 30,
          length: 30,
          depth: 16
        },
        format: 'series-2000',
        tags: ['hex-swirl', 'praline']
      }
    }
  }
};

/**
 * Generated procedure collections from source YAML files.
 * @public
 */
export const procedureCollections: Record<string, JsonObject> = {
  common: {
    metadata: {
      name: 'Common Procedures',
      description: 'Standard chocolate-making procedures'
    },
    items: {
      'ganache-cold-method': {
        baseId: 'ganache-cold-method',
        name: 'Ganache (Cold Method)',
        category: 'ganache',
        steps: [
          {
            order: 1,
            description: 'Melt chocolate to 40-45C',
            activeTime: 5,
            temperature: 45
          },
          {
            order: 2,
            description: 'Warm cream to 35C',
            activeTime: 3,
            temperature: 35
          },
          {
            order: 3,
            description: 'Combine and emulsify with immersion blender',
            activeTime: 5
          },
          {
            order: 4,
            description: 'Add butter at 35C and blend until smooth',
            activeTime: 2,
            temperature: 35
          },
          {
            order: 5,
            description: 'Rest at room temperature',
            waitTime: 30
          }
        ],
        tags: ['ganache', 'emulsion', 'cold-process']
      },
      'ganache-hot-method': {
        baseId: 'ganache-hot-method',
        name: 'Ganache (Hot Method)',
        category: 'ganache',
        steps: [
          {
            order: 1,
            description: 'Bring cream to boil',
            activeTime: 5,
            temperature: 100
          },
          {
            order: 2,
            description: 'Pour over finely chopped chocolate',
            activeTime: 1
          },
          {
            order: 3,
            description: 'Let stand 1-2 minutes',
            waitTime: 2
          },
          {
            order: 4,
            description: 'Stir from center outward to emulsify',
            activeTime: 5
          },
          {
            order: 5,
            description: 'Add butter and blend until smooth',
            activeTime: 2
          }
        ],
        tags: ['ganache', 'emulsion', 'hot-process']
      },
      gianduja: {
        baseId: 'gianduja',
        name: 'Gianduja',
        category: 'gianduja',
        steps: [
          {
            order: 1,
            description: 'Roast hazelnuts at 150C until golden',
            activeTime: 15,
            temperature: 150
          },
          {
            order: 2,
            description: 'Rub off skins while warm',
            activeTime: 5
          },
          {
            order: 3,
            description: 'Grind to paste in food processor',
            activeTime: 10
          },
          {
            order: 4,
            description: 'Melt chocolate to 45C',
            activeTime: 5,
            temperature: 45
          },
          {
            order: 5,
            description: 'Combine paste and chocolate, mix until smooth',
            activeTime: 5
          },
          {
            order: 6,
            description: 'Temper and pour into molds',
            activeTime: 15
          }
        ],
        tags: ['gianduja', 'hazelnut', 'nut-paste']
      }
    }
  }
};

/**
 * Generated confection collections from source YAML files.
 * @public
 */
export const confectionCollections: Record<string, JsonObject> = {
  common: {
    metadata: {
      name: 'Common Confections',
      description: 'Seed data confections for the confections library'
    },
    items: {
      'dark-dome-bonbon': {
        baseId: 'dark-dome-bonbon',
        confectionType: 'molded-bonbon',
        name: 'Classic Dark Dome Bonbon',
        description: 'Traditional molded dark chocolate bonbon with dome shape',
        tags: ['classic', 'dark', 'molded', 'dome'],
        goldenVersionSpec: '2026-01-01-01',
        yield: {
          count: 24,
          unit: 'pieces',
          weightPerPiece: 12
        },
        fillings: [
          {
            slotId: 'center',
            filling: {
              options: [
                {
                  type: 'recipe',
                  id: 'common.dark-ganache-classic'
                }
              ],
              preferredId: 'common.dark-ganache-classic'
            }
          }
        ],
        molds: {
          options: [
            {
              id: 'common.dome-25mm'
            }
          ],
          preferredId: 'common.dome-25mm'
        },
        shellChocolate: {
          ids: ['cacao-barry.guayaquil-64', 'common.chocolate-dark-64'],
          preferredId: 'cacao-barry.guayaquil-64'
        },
        versions: [
          {
            versionSpec: '2026-01-01-01',
            createdDate: '2026-01-01',
            notes: 'Basic dome bonbon with dark ganache filling'
          }
        ]
      },
      'dark-bar-truffle': {
        baseId: 'dark-bar-truffle',
        confectionType: 'bar-truffle',
        name: 'Classic Dark Bar Truffle',
        description: 'Ganache slab cut into squares and enrobed',
        tags: ['classic', 'dark', 'bar', 'enrobed'],
        goldenVersionSpec: '2026-01-01-01',
        yield: {
          count: 48,
          unit: 'pieces',
          weightPerPiece: 10
        },
        fillings: [
          {
            slotId: 'center',
            filling: {
              options: [
                {
                  type: 'recipe',
                  id: 'common.dark-ganache-classic'
                }
              ],
              preferredId: 'common.dark-ganache-classic'
            }
          }
        ],
        frameDimensions: {
          width: 300,
          height: 200,
          depth: 8
        },
        singleBonBonDimensions: {
          width: 25,
          height: 25
        },
        enrobingChocolate: {
          ids: ['cacao-barry.guayaquil-64'],
          preferredId: 'cacao-barry.guayaquil-64'
        },
        versions: [
          {
            versionSpec: '2026-01-01-01',
            createdDate: '2026-01-01',
            notes: 'Standard 25mm square bar truffles'
          }
        ]
      },
      'dark-cocoa-truffle': {
        baseId: 'dark-cocoa-truffle',
        confectionType: 'rolled-truffle',
        name: 'Classic Cocoa-Dusted Truffle',
        description: 'Hand-rolled ganache truffle dusted with cocoa powder',
        tags: ['classic', 'dark', 'rolled', 'cocoa'],
        goldenVersionSpec: '2026-01-01-01',
        yield: {
          count: 40,
          unit: 'pieces',
          weightPerPiece: 15
        },
        fillings: [
          {
            slotId: 'center',
            filling: {
              options: [
                {
                  type: 'recipe',
                  id: 'common.dark-ganache-classic'
                }
              ],
              preferredId: 'common.dark-ganache-classic'
            }
          }
        ],
        coatings: {
          ids: ['common.cocoa-powder'],
          preferredId: 'common.cocoa-powder'
        },
        versions: [
          {
            versionSpec: '2026-01-01-01',
            createdDate: '2026-01-01',
            notes: 'Traditional rolled truffle with cocoa coating'
          }
        ]
      }
    }
  }
};
/* eslint-enable @typescript-eslint/naming-convention */
