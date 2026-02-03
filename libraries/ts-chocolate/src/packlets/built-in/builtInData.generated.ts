// AUTO-GENERATED FILE - DO NOT EDIT DIRECTLY
// Run 'rushx build:data' to regenerate from source YAML files
//
// Source files:
//   - data/published/ingredients/cacao-barry.yaml
//   - data/published/ingredients/callebaut.yaml
//   - data/published/ingredients/common.yaml
//   - data/published/ingredients/felchlin.yaml
//   - data/published/ingredients/guittard.yaml
//   - data/published/fillings/common.yaml
//   - data/published/fillings/fgv.json
//   - data/published/molds/common.yaml
//   - data/published/molds/cw.yaml
//   - data/published/procedures/common.yaml
//   - data/published/tasks/common.yaml
//   - data/published/confections/common.yaml

/* eslint-disable max-lines */
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
      'heavy-cream-38': {
        baseId: 'heavy-cream-38',
        name: 'Heavy Cream (38% fat)',
        ganacheCharacteristics: {
          cacaoFat: 0,
          sugar: 0,
          milkFat: 38,
          water: 57,
          solids: 5,
          otherFats: 0
        },
        allergens: ['milk'],
        vegan: false,
        category: 'dairy',
        fatContent: 38,
        waterContent: 57
      },
      'butter-82': {
        baseId: 'butter-82',
        name: 'Unsalted Butter (82% fat)',
        ganacheCharacteristics: {
          cacaoFat: 0,
          sugar: 0,
          milkFat: 82,
          water: 18,
          solids: 2,
          otherFats: 0
        },
        allergens: ['milk'],
        vegan: false,
        category: 'fat',
        meltingPoint: 32
      },
      'glucose-de43': {
        baseId: 'glucose-de43',
        name: 'Glucose Syrup (DE 43)',
        ganacheCharacteristics: {
          cacaoFat: 0,
          sugar: 80,
          milkFat: 0,
          water: 20,
          solids: 0,
          otherFats: 0
        },
        vegan: true,
        category: 'sugar',
        sweetnessPotency: 0.4
      },
      'invert-sugar': {
        baseId: 'invert-sugar',
        name: 'Invert Sugar (Trimoline)',
        ganacheCharacteristics: {
          cacaoFat: 0,
          sugar: 77,
          milkFat: 0,
          water: 23,
          solids: 0,
          otherFats: 0
        },
        vegan: true,
        category: 'sugar',
        sweetnessPotency: 1.2
      },
      sorbitol: {
        baseId: 'sorbitol',
        name: 'Sorbitol (70% solution)',
        ganacheCharacteristics: {
          cacaoFat: 0,
          sugar: 70,
          milkFat: 0,
          water: 30,
          solids: 0,
          otherFats: 0
        },
        vegan: true,
        category: 'sugar',
        sweetnessPotency: 0.6
      },
      'granulated-sugar': {
        baseId: 'granulated-sugar',
        name: 'Granulated Sugar',
        ganacheCharacteristics: {
          cacaoFat: 0,
          sugar: 100,
          milkFat: 0,
          water: 0,
          solids: 0,
          otherFats: 0
        },
        vegan: true,
        category: 'sugar',
        sweetnessPotency: 1
      },
      'muscovado-sugar': {
        baseId: 'muscovado-sugar',
        name: 'Muscovado Sugar',
        ganacheCharacteristics: {
          cacaoFat: 0,
          sugar: 95,
          milkFat: 0,
          water: 3,
          solids: 2,
          otherFats: 0
        },
        vegan: true,
        category: 'sugar',
        sweetnessPotency: 1
      },
      'coconut-cream': {
        baseId: 'coconut-cream',
        name: 'Coconut Cream (Full Fat)',
        ganacheCharacteristics: {
          cacaoFat: 0,
          sugar: 2,
          milkFat: 0,
          water: 53,
          solids: 5,
          otherFats: 40
        },
        vegan: true,
        tags: ['vegan', 'dairy-free', 'coconut'],
        category: 'fat',
        meltingPoint: 24
      },
      'chocolate-dark-64': {
        baseId: 'chocolate-dark-64',
        name: 'Generic Dark Chocolate (64%)',
        ganacheCharacteristics: {
          cacaoFat: 38,
          sugar: 32,
          milkFat: 0,
          water: 1,
          solids: 29,
          otherFats: 0
        },
        description: 'Reference dark chocolate for recipe substitution. Use any quality 64% dark couverture.',
        tags: ['generic', 'dark', 'substitutable'],
        category: 'chocolate',
        chocolateType: 'dark',
        cacaoPercentage: 64
      },
      'chocolate-milk-38': {
        baseId: 'chocolate-milk-38',
        name: 'Generic Milk Chocolate (38%)',
        ganacheCharacteristics: {
          cacaoFat: 22,
          sugar: 42,
          milkFat: 6,
          water: 1,
          solids: 26,
          otherFats: 3
        },
        description: 'Reference milk chocolate for recipe substitution. Use any quality 38% milk couverture.',
        allergens: ['milk'],
        tags: ['generic', 'milk', 'substitutable'],
        category: 'chocolate',
        chocolateType: 'milk',
        cacaoPercentage: 38
      },
      'chocolate-white-34': {
        baseId: 'chocolate-white-34',
        name: 'Generic White Chocolate (34%)',
        ganacheCharacteristics: {
          cacaoFat: 34,
          sugar: 40,
          milkFat: 5,
          water: 1,
          solids: 18,
          otherFats: 2
        },
        description:
          'Reference white chocolate for recipe substitution. Use any quality 34% white couverture.',
        allergens: ['milk'],
        tags: ['generic', 'white', 'substitutable'],
        category: 'chocolate',
        chocolateType: 'white',
        cacaoPercentage: 34
      },
      'hazelnut-paste': {
        baseId: 'hazelnut-paste',
        name: 'Hazelnut Paste (100% Hazelnuts)',
        ganacheCharacteristics: {
          cacaoFat: 0,
          sugar: 4,
          milkFat: 0,
          water: 3,
          solids: 38,
          otherFats: 55
        },
        allergens: ['nuts'],
        vegan: true,
        tags: ['gianduja', 'praline', 'hazelnut'],
        category: 'fat',
        meltingPoint: 30
      },
      'cocoa-powder': {
        baseId: 'cocoa-powder',
        name: 'Dutch-Process Cocoa Powder',
        ganacheCharacteristics: {
          cacaoFat: 12,
          sugar: 0,
          milkFat: 0,
          water: 3,
          solids: 85,
          otherFats: 0
        },
        description: 'Alkalized cocoa powder for truffle coating and finishing',
        vegan: true,
        tags: ['coating', 'truffle', 'cocoa', 'finishing'],
        category: 'other'
      },
      'soy-milk': {
        baseId: 'soy-milk',
        name: 'Soy Milk',
        ganacheCharacteristics: {
          cacaoFat: 0,
          sugar: 0,
          milkFat: 0,
          water: 92,
          solids: 6,
          otherFats: 2
        },
        description:
          'Plant-based milk alternative made from soybeans and water, typically unsweetened with around 3-4% protein, low fat, and high water content. Used in vegan ganache as a dairy cream substitute.',
        allergens: ['soy'],
        certifications: ['vegan'],
        vegan: true,
        tags: ['plant-based', 'unsweetened'],
        density: 1.03,
        category: 'liquid'
      },
      'raspberry-puree-himbeermark': {
        baseId: 'raspberry-puree-himbeermark',
        name: 'Raspberry Puree (Himbeermark)',
        ganacheCharacteristics: {
          cacaoFat: 0,
          sugar: 5,
          milkFat: 0,
          water: 83,
          solids: 12,
          otherFats: 0
        },
        description:
          'Seedless, finely pureed raspberries (Himbeermark in German), unsweetened fruit puree made by crushing and straining fresh or processed raspberries to remove seeds and fibers. Commonly used in German baking for fillings, mousses, sauces, tortes, or as a flavoring in creams and ganache.',
        certifications: ['vegan'],
        vegan: true,
        tags: ['fruit', 'puree', 'unsweetened', 'seedless'],
        density: 1.05,
        category: 'liquid'
      },
      'corn-syrup': {
        baseId: 'corn-syrup',
        name: 'Corn Syrup',
        ganacheCharacteristics: {
          cacaoFat: 0,
          sugar: 78,
          milkFat: 0,
          water: 22,
          solids: 0,
          otherFats: 0
        },
        description:
          'Light corn syrup (also known as glucose syrup from corn starch hydrolysis) — a viscous, clear sweetener primarily composed of glucose, maltose, and higher oligosaccharides. Used in ganache and confections to inhibit sugar crystallization, improve smoothness, add body, and extend shelf life. Typically unsweetened beyond its own sugars, with no added flavors.',
        certifications: ['vegan'],
        vegan: true,
        tags: ['sweetener', 'glucose-syrup', 'anti-crystallization', 'confectionery'],
        density: 1.38,
        category: 'liquid'
      },
      'cocoa-butter': {
        baseId: 'cocoa-butter',
        name: 'Cocoa Butter',
        ganacheCharacteristics: {
          cacaoFat: 100,
          sugar: 0,
          milkFat: 0,
          water: 0,
          solids: 0,
          otherFats: 0
        },
        description:
          'Pure edible fat extracted from cocoa beans (Theobroma cacao), consisting almost entirely of triglycerides (primarily saturated and monounsaturated fats like stearic, oleic, and palmitic acids). Pale yellow, solid at room temperature with a melting point around 34-38°C, used in ganache to thin mixtures, enhance snap/crispness, add gloss, and stabilize emulsions. Neutral flavor (deodorized versions) or mild cocoa aroma.',
        certifications: ['vegan'],
        vegan: true,
        tags: ['fat', 'cacao-fat', 'chocolate-making', 'tempering', 'vegan-fat'],
        density: 0.9,
        category: 'fat',
        meltingPoint: 35
      },
      'lemon-juice': {
        baseId: 'lemon-juice',
        name: 'Lemon Juice',
        ganacheCharacteristics: {
          cacaoFat: 0,
          sugar: 3,
          milkFat: 0,
          water: 90,
          solids: 7,
          otherFats: 0
        },
        description:
          'Freshly squeezed lemon juice, commonly used for acidity adjustment, flavor enhancement, and preservation in ganache and confectionery.',
        certifications: ['all-natural'],
        vegan: true,
        tags: ['citrus', 'acidic', 'fruit-juice'],
        density: 1.03,
        category: 'liquid'
      },
      'ghee-clarified-butter': {
        baseId: 'ghee-clarified-butter',
        name: 'Ghee (Clarified Butter)',
        ganacheCharacteristics: {
          cacaoFat: 0,
          sugar: 0,
          milkFat: 99,
          water: 0,
          solids: 1,
          otherFats: 0
        },
        description:
          'Ghee is clarified butter in which milk solids and water have been removed, resulting in a pure butterfat product with a rich, nutty flavor. Commonly used in confectionery and ganache for its high fat content and clean dairy notes.',
        allergens: ['milk'],
        tags: ['clarified-butter', 'butterfat', 'anhydrous-fat'],
        density: 0.91,
        category: 'fat',
        meltingPoint: 32
      },
      'coconut-oil-deodorized': {
        baseId: 'coconut-oil-deodorized',
        name: 'Coconut Oil (Deodorized)',
        ganacheCharacteristics: {
          cacaoFat: 0,
          sugar: 0,
          milkFat: 0,
          water: 0,
          solids: 0,
          otherFats: 100
        },
        description:
          'Refined and deodorized coconut oil with a neutral aroma and flavor, commonly used in confectionery and ganache for its clean fat profile and sharp melting behavior.',
        certifications: ['all-natural'],
        vegan: true,
        tags: ['coconut', 'refined-fat', 'neutral-oil'],
        density: 0.92,
        category: 'fat',
        meltingPoint: 24
      },
      'heavy-cream-36': {
        baseId: 'heavy-cream-36',
        name: 'Heavy Cream (36%)',
        ganacheCharacteristics: {
          cacaoFat: 0,
          sugar: 3,
          milkFat: 36,
          water: 58,
          solids: 3,
          otherFats: 0
        },
        description:
          'A rich dairy cream containing a high percentage of milk fat, commonly used in ganache for its emulsifying properties, smooth texture, and balanced water–fat ratio.',
        allergens: ['milk'],
        tags: ['cream', 'dairy', 'emulsion'],
        density: 1.01,
        category: 'dairy',
        fatContent: 36,
        waterContent: 58
      },
      'acid-powder': {
        baseId: 'acid-powder',
        name: 'Acid Powder (Säurepulver)',
        ganacheCharacteristics: {
          cacaoFat: 0,
          sugar: 0,
          milkFat: 0,
          water: 0,
          solids: 100,
          otherFats: 0
        },
        description:
          'A powdered acid blend typically used in confectionery to adjust acidity, enhance fruit flavors, or provide tartness. Common formulations include citric acid, malic acid, or a mixture of food-grade acids.',
        certifications: ['all-natural'],
        vegan: true,
        tags: ['acidifier', 'citric-acid', 'malic-acid', 'powder'],
        density: 1.66,
        category: 'other'
      },
      'apple-pectin': {
        baseId: 'apple-pectin',
        name: 'Apple Pectin',
        ganacheCharacteristics: {
          cacaoFat: 0,
          sugar: 0,
          milkFat: 0,
          water: 0,
          solids: 100,
          otherFats: 0
        },
        description:
          'A gelling agent extracted from apples, commonly used in confectionery to stabilize fruit ganaches, jams, and pâte de fruits. Provides structure by forming a gel network in the presence of sugar and acid.',
        certifications: ['all-natural'],
        vegan: true,
        tags: ['pectin', 'gelling-agent', 'apple-derived', 'stabilizer'],
        density: 1.45,
        category: 'other'
      },
      'passion-fruit-juice': {
        baseId: 'passion-fruit-juice',
        name: 'Passion Fruit Juice',
        ganacheCharacteristics: {
          cacaoFat: 0,
          sugar: 13,
          milkFat: 0,
          water: 82,
          solids: 5,
          otherFats: 0
        },
        description:
          'Juice extracted from passion fruit, known for its intense tropical acidity and aromatic floral–fruity notes. Commonly used in ganache, fruit fillings, and sorbets for its bright flavor and natural tartness.',
        certifications: ['all-natural'],
        vegan: true,
        tags: ['fruit-juice', 'tropical', 'acidic'],
        density: 1.05,
        category: 'liquid'
      },
      salt: {
        baseId: 'salt',
        name: 'Salt',
        ganacheCharacteristics: {
          cacaoFat: 0,
          sugar: 0,
          milkFat: 0,
          water: 0,
          solids: 100,
          otherFats: 0
        },
        description:
          'Food‑grade sodium chloride used to enhance flavor, balance sweetness, and sharpen acidity in ganache and confectionery.',
        certifications: ['all-natural'],
        vegan: true,
        tags: ['sodium-chloride', 'seasoning', 'mineral'],
        density: 2.16,
        category: 'other'
      },
      'hazelnut-praline-70-30': {
        baseId: 'hazelnut-praline-70-30',
        name: 'Hazelnut Praliné 70:30',
        ganacheCharacteristics: {
          cacaoFat: 0,
          sugar: 30,
          milkFat: 0,
          water: 0,
          solids: 20,
          otherFats: 50
        },
        description:
          'A classic hazelnut praliné made from 70% roasted hazelnuts and 30% caramelized sugar, ground into a smooth paste. Commonly used in ganache, gianduja, and fillings for its rich nut flavor and natural fat–sugar balance.',
        allergens: ['nuts'],
        certifications: ['all-natural'],
        vegan: true,
        tags: ['hazelnut', 'praline', 'nut-paste', 'gianduja-base'],
        density: 1.05,
        category: 'other'
      },
      'hazelnuts-roasted': {
        baseId: 'hazelnuts-roasted',
        name: 'Hazelnuts (Roasted)',
        ganacheCharacteristics: {
          cacaoFat: 0,
          sugar: 4,
          milkFat: 0,
          water: 2,
          solids: 34,
          otherFats: 60
        },
        description:
          'Whole hazelnuts that have been dry‑roasted to enhance aroma, deepen flavor, and reduce moisture. Commonly used in praliné, gianduja, nut pastes, and inclusions.',
        allergens: ['nuts'],
        certifications: ['all-natural'],
        vegan: true,
        tags: ['hazelnut', 'nut', 'roasted', 'inclusion'],
        density: 0.64,
        category: 'other'
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
 * Generated fillings collections from source YAML files.
 * @public
 */
export const fillingCollections: Record<string, JsonObject> = {
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
                  ids: ['common.heavy-cream-36'],
                  preferredId: 'common.heavy-cream-36'
                },
                amount: 200
              },
              {
                ingredient: {
                  ids: ['common.butter-82'],
                  preferredId: 'common.butter-82'
                },
                amount: 20,
                notes: [
                  {
                    category: 'user',
                    note: 'Added at 35°C for shine'
                  }
                ]
              }
            ],
            baseWeight: 620,
            yield: '~50 bonbons',
            notes: [
              {
                category: 'user',
                note: 'Standard 2:1 ratio with butter finish'
              }
            ],
            procedures: {
              options: [
                {
                  id: 'common.ganache-cold-method'
                }
              ],
              preferredId: 'common.ganache-cold-method'
            }
          }
        ],
        goldenVersionSpec: '2026-01-01-01'
      },
      'milk-ganache-classic': {
        baseId: 'milk-ganache-classic',
        name: 'Classic Milk Ganache',
        category: 'ganache',
        description:
          'Smooth milk chocolate ganache with caramel notes. Higher chocolate ratio compensates for milk solids.',
        tags: ['classic', 'milk', 'truffle', 'bonbon'],
        versions: [
          {
            versionSpec: '2026-01-01-01',
            createdDate: '2026-01-01',
            ingredients: [
              {
                ingredient: {
                  ids: ['guittard.soleil-dor-38'],
                  preferredId: 'guittard.soleil-dor-38'
                },
                amount: 350
              },
              {
                ingredient: {
                  ids: ['common.heavy-cream-36'],
                  preferredId: 'common.heavy-cream-36'
                },
                amount: 200
              },
              {
                ingredient: {
                  ids: ['common.butter-82'],
                  preferredId: 'common.butter-82'
                },
                amount: 20,
                notes: [
                  {
                    category: 'user',
                    note: 'Added at 35°C for shine'
                  }
                ]
              }
            ],
            baseWeight: 570,
            yield: '~45 bonbons',
            notes: [
              {
                category: 'user',
                note: '1.75:1 ratio for proper set with milk chocolate'
              }
            ],
            procedures: {
              options: [
                {
                  id: 'common.ganache-cold-method'
                }
              ],
              preferredId: 'common.ganache-cold-method'
            }
          }
        ],
        goldenVersionSpec: '2026-01-01-01'
      },
      'white-ganache-classic': {
        baseId: 'white-ganache-classic',
        name: 'Classic White Ganache',
        category: 'ganache',
        description:
          'Delicate white chocolate ganache with creamy vanilla notes. Higher chocolate ratio needed for proper emulsion and set.',
        tags: ['classic', 'white', 'truffle', 'bonbon'],
        versions: [
          {
            versionSpec: '2026-01-01-01',
            createdDate: '2026-01-01',
            ingredients: [
              {
                ingredient: {
                  ids: ['cacao-barry.zephyr-white-34'],
                  preferredId: 'cacao-barry.zephyr-white-34'
                },
                amount: 500
              },
              {
                ingredient: {
                  ids: ['common.heavy-cream-36'],
                  preferredId: 'common.heavy-cream-36'
                },
                amount: 200
              },
              {
                ingredient: {
                  ids: ['common.butter-82'],
                  preferredId: 'common.butter-82'
                },
                amount: 15,
                notes: [
                  {
                    category: 'user',
                    note: 'Added at 32°C for shine'
                  }
                ]
              }
            ],
            baseWeight: 715,
            yield: '~55 bonbons',
            notes: [
              {
                category: 'user',
                note: '2.5:1 ratio essential for white chocolate emulsion'
              }
            ],
            procedures: {
              options: [
                {
                  id: 'common.ganache-cold-method'
                }
              ],
              preferredId: 'common.ganache-cold-method'
            }
          }
        ],
        goldenVersionSpec: '2026-01-01-01'
      },
      'vegan-ganache-coconut-cream': {
        baseId: 'vegan-ganache-coconut-cream',
        name: 'Vegan Ganache (Coconut Cream)',
        category: 'ganache',
        description:
          'Dairy-free ganache using full-fat coconut cream. Subtle coconut undertones complement the dark chocolate.',
        tags: ['vegan', 'dairy-free', 'dark', 'coconut'],
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
                notes: [
                  {
                    category: 'user',
                    note: 'Use full-fat, refrigerate and use solid portion'
                  }
                ]
              }
            ],
            baseWeight: 600,
            yield: '~48 bonbons',
            notes: [
              {
                category: 'user',
                note: 'Coconut cream provides fat and moisture similar to dairy cream'
              }
            ],
            procedures: {
              options: [
                {
                  id: 'common.ganache-cold-method'
                }
              ],
              preferredId: 'common.ganache-cold-method'
            }
          }
        ],
        goldenVersionSpec: '2026-01-01-01'
      },
      'vegan-ganache-coconut-oil': {
        baseId: 'vegan-ganache-coconut-oil',
        name: 'Vegan Ganache (Coconut Oil)',
        category: 'ganache',
        description:
          'Dairy-free ganache using coconut oil and water. Neutral flavor profile lets chocolate shine.',
        tags: ['vegan', 'dairy-free', 'dark', 'neutral'],
        versions: [
          {
            versionSpec: '2026-01-01-01',
            createdDate: '2026-01-01',
            ingredients: [
              {
                ingredient: {
                  ids: ['cacao-barry.guayaquil-64'],
                  preferredId: 'cacao-barry.guayaquil-64'
                },
                amount: 400
              },
              {
                ingredient: {
                  ids: ['common.coconut-oil-deodorized'],
                  preferredId: 'common.coconut-oil-deodorized'
                },
                amount: 150,
                notes: [
                  {
                    category: 'user',
                    note: 'Melted, at 35°C'
                  }
                ]
              },
              {
                ingredient: {
                  ids: ['common.glucose-de43'],
                  preferredId: 'common.glucose-de43'
                },
                amount: 30,
                notes: [
                  {
                    category: 'user',
                    note: 'For texture and shelf life'
                  }
                ]
              }
            ],
            baseWeight: 580,
            yield: '~46 bonbons',
            notes: [
              {
                category: 'user',
                note: 'Oil-based method gives firmer set and neutral flavor'
              }
            ],
            procedures: {
              options: [
                {
                  id: 'common.ganache-cold-method'
                }
              ],
              preferredId: 'common.ganache-cold-method'
            }
          }
        ],
        goldenVersionSpec: '2026-01-01-01'
      },
      'caramelized-ganache': {
        baseId: 'caramelized-ganache',
        name: 'Caramelized Ganache',
        category: 'ganache',
        description:
          'Luxurious ganache made with caramelized white chocolate. Notes of dulce de leche and salted caramel.',
        tags: ['caramelized', 'blonde', 'truffle', 'bonbon', 'salted-caramel'],
        versions: [
          {
            versionSpec: '2026-01-01-01',
            createdDate: '2026-01-01',
            ingredients: [
              {
                ingredient: {
                  ids: ['cacao-barry.zephyr-caramel-35'],
                  preferredId: 'cacao-barry.zephyr-caramel-35'
                },
                amount: 450
              },
              {
                ingredient: {
                  ids: ['common.heavy-cream-36'],
                  preferredId: 'common.heavy-cream-36'
                },
                amount: 180
              },
              {
                ingredient: {
                  ids: ['common.butter-82'],
                  preferredId: 'common.butter-82'
                },
                amount: 20,
                notes: [
                  {
                    category: 'user',
                    note: 'Salted butter works beautifully here'
                  }
                ]
              }
            ],
            baseWeight: 650,
            yield: '~52 bonbons',
            notes: [
              {
                category: 'user',
                note: 'Slightly higher chocolate ratio for caramelized varieties'
              }
            ],
            procedures: {
              options: [
                {
                  id: 'common.ganache-cold-method'
                }
              ],
              preferredId: 'common.ganache-cold-method'
            }
          }
        ],
        goldenVersionSpec: '2026-01-01-01'
      },
      'gianduja-basic': {
        baseId: 'gianduja-basic',
        name: 'Basic Gianduja',
        category: 'gianduja',
        description: 'Classic Italian hazelnut-chocolate combination. Smooth, nutty, and luxurious.',
        tags: ['gianduja', 'hazelnut', 'italian', 'praline'],
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
                notes: [
                  {
                    category: 'user',
                    note: '100% roasted hazelnuts, finely ground'
                  }
                ]
              },
              {
                ingredient: {
                  ids: ['common.butter-82']
                },
                amount: 50,
                notes: [
                  {
                    category: 'user',
                    note: 'For smoothness'
                  }
                ]
              }
            ],
            baseWeight: 550,
            yield: '~44 bonbons',
            notes: [
              {
                category: 'user',
                note: 'Traditional 60:40 chocolate to hazelnut ratio'
              }
            ],
            procedures: {
              options: [
                {
                  id: 'common.gianduja'
                }
              ],
              preferredId: 'common.gianduja'
            }
          }
        ],
        goldenVersionSpec: '2026-01-01-01'
      }
    }
  },
  fgv: {
    format: 'encrypted-collection-v1',
    secretName: 'fgv',
    algorithm: 'AES-256-GCM',
    iv: '+M1nBhsOYZuPR8VP',
    authTag: 'DkW+F3s3/42gyEuDRR0AAg==',
    encryptedData:
      '1NSE2pdIwbMOUyb6xwfhZmRNLQYH5ZGbIAUwUbk5PQAtdGsCKLmkTqeAWwNmeT6uMyNK6ZuOfb/Ffl0hW0aDbTdqD8KZlL3z9OlmOk+pKeTY3ELPAxQAkKxvyQaz1W1ogwxCVvMoQSfQDsXeMCTlqgFDkS26gC9BB8OYF05Qr7DLCSiK7EbmccCA3UyYYZVjZeZQziMdo7Ll8jnIXiiRzgd9aRgMmFKR2d5V6sdi2Fl7qK/+H0lQF72Y0WBe5UuUVZsr3JzZkOrp65NLSpx4Zhg6W9aljEFdPf2mNzmcxalWZxr6CQpTsi2OlDmWuhq0ECRZMZfY5Ylv+eL9dgrs56jL9pPx0scZvlYEsPIsT9murWWr4KLvLP/JTvGQcYZc14MKCFfhqUVpilrY2zIceINsmHRKU3LVQhKxGKZz3tF9f47isndgknmcKGFe9rqyoSducsOK9r3HF6PL+N7eZEWi7JoWBXEX0kMswxxoGqF8vSw3jaKwkVXV6McORulndVUcTa1iZol+sdsi/ZPfuA2fdpYtX2CCYjxzhM9LXjx6TjICwPTw3cmYcuzImlQgE8ZIu2OKpFbV/EfR6MjBvwckb357YNGIBGkfo45UAL5FgXuE8GhEoD12mjNEs4xNjvQN8sSxNyemhkRZ58lbDV+8mXIvipKdAGCBuxVnlvf1ySrVvCGlmZ5WRCP9lMnk6pj75UjGaTqn+dIbL68hXn+hqowMROf1drUXGzXhMwlAqv13PhJPlp3PTiYqtL0BYv/yOkbP/zyJ5sBlU1CUhywmtz/bq4wT+mfrIORvA93/QuRsGihLj4B3C9t1YvMpMrbHc/QxFqM77yIYLjU+6xQzRsbIUa/sN9qLrUeGpIS1/VGeaQJ/DpHFWNWXThIfousJd6OGmLxViP5jDIIr5+qHDEuuX5JBolPDRLwZi7vyDAmdGNv8WsFhBgJxzPnlFjU//25UFiuNAn1SGku71yWPDoqPl+xskYrQUc/r/no3Og861zPK3MW/F1irDrF59hZufaOA7CUoOIP3iaVhk9jj+WMtEH/OcsaxiuqUbfJ8DHgQ9R7qv+ZpNAzs56K4h5wkyaXWI5DDPJUScYCH4hi4VrKyOvsTxgEZntMWikbbzRJAl+OBJ7lZfR65n0AG',
    keyDerivation: {
      kdf: 'pbkdf2',
      salt: 'b66D4cOQ+u16mkzWNuayRw==',
      iterations: 100000
    }
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
        cavities: {
          kind: 'count',
          count: 24,
          info: {
            weight: 8,
            dimensions: {
              width: 25,
              length: 25,
              depth: 12
            }
          }
        },
        format: 'series-2000',
        tags: ['dome', 'hemisphere', 'truffle'],
        notes: [
          {
            category: 'user',
            note: 'Standard 25mm dome for truffles'
          }
        ]
      },
      'dome-30mm': {
        baseId: 'dome-30mm',
        manufacturer: 'Generic',
        productNumber: 'DOME-30',
        description: '30mm hemisphere dome',
        cavities: {
          kind: 'count',
          count: 15,
          info: {
            weight: 14,
            dimensions: {
              width: 30,
              length: 30,
              depth: 15
            }
          }
        },
        format: 'series-2000',
        tags: ['dome', 'hemisphere', 'truffle'],
        notes: [
          {
            category: 'user',
            note: 'Standard 30mm dome for larger truffles'
          }
        ]
      },
      'bullet-28mm': {
        baseId: 'bullet-28mm',
        manufacturer: 'Generic',
        productNumber: 'BULLET-28',
        description: '28mm bullet/ogive shape',
        cavities: {
          kind: 'count',
          count: 21,
          info: {
            weight: 10,
            dimensions: {
              width: 28,
              length: 28,
              depth: 18
            }
          }
        },
        format: 'series-2000',
        tags: ['bullet', 'ogive', 'praline'],
        notes: [
          {
            category: 'user',
            note: 'Classic bullet shape for pralines'
          }
        ]
      },
      'square-25mm': {
        baseId: 'square-25mm',
        manufacturer: 'Generic',
        productNumber: 'SQ-25',
        description: '25mm square',
        cavities: {
          kind: 'count',
          count: 24,
          info: {
            weight: 10,
            dimensions: {
              width: 25,
              length: 25,
              depth: 16
            }
          }
        },
        format: 'series-2000',
        tags: ['square', 'geometric'],
        notes: [
          {
            category: 'user',
            note: 'Simple square mold for ganache'
          }
        ]
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
        cavities: {
          kind: 'count',
          count: 32,
          info: {
            weight: 10,
            dimensions: {
              width: 30,
              length: 30,
              depth: 16
            }
          }
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
            task: {
              task: {
                baseId: 'ganache-cold-method-step-1',
                name: 'Melt Chocolate',
                template: 'Melt chocolate to 40-45C'
              },
              params: {}
            },
            activeTime: 5,
            temperature: 45
          },
          {
            order: 2,
            task: {
              task: {
                baseId: 'ganache-cold-method-step-2',
                name: 'Warm Cream',
                template: 'Warm cream to 35C'
              },
              params: {}
            },
            activeTime: 3,
            temperature: 35
          },
          {
            order: 3,
            task: {
              task: {
                baseId: 'ganache-cold-method-step-3',
                name: 'Combine and Emulsify',
                template: 'Combine and emulsify with immersion blender'
              },
              params: {}
            },
            activeTime: 5
          },
          {
            order: 4,
            task: {
              task: {
                baseId: 'ganache-cold-method-step-4',
                name: 'Add Butter',
                template: 'Add butter at 35C and blend until smooth'
              },
              params: {}
            },
            activeTime: 2,
            temperature: 35
          },
          {
            order: 5,
            task: {
              task: {
                baseId: 'ganache-cold-method-step-5',
                name: 'Rest',
                template: 'Rest at room temperature'
              },
              params: {}
            },
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
            task: {
              task: {
                baseId: 'ganache-hot-method-step-1',
                name: 'Boil Cream',
                template: 'Bring cream to boil'
              },
              params: {}
            },
            activeTime: 5,
            temperature: 100
          },
          {
            order: 2,
            task: {
              task: {
                baseId: 'ganache-hot-method-step-2',
                name: 'Pour Over Chocolate',
                template: 'Pour over finely chopped chocolate'
              },
              params: {}
            },
            activeTime: 1
          },
          {
            order: 3,
            task: {
              task: {
                baseId: 'ganache-hot-method-step-3',
                name: 'Let Stand',
                template: 'Let stand 1-2 minutes'
              },
              params: {}
            },
            waitTime: 2
          },
          {
            order: 4,
            task: {
              task: {
                baseId: 'ganache-hot-method-step-4',
                name: 'Stir to Emulsify',
                template: 'Stir from center outward to emulsify'
              },
              params: {}
            },
            activeTime: 5
          },
          {
            order: 5,
            task: {
              task: {
                baseId: 'ganache-hot-method-step-5',
                name: 'Add Butter',
                template: 'Add butter and blend until smooth'
              },
              params: {}
            },
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
            task: {
              task: {
                baseId: 'gianduja-step-1',
                name: 'Roast Hazelnuts',
                template: 'Roast hazelnuts at 150C until golden'
              },
              params: {}
            },
            activeTime: 15,
            temperature: 150
          },
          {
            order: 2,
            task: {
              task: {
                baseId: 'gianduja-step-2',
                name: 'Remove Skins',
                template: 'Rub off skins while warm'
              },
              params: {}
            },
            activeTime: 5
          },
          {
            order: 3,
            task: {
              task: {
                baseId: 'gianduja-step-3',
                name: 'Grind to Paste',
                template: 'Grind to paste in food processor'
              },
              params: {}
            },
            activeTime: 10
          },
          {
            order: 4,
            task: {
              task: {
                baseId: 'gianduja-step-4',
                name: 'Melt Chocolate',
                template: 'Melt chocolate to 45C'
              },
              params: {}
            },
            activeTime: 5,
            temperature: 45
          },
          {
            order: 5,
            task: {
              task: {
                baseId: 'gianduja-step-5',
                name: 'Combine',
                template: 'Combine paste and chocolate, mix until smooth'
              },
              params: {}
            },
            activeTime: 5
          },
          {
            order: 6,
            task: {
              task: {
                baseId: 'gianduja-step-6',
                name: 'Temper and Mold',
                template: 'Temper and pour into molds'
              },
              params: {}
            },
            activeTime: 15
          }
        ],
        tags: ['gianduja', 'hazelnut', 'nut-paste']
      },
      'shell-bonbon-method': {
        baseId: 'shell-bonbon-method',
        name: 'Shell Bonbon Method',
        category: 'molded-bonbon',
        steps: [
          {
            order: 1,
            task: {
              task: {
                baseId: 'shell-bonbon-step-1',
                name: 'Temper Chocolate',
                template: 'Temper chocolate using preferred method'
              },
              params: {}
            },
            activeTime: 15,
            temperature: 31
          },
          {
            order: 2,
            task: {
              task: {
                baseId: 'shell-bonbon-step-2',
                name: 'Fill Molds',
                template: 'Fill molds completely with tempered chocolate'
              },
              params: {}
            },
            activeTime: 5
          },
          {
            order: 3,
            task: {
              task: {
                baseId: 'shell-bonbon-step-3',
                name: 'Invert and Drain',
                template: 'Invert molds over bowl, tap to drain excess'
              },
              params: {}
            },
            activeTime: 3
          },
          {
            order: 4,
            task: {
              task: {
                baseId: 'shell-bonbon-step-4',
                name: 'Scrape and Chill',
                template: 'Scrape excess from mold surface, refrigerate until set'
              },
              params: {}
            },
            activeTime: 2,
            waitTime: 10,
            temperature: 16
          },
          {
            order: 5,
            task: {
              task: {
                baseId: 'shell-bonbon-step-5',
                name: 'Pipe Filling',
                template: 'Pipe ganache filling to 2mm below rim'
              },
              params: {}
            },
            activeTime: 10
          },
          {
            order: 6,
            task: {
              task: {
                baseId: 'shell-bonbon-step-6',
                name: 'Crystallize Filling',
                template: 'Allow filling to crystallize at room temperature'
              },
              params: {}
            },
            waitTime: 60,
            temperature: 18
          },
          {
            order: 7,
            task: {
              task: {
                baseId: 'shell-bonbon-step-7',
                name: 'Seal Bonbons',
                template: 'Apply tempered chocolate to seal, scrape excess'
              },
              params: {}
            },
            activeTime: 5
          },
          {
            order: 8,
            task: {
              task: {
                baseId: 'shell-bonbon-step-8',
                name: 'Final Set and Unmold',
                template: 'Refrigerate briefly, then unmold by inverting'
              },
              params: {}
            },
            waitTime: 15,
            temperature: 16
          }
        ],
        tags: ['molded', 'bonbon', 'shell', 'confection']
      },
      'enrobe-truffle-method': {
        baseId: 'enrobe-truffle-method',
        name: 'Enrobe Truffle Method',
        category: 'bar-truffle',
        steps: [
          {
            order: 1,
            task: {
              task: {
                baseId: 'enrobe-truffle-step-1',
                name: 'Frame Ganache',
                template: 'Pour ganache into frame at proper temperature'
              },
              params: {}
            },
            activeTime: 5,
            temperature: 28
          },
          {
            order: 2,
            task: {
              task: {
                baseId: 'enrobe-truffle-step-2',
                name: 'Level and Set',
                template: 'Level surface with offset spatula, allow to crystallize'
              },
              params: {}
            },
            activeTime: 2,
            waitTime: 120,
            temperature: 18
          },
          {
            order: 3,
            task: {
              task: {
                baseId: 'enrobe-truffle-step-3',
                name: 'Pre-coat Bottom',
                template: 'Apply thin layer of tempered chocolate to bottom'
              },
              params: {}
            },
            activeTime: 5,
            temperature: 31
          },
          {
            order: 4,
            task: {
              task: {
                baseId: 'enrobe-truffle-step-4',
                name: 'Cut Pieces',
                template: 'Cut ganache slab into uniform pieces with guitar cutter or knife'
              },
              params: {}
            },
            activeTime: 10
          },
          {
            order: 5,
            task: {
              task: {
                baseId: 'enrobe-truffle-step-5',
                name: 'Enrobe',
                template: 'Dip pieces in tempered chocolate using dipping fork'
              },
              params: {}
            },
            activeTime: 20,
            temperature: 31
          },
          {
            order: 6,
            task: {
              task: {
                baseId: 'enrobe-truffle-step-6',
                name: 'Decorate and Set',
                template: 'Apply decoration while coating is wet, allow to set'
              },
              params: {}
            },
            activeTime: 5,
            waitTime: 15,
            temperature: 18
          }
        ],
        tags: ['enrobed', 'truffle', 'bar', 'confection']
      },
      'roll-and-coat-method': {
        baseId: 'roll-and-coat-method',
        name: 'Roll and Coat Truffle Method',
        category: 'rolled-truffle',
        steps: [
          {
            order: 1,
            task: {
              task: {
                baseId: 'roll-coat-step-1',
                name: 'Chill Ganache',
                template: 'Refrigerate ganache until firm but scoopable'
              },
              params: {}
            },
            waitTime: 60,
            temperature: 14
          },
          {
            order: 2,
            task: {
              task: {
                baseId: 'roll-coat-step-2',
                name: 'Portion Ganache',
                template: 'Scoop uniform portions using small ice cream scoop or melon baller'
              },
              params: {}
            },
            activeTime: 15
          },
          {
            order: 3,
            task: {
              task: {
                baseId: 'roll-coat-step-3',
                name: 'Roll into Balls',
                template: 'Roll portions between palms quickly to form spheres'
              },
              params: {}
            },
            activeTime: 15,
            notes: [
              {
                category: 'user',
                note: 'Work quickly to prevent melting from hand heat'
              }
            ]
          },
          {
            order: 4,
            task: {
              task: {
                baseId: 'roll-coat-step-4',
                name: 'Chill Balls',
                template: 'Refrigerate rolled balls until firm'
              },
              params: {}
            },
            waitTime: 30,
            temperature: 14
          },
          {
            order: 5,
            task: {
              task: {
                baseId: 'roll-coat-step-5',
                name: 'Apply Coating',
                template: 'Roll in coating (cocoa powder, nuts, etc.) to cover completely'
              },
              params: {}
            },
            activeTime: 10
          },
          {
            order: 6,
            task: {
              task: {
                baseId: 'roll-coat-step-6',
                name: 'Final Rest',
                template: 'Allow to temper at room temperature before serving'
              },
              params: {}
            },
            waitTime: 30,
            temperature: 18
          }
        ],
        tags: ['rolled', 'truffle', 'coated', 'confection']
      }
    }
  }
};

/**
 * Generated task collections from source YAML files.
 * @public
 */
export const taskCollections: Record<string, JsonObject> = {
  common: {
    metadata: {
      name: 'Common Tasks',
      description: 'Reusable task templates for chocolate-making'
    },
    items: {
      'melt-chocolate': {
        baseId: 'melt-chocolate',
        name: 'Melt Chocolate',
        template: 'Melt {{ingredient}} to {{temp}}',
        defaults: {
          ingredient: 'chocolate',
          temp: '40C'
        },
        defaultActiveTime: 5,
        tags: ['chocolate', 'melting', 'heating']
      },
      'heat-ingredient': {
        baseId: 'heat-ingredient',
        name: 'Heat Ingredient',
        template: 'Heat {{ingredient}} to {{temp}}C',
        defaultActiveTime: 3,
        tags: ['heating']
      },
      'warm-ingredient': {
        baseId: 'warm-ingredient',
        name: 'Warm Ingredient',
        template: 'Warm {{ingredient}} to {{temp}}C',
        defaultActiveTime: 3,
        tags: ['heating', 'warming']
      },
      'bring-to-boil': {
        baseId: 'bring-to-boil',
        name: 'Bring to Boil',
        template: 'Bring {{ingredient}} to boil',
        defaultActiveTime: 5,
        defaultTemperature: 100,
        tags: ['heating', 'boiling']
      },
      'combine-and-emulsify': {
        baseId: 'combine-and-emulsify',
        name: 'Combine and Emulsify',
        template: 'Combine {{ingredients}} and emulsify{{#tool}} with {{tool}}{{/tool}}',
        defaultActiveTime: 5,
        tags: ['mixing', 'emulsion']
      },
      'stir-to-emulsify': {
        baseId: 'stir-to-emulsify',
        name: 'Stir to Emulsify',
        template: 'Stir from center outward to emulsify',
        defaultActiveTime: 5,
        tags: ['mixing', 'emulsion', 'stirring']
      },
      'add-and-blend': {
        baseId: 'add-and-blend',
        name: 'Add and Blend',
        template: 'Add {{ingredient}} at {{temp}}C and blend until smooth',
        defaultActiveTime: 2,
        tags: ['mixing', 'blending']
      },
      'blend-until-smooth': {
        baseId: 'blend-until-smooth',
        name: 'Blend Until Smooth',
        template: 'Add {{ingredient}} and blend until smooth',
        defaultActiveTime: 2,
        tags: ['mixing', 'blending']
      },
      'combine-and-mix': {
        baseId: 'combine-and-mix',
        name: 'Combine and Mix',
        template: 'Combine {{ingredients}}, mix until smooth',
        defaultActiveTime: 5,
        tags: ['mixing']
      },
      'pour-over': {
        baseId: 'pour-over',
        name: 'Pour Over',
        template: 'Pour {{source}} over {{target}}',
        defaultActiveTime: 1,
        tags: ['pouring', 'transferring']
      },
      'rest-at-temperature': {
        baseId: 'rest-at-temperature',
        name: 'Rest at Temperature',
        template: 'Rest at {{temp}}',
        tags: ['resting', 'waiting']
      },
      'let-stand': {
        baseId: 'let-stand',
        name: 'Let Stand',
        template: 'Let stand {{duration}} minutes',
        tags: ['resting', 'waiting']
      },
      'roast-nuts': {
        baseId: 'roast-nuts',
        name: 'Roast Nuts',
        template: 'Roast {{nuts}} at {{temp}}C until golden',
        defaultActiveTime: 15,
        tags: ['roasting', 'nuts']
      },
      'remove-skins': {
        baseId: 'remove-skins',
        name: 'Remove Skins',
        template: 'Rub off skins while warm',
        defaultActiveTime: 5,
        tags: ['preparation', 'nuts']
      },
      'grind-to-paste': {
        baseId: 'grind-to-paste',
        name: 'Grind to Paste',
        template: 'Grind {{ingredient}} to paste in food processor',
        defaultActiveTime: 10,
        tags: ['grinding', 'processing']
      },
      'temper-and-mold': {
        baseId: 'temper-and-mold',
        name: 'Temper and Mold',
        template: 'Temper and pour into molds',
        defaultActiveTime: 15,
        tags: ['tempering', 'molding']
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
        versions: [
          {
            versionSpec: '2026-01-01-01',
            createdDate: '2026-01-01',
            notes: [
              {
                category: 'user',
                note: 'Basic dome bonbon with dark ganache filling'
              }
            ],
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
            procedures: {
              options: [
                {
                  id: 'common.shell-bonbon-method'
                }
              ],
              preferredId: 'common.shell-bonbon-method'
            },
            decorations: [
              {
                description: 'Gold leaf accent on dome peak',
                preferred: true
              },
              {
                description: 'Cocoa butter transfer sheet design'
              }
            ]
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
        versions: [
          {
            versionSpec: '2026-01-01-01',
            createdDate: '2026-01-01',
            notes: [
              {
                category: 'user',
                note: 'Standard 25mm square bar truffles'
              }
            ],
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
            procedures: {
              options: [
                {
                  id: 'common.enrobe-truffle-method'
                }
              ],
              preferredId: 'common.enrobe-truffle-method'
            },
            decorations: [
              {
                description: 'Dipping fork wave pattern',
                preferred: true
              },
              {
                description: 'Cocoa powder light dusting'
              }
            ]
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
        versions: [
          {
            versionSpec: '2026-01-01-01',
            createdDate: '2026-01-01',
            notes: [
              {
                category: 'user',
                note: 'Traditional rolled truffle with cocoa coating'
              }
            ],
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
            procedures: {
              options: [
                {
                  id: 'common.roll-and-coat-method'
                }
              ],
              preferredId: 'common.roll-and-coat-method'
            }
          }
        ]
      }
    }
  }
};
/* eslint-enable @typescript-eslint/naming-convention */
