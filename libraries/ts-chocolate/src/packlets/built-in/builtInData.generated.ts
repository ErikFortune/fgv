// AUTO-GENERATED FILE - DO NOT EDIT DIRECTLY
// Run 'rushx build:data' to regenerate from source YAML files
//
// Source files:
//   - data/published/ingredients/alcohol.yaml
//   - data/published/ingredients/cacao-barry.yaml
//   - data/published/ingredients/callebaut.yaml
//   - data/published/ingredients/common.yaml
//   - data/published/ingredients/decorations.yaml
//   - data/published/ingredients/felchlin.yaml
//   - data/published/ingredients/flavors.yaml
//   - data/published/ingredients/guittard.yaml
//   - data/published/fillings/common.yaml
//   - data/published/molds/common.yaml
//   - data/published/molds/cw.yaml
//   - data/published/molds/greyas.yaml
//   - data/published/molds/implast.yaml
//   - data/published/molds/martellato.yaml
//   - data/published/molds/other.yaml
//   - data/published/procedures/common.yaml
//   - data/published/tasks/common.yaml
//   - data/published/confections/common.yaml
//   - data/published/decorations/common.yaml

/* eslint-disable max-lines */
import { JsonObject } from '@fgv/ts-json-base';

/* eslint-disable @typescript-eslint/naming-convention */
/**
 * Generated ingredient collections from source YAML files.
 * @public
 */
export const ingredientCollections: Record<string, JsonObject> = {
  alcohol: {
    metadata: {
      name: 'Alcohol'
    },
    items: {
      'amarula-cream-liqueur': {
        baseId: 'amarula-cream-liqueur',
        name: 'Amarula Cream Liqueur',
        ganacheCharacteristics: {
          cacaoFat: 0,
          sugar: 14,
          milkFat: 8,
          water: 60,
          solids: 3,
          otherFats: 15
        },
        description:
          'A cream liqueur from South Africa made from the fruit of the marula tree (Sclerocarya birrea). The liqueur has a smooth, creamy texture with flavors of caramel, vanilla, and exotic fruit. The marula fruit is fermented and distilled, then blended with cream and aged in oak barrels for two years.',
        manufacturer: 'Distell Group Limited',
        allergens: ['milk'],
        traceAllergens: [],
        certifications: [],
        vegan: false,
        tags: [
          'cream liqueur',
          'south african',
          'marula',
          'liqueur',
          'alcohol',
          'dairy liqueur',
          'exotic fruit'
        ],
        density: 1.05,
        phase: 'liquid',
        measurementUnits: {
          options: [
            {
              id: 'mL'
            },
            {
              id: 'g'
            },
            {
              id: 'Tbsp'
            },
            {
              id: 'tsp'
            }
          ],
          preferredId: 'mL'
        },
        urls: [
          {
            category: 'manufacturer',
            url: 'https://www.amarula.com'
          }
        ],
        notes: [
          {
            category: 'ai',
            note: 'Ganache characteristics estimated based on typical cream liqueur composition: approximately 17% ABV (alcohol/water mix ~60% water), cream content contributing ~8% milk fat and ~15% other fats, sugar content ~14%, and remaining solids ~3%. These percentages are estimates based on standard cream liqueur formulations and may vary slightly from the actual product composition.'
          },
          {
            category: 'ai',
            note: 'Density estimated at 1.05 g/mL based on typical cream liqueur density, which is slightly higher than water due to sugar and cream content but lower than pure cream due to alcohol content.'
          },
          {
            category: 'usage',
            note: 'When using in ganache, the alcohol and high water content must be carefully balanced. The cream component adds richness but also increases perishability. Consider reducing other liquid ingredients proportionally.'
          }
        ],
        category: 'alcohol',
        alcoholByVolume: 17,
        flavorProfile:
          'Rich and creamy with notes of caramel, vanilla, and exotic marula fruit. Smooth texture with a sweet finish and subtle hints of toasted oak from barrel aging.'
      },
      'baileys-irish-cream': {
        baseId: 'baileys-irish-cream',
        name: "Bailey's Irish Cream",
        ganacheCharacteristics: {
          cacaoFat: 0,
          sugar: 20,
          milkFat: 13,
          water: 50,
          solids: 12,
          otherFats: 5
        },
        description:
          "A premium Irish cream liqueur made with Irish whiskey, cream, and cocoa. Bailey's is a sweet, creamy liqueur with notes of vanilla, chocolate, and caramel. It's commonly used in ganaches, truffles, and dessert applications to add both alcohol flavor and dairy richness.",
        manufacturer: 'Diageo',
        allergens: ['milk'],
        traceAllergens: [],
        certifications: [],
        vegan: false,
        tags: ['irish-cream', 'liqueur', 'whiskey', 'cream-based', 'dessert-alcohol'],
        density: 1.05,
        phase: 'liquid',
        measurementUnits: {
          options: [
            {
              id: 'g'
            },
            {
              id: 'mL'
            },
            {
              id: 'tsp'
            },
            {
              id: 'Tbsp'
            }
          ],
          preferredId: 'mL'
        },
        urls: [
          {
            category: 'manufacturer',
            url: 'https://www.baileys.com'
          }
        ],
        notes: [
          {
            category: 'ai',
            note: "Ganache characteristics estimated based on Bailey's composition: approximately 13% cream fat, 17% alcohol (as water equivalent for ganache purposes), 20% sugar, with remaining being milk solids, whiskey solids, and flavoring compounds. The alcoholByVolume is the actual ABV of the product (17%). Water content in ganacheCharacteristics includes the water component of the alcohol for ganache ratio calculations."
          },
          {
            category: 'ai',
            note: 'Density estimated at 1.05 g/mL based on typical cream liqueur specifications.'
          }
        ],
        category: 'alcohol',
        alcoholByVolume: 17,
        flavorProfile:
          'Sweet and creamy with notes of Irish whiskey, vanilla, chocolate, and caramel. Smooth, velvety texture with a warming alcohol finish.'
      },
      chambord: {
        baseId: 'chambord',
        name: 'Chambord',
        ganacheCharacteristics: {
          cacaoFat: 0,
          sugar: 18,
          milkFat: 0,
          water: 65,
          solids: 2,
          otherFats: 15
        },
        description:
          'Chambord is a premium black raspberry liqueur from the Loire Valley, France, made with black raspberries, blackberries, Madagascar vanilla, cognacs, honey, and secret macerates. It offers a rich, fruity profile ideal for infusing ganaches, mousses, and cocktails.',
        manufacturer: 'Brown-Forman',
        allergens: [],
        traceAllergens: [],
        certifications: [],
        vegan: false,
        tags: ['liqueur', 'raspberry', 'fruity', 'vanilla', 'cognac', 'blackberry'],
        density: 1.05,
        phase: 'liquid',
        measurementUnits: {
          options: [
            {
              id: 'mL'
            },
            {
              id: 'tsp'
            },
            {
              id: 'Tbsp'
            }
          ],
          preferredId: 'mL'
        },
        urls: [
          {
            category: 'official',
            url: 'https://www.chambordusa.com/'
          }
        ],
        notes: [
          {
            category: 'ai',
            note: 'Ganache characteristics are estimates for use in chocolate ganache recipes: water as base solvent, sugar from sweeteners (incl. honey), minimal solids from fruit extracts and vanilla, otherFats approximating ethanol and minor oils (alcohol not a fat but grouped here for schema). Percentages sum to 100. Vegan=false due to honey. Density estimated from similar sugared liqueurs. No major allergens from provided enum.'
          }
        ],
        category: 'alcohol',
        alcoholByVolume: 16.5,
        flavorProfile:
          'Intense black raspberry and blackberry with smooth cognac, Madagascar vanilla, subtle honey, and hints of currant and violet.'
      },
      'grand-marnier': {
        baseId: 'grand-marnier',
        name: 'Grand Marnier',
        ganacheCharacteristics: {
          cacaoFat: 0,
          sugar: 25,
          milkFat: 0,
          water: 70,
          solids: 5,
          otherFats: 0
        },
        description:
          'Grand Marnier is a premium French orange liqueur created in 1880. It blends fine Cognac brandy with the distilled essence of bitter oranges and a touch of sugar, offering a rich, complex flavor profile ideal for flavoring ganaches, truffles, creams, and other chocolate confections.',
        manufacturer: 'Société des Produits Marnier-Lapostolle',
        allergens: [],
        traceAllergens: [],
        certifications: [],
        vegan: true,
        tags: ['orange', 'liqueur', 'brandy', 'cognac', 'french', 'citrus', 'premium'],
        density: 1.07,
        phase: 'liquid',
        measurementUnits: {
          options: [
            {
              id: 'mL'
            },
            {
              id: 'tsp'
            },
            {
              id: 'Tbsp'
            }
          ],
          preferredId: 'mL'
        },
        urls: [
          {
            category: 'official',
            url: 'https://www.grandmarnier.com/'
          }
        ],
        notes: [
          {
            category: 'ai',
            note: "Ganache characteristics estimated: 'water' (70%) includes water + ethanol (~32% wt from 40% ABV, density-adjusted); sugar (25%) based on typical liqueur Brix/sweetness for Grand Marnier (~200-250g/L); solids (5%) for orange essences, trace flavors, and impurities. No fats present. Density estimated from ABV and sugar content. Confirmed gluten-free as distilled spirit; no other allergens detected."
          }
        ],
        category: 'alcohol',
        alcoholByVolume: 40,
        flavorProfile: 'Intense bitter orange with Cognac brandy undertones, vanilla, and subtle spice notes.'
      },
      cointreau: {
        baseId: 'cointreau',
        name: 'Cointreau',
        ganacheCharacteristics: {
          cacaoFat: 0,
          sugar: 10,
          milkFat: 0,
          water: 30,
          solids: 0,
          otherFats: 0
        },
        description:
          "Cointreau is a brand of triple sec, an orange-flavored liqueur produced in Saint-Barthélemy-d'Anjou, France. It is used in a wide variety of cocktails and culinary applications.",
        manufacturer: 'Rémy Cointreau',
        vegan: true,
        tags: ['liqueur', 'orange', 'triple sec', 'French'],
        density: 1.1,
        phase: 'liquid',
        measurementUnits: {
          options: [
            {
              id: 'mL'
            },
            {
              id: 'g'
            },
            {
              id: 'Tbsp'
            },
            {
              id: 'tsp'
            }
          ],
          preferredId: 'mL'
        },
        urls: [
          {
            category: 'official',
            url: 'https://www.cointreau.com'
          }
        ],
        notes: [
          {
            category: 'ai',
            note: 'The ganacheCharacteristics percentages are estimated based on typical liqueur compositions. Exact values may vary.'
          }
        ],
        category: 'alcohol',
        alcoholByVolume: 40,
        flavorProfile: 'Sweet and zesty orange with a hint of bitterness'
      },
      rum: {
        baseId: 'rum',
        name: 'Rum',
        ganacheCharacteristics: {
          cacaoFat: 0,
          sugar: 0,
          milkFat: 0,
          water: 60,
          solids: 0,
          otherFats: 0
        },
        description:
          'Rum is a distilled alcoholic beverage made from sugarcane byproducts, such as molasses, or directly from sugarcane juice, through a process of fermentation and distillation.',
        manufacturer: 'Various',
        traceAllergens: [],
        certifications: ['gluten-free', 'vegan'],
        vegan: true,
        tags: ['caribbean', 'distilled', 'aged'],
        density: 0.95,
        phase: 'liquid',
        measurementUnits: {
          options: [
            {
              id: 'mL'
            },
            {
              id: 'g'
            },
            {
              id: 'tsp'
            },
            {
              id: 'Tbsp'
            }
          ],
          preferredId: 'mL'
        },
        urls: [],
        notes: [
          {
            category: 'ai',
            note: 'The ganache characteristics are estimated based on typical rum composition, assuming 40% ABV and 60% water content. The flavor profile is generalized and may vary between different brands and types of rum.'
          }
        ],
        category: 'alcohol',
        alcoholByVolume: 40,
        flavorProfile: 'Aged, sweet, and spicy with notes of vanilla, caramel, and oak'
      },
      bourbon: {
        baseId: 'bourbon',
        name: 'Bourbon',
        ganacheCharacteristics: {
          cacaoFat: 0,
          sugar: 0,
          milkFat: 0,
          water: 60,
          solids: 0,
          otherFats: 0
        },
        manufacturer: 'Various distilleries',
        certifications: ['non-gmo'],
        tags: ['whiskey', 'spirit', 'oak-aged'],
        density: 0.95,
        phase: 'liquid',
        measurementUnits: {
          options: [
            {
              id: 'mL'
            },
            {
              id: 'g'
            },
            {
              id: 'tsp'
            },
            {
              id: 'Tbsp'
            }
          ],
          preferredId: 'mL'
        },
        urls: [
          {
            category: 'information',
            url: 'https://en.wikipedia.org/wiki/Bourbon_whiskey'
          }
        ],
        notes: [
          {
            category: 'ai',
            note: 'Assumed typical ABV of bourbon as 40% and estimated water content. Flavor profile generalized based on typical bourbon characteristics.'
          }
        ],
        category: 'alcohol',
        alcoholByVolume: 40,
        flavorProfile: 'Rich and oaky with notes of vanilla and caramel'
      },
      whiskey: {
        baseId: 'whiskey',
        name: 'Whiskey',
        ganacheCharacteristics: {
          cacaoFat: 0,
          sugar: 0,
          milkFat: 0,
          water: 40,
          solids: 0,
          otherFats: 0
        },
        description:
          'Whiskey is a distilled alcoholic beverage made from fermented grain mash, often aged in wooden casks.',
        manufacturer: 'Various',
        tags: ['spirits', 'flavor', 'distilled'],
        density: 0.95,
        phase: 'liquid',
        measurementUnits: {
          options: [
            {
              id: 'mL'
            },
            {
              id: 'g'
            },
            {
              id: 'Tbsp'
            },
            {
              id: 'tsp'
            }
          ],
          preferredId: 'mL'
        },
        notes: [
          {
            category: 'ai',
            note: 'Alcohol by volume and water content are estimated based on typical whiskey composition. Flavor profile is generalized and may vary depending on specific whiskey brand.'
          }
        ],
        category: 'alcohol',
        alcoholByVolume: 40,
        flavorProfile: 'Rich, smoky, and oaky with hints of caramel and vanilla.'
      },
      'almond-liqueur': {
        baseId: 'almond-liqueur',
        name: 'Almond Liqueur',
        ganacheCharacteristics: {
          cacaoFat: 0,
          sugar: 20,
          milkFat: 0,
          water: 30,
          solids: 0,
          otherFats: 50
        },
        description:
          'A sweet, nutty liqueur made from almonds, often used in baking and confectionery for its distinct flavor.',
        tags: ['nutty', 'sweet', 'liqueur', 'almond'],
        phase: 'liquid',
        measurementUnits: {
          options: [
            {
              id: 'mL'
            },
            {
              id: 'g'
            },
            {
              id: 'tsp'
            },
            {
              id: 'Tbsp'
            }
          ],
          preferredId: 'mL'
        },
        notes: [
          {
            category: 'ai',
            note: 'Assumed typical composition for an almond liqueur. Exact sugar and fat content may vary by brand.'
          }
        ],
        category: 'alcohol',
        alcoholByVolume: 25,
        flavorProfile: 'Sweet, nutty almond flavor with a hint of vanilla.'
      },
      amaretto: {
        baseId: 'amaretto',
        name: 'Amaretto',
        ganacheCharacteristics: {
          cacaoFat: 0,
          sugar: 20,
          milkFat: 0,
          water: 10,
          solids: 10,
          otherFats: 0
        },
        description:
          'Amaretto is a sweet, almond-flavored liqueur originating from Italy. It is commonly used in desserts, cocktails, and baking for its distinctive flavor.',
        manufacturer: 'Various',
        traceAllergens: ['nuts'],
        certifications: ['vegetarian'],
        vegan: false,
        tags: ['liqueur', 'almond', 'sweet'],
        density: 1.1,
        phase: 'liquid',
        measurementUnits: {
          options: [
            {
              id: 'mL'
            },
            {
              id: 'g'
            },
            {
              id: 'Tbsp'
            },
            {
              id: 'tsp'
            }
          ],
          preferredId: 'mL'
        },
        notes: [
          {
            category: 'ai',
            note: 'The composition percentages are estimated based on typical Amaretto formulations. Actual values may vary by brand. Assumed water and sugar content based on typical liqueur properties.'
          }
        ],
        category: 'alcohol',
        alcoholByVolume: 28,
        flavorProfile: 'Sweet, with a distinct almond flavor, often with hints of vanilla and cherry.'
      },
      frangelico: {
        baseId: 'frangelico',
        name: 'Frangelico',
        ganacheCharacteristics: {
          cacaoFat: 0,
          sugar: 10,
          milkFat: 0,
          water: 30,
          solids: 5,
          otherFats: 55
        },
        description:
          'Frangelico is a brand of noisette and herb-flavored liqueur which is produced in Canale, Italy. It has a rich hazelnut flavor with hints of vanilla and cocoa.',
        manufacturer: 'Frangelico',
        allergens: ['nuts'],
        certifications: ['vegetarian'],
        vegan: false,
        tags: ['liqueur', 'hazelnut', 'Italian'],
        density: 1.1,
        phase: 'liquid',
        measurementUnits: {
          options: [
            {
              id: 'mL'
            },
            {
              id: 'g'
            },
            {
              id: 'tsp'
            },
            {
              id: 'Tbsp'
            }
          ],
          preferredId: 'mL'
        },
        notes: [
          {
            category: 'ai',
            note: 'The ganacheCharacteristics percentages are estimated based on typical liqueur compositions. The water content is assumed to be relatively high, and otherFats represent the alcohol and flavor oils.'
          }
        ],
        category: 'alcohol',
        alcoholByVolume: 24,
        flavorProfile: 'Rich hazelnut flavor with notes of vanilla and cocoa'
      },
      'eierlik-r': {
        baseId: 'eierlik-r',
        name: 'Eierlikör',
        ganacheCharacteristics: {
          cacaoFat: 0,
          sugar: 20,
          milkFat: 10,
          water: 30,
          solids: 5,
          otherFats: 35
        },
        description:
          'Eierlikör is a creamy, egg-based liqueur originating from Germany, often used in desserts and chocolates.',
        allergens: ['eggs', 'milk'],
        certifications: ['gluten-free'],
        tags: ['liqueur', 'creamy', 'dessert'],
        phase: 'liquid',
        measurementUnits: {
          options: [
            {
              id: 'mL'
            },
            {
              id: 'g'
            },
            {
              id: 'tsp'
            },
            {
              id: 'Tbsp'
            }
          ],
          preferredId: 'mL'
        },
        notes: [
          {
            category: 'ai',
            note: 'Assumed typical percentages for Eierlikör based on general knowledge of its composition. Specific brand formulations may vary.'
          }
        ],
        category: 'alcohol',
        alcoholByVolume: 20,
        flavorProfile: 'Rich, creamy, and sweet with notes of vanilla and a hint of rum or brandy.'
      },
      kahlua: {
        baseId: 'kahlua',
        name: 'Kahlua',
        ganacheCharacteristics: {
          cacaoFat: 0,
          sugar: 45,
          milkFat: 0,
          water: 30,
          solids: 5,
          otherFats: 20
        },
        description:
          'Kahlua is a coffee-flavored liqueur from Mexico. It contains rum, sugar, vanilla bean, and arabica coffee.',
        tags: ['coffee', 'liqueur', 'mexican'],
        density: 1.1,
        phase: 'liquid',
        measurementUnits: {
          options: [
            {
              id: 'mL'
            },
            {
              id: 'g'
            },
            {
              id: 'Tbsp'
            },
            {
              id: 'tsp'
            }
          ],
          preferredId: 'mL'
        },
        urls: [
          {
            category: 'official',
            url: 'https://www.kahlua.com'
          }
        ],
        notes: [
          {
            category: 'ai',
            note: "Estimated the percentages for ganache characteristics based on typical liqueur compositions and Kahlua's known ingredients. Exact values may vary."
          }
        ],
        category: 'alcohol',
        alcoholByVolume: 20,
        flavorProfile: 'Rich coffee with notes of vanilla and caramel'
      },
      'tia-maria': {
        baseId: 'tia-maria',
        name: 'Tia Maria',
        ganacheCharacteristics: {
          cacaoFat: 0,
          sugar: 20,
          milkFat: 0,
          water: 60,
          solids: 0,
          otherFats: 20
        },
        description:
          'Tia Maria is a coffee liqueur made using Jamaican coffee beans, vanilla, and sugar blended with Jamaican rum.',
        manufacturer: 'Illva Saronno',
        allergens: [],
        traceAllergens: [],
        certifications: [],
        vegan: false,
        tags: ['coffee liqueur', 'Jamaican rum', 'vanilla', 'sugar'],
        density: 1.1,
        phase: 'liquid',
        measurementUnits: {
          options: [
            {
              id: 'mL'
            },
            {
              id: 'g'
            },
            {
              id: 'tsp'
            },
            {
              id: 'Tbsp'
            }
          ],
          preferredId: 'mL'
        },
        urls: [
          {
            category: 'product',
            url: 'https://www.tiamaria.com'
          }
        ],
        notes: [
          {
            category: 'ai',
            note: 'The ganache characteristics are estimated based on typical liqueur composition as specific product formulation details are not publicly available.'
          }
        ],
        category: 'alcohol',
        alcoholByVolume: 20,
        flavorProfile: 'Rich coffee flavor with hints of vanilla and chocolate.'
      },
      gin: {
        baseId: 'gin',
        name: 'Gin',
        ganacheCharacteristics: {
          cacaoFat: 0,
          sugar: 0,
          milkFat: 0,
          water: 60,
          solids: 0,
          otherFats: 40
        },
        description:
          'A distilled alcoholic spirit flavored primarily with juniper berries and various botanicals. Gin adds aromatic complexity and helps preserve ganaches while lowering water activity. The botanical notes can complement chocolate, particularly dark chocolate with citrus or floral profiles.',
        allergens: [],
        traceAllergens: [],
        certifications: [],
        vegan: true,
        tags: ['spirit', 'botanical', 'juniper', 'alcohol', 'liquor', 'ganache-ingredient', 'preservation'],
        density: 0.95,
        phase: 'liquid',
        measurementUnits: {
          options: [
            {
              id: 'mL'
            },
            {
              id: 'Tbsp'
            },
            {
              id: 'tsp'
            }
          ],
          preferredId: 'mL'
        },
        urls: [],
        notes: [
          {
            category: 'ai',
            note: "Assumed standard gin at 40% ABV (80 proof), which is the most common strength. Premium gins may range from 37.5% to 47% ABV. For ganache characteristics: 60% water, 40% classified as 'otherFats' (representing the alcohol/ethanol component since there is no dedicated alcohol field in the schema). Actual botanical extract content is minimal (<1%). Density estimated at 0.95 g/mL for 40% ABV ethanol-water mixture."
          },
          {
            category: 'usage',
            note: 'When using gin in ganache, alcohol content affects shelf stability and texture. Typically used at 5-10% of total ganache weight. Alcohol inhibits crystallization and reduces water activity, extending shelf life. Consider that alcohol will not fully evaporate in ganache applications.'
          }
        ],
        category: 'alcohol',
        alcoholByVolume: 40,
        flavorProfile:
          'Juniper-forward with botanical notes including coriander, citrus peel, angelica root, and various herbs and spices. Flavor varies significantly by brand and style (London Dry, Plymouth, Old Tom, etc.).'
      }
    }
  },
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
        beanVarieties: ['Trinitario'],
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
          'confectionary',
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
        temperatureCurve: {
          melt: 45,
          working: 31
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
        applications: ['molding', 'enrobing', 'ganache', 'mousse', 'confectionary'],
        certifications: ['halal', 'kosher-dairy', 'vegetarian', 'cocoa-horizons'],
        allergens: ['milk', 'soy'],
        temperatureCurve: {
          melt: 45,
          working: 30
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
        applications: ['ganache', 'mousse', 'confectionary', 'enrobing', 'glazes', 'ice-cream'],
        certifications: ['halal', 'kosher-dairy', 'vegetarian', 'gluten-free', 'cocoa-horizons'],
        allergens: ['milk', 'soy'],
        temperatureCurve: {
          melt: 40,
          working: 28
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
        temperatureCurve: {
          melt: 45,
          working: 32
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
        applications: ['confectionary', 'frozen-desserts', 'baking', 'ice-cream', 'ganache', 'mousse'],
        certifications: ['halal', 'kosher-dairy', 'vegetarian', 'gluten-free', 'non-gmo', 'cocoa-horizons'],
        allergens: ['milk', 'soy'],
        temperatureCurve: {
          melt: 40,
          working: 28
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
        applications: ['pralines', 'frozen-desserts', 'mousse', 'glazes', 'confectionary'],
        certifications: ['halal', 'kosher-dairy', 'vegetarian', 'cocoa-horizons'],
        allergens: ['milk', 'soy'],
        temperatureCurve: {
          melt: 40,
          working: 28
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
        applications: ['molding', 'enrobing', 'ganache', 'confectionary', 'mousse'],
        certifications: ['halal', 'kosher-dairy', 'vegetarian', 'cocoa-horizons'],
        allergens: ['milk', 'soy'],
        temperatureCurve: {
          melt: 45,
          working: 30
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
      },
      'gold-leaf': {
        baseId: 'gold-leaf',
        name: 'Edible Gold Leaf',
        ganacheCharacteristics: {
          cacaoFat: 0,
          sugar: 0,
          milkFat: 0,
          water: 0,
          solids: 0,
          otherFats: 0
        },
        description: '23-karat edible gold leaf sheets for elegant decoration',
        vegan: true,
        tags: ['decoration', 'gold', 'elegant'],
        category: 'decoration'
      },
      'cocoa-butter-colored': {
        baseId: 'cocoa-butter-colored',
        name: 'Colored Cocoa Butter',
        ganacheCharacteristics: {
          cacaoFat: 100,
          sugar: 0,
          milkFat: 0,
          water: 0,
          solids: 0,
          otherFats: 0
        },
        description: 'Pre-colored cocoa butter for transfer sheets and airbrushing',
        vegan: true,
        tags: ['decoration', 'cocoa-butter', 'color', 'transfer'],
        category: 'decoration'
      },
      'corn-syrup': {
        baseId: 'corn-syrup',
        name: 'Corn Syrup',
        ganacheCharacteristics: {
          cacaoFat: 0,
          sugar: 76,
          milkFat: 0,
          water: 24,
          solids: 0,
          otherFats: 0
        },
        description:
          'A thick, sweet syrup made from corn starch that has been processed to convert some of its glucose into fructose. Corn syrup is commonly used in confectionery to prevent crystallization, add sweetness, and improve texture. It helps retain moisture and extends shelf life in chocolate ganaches and other confections.',
        allergens: [],
        traceAllergens: [],
        certifications: [],
        vegan: true,
        tags: [
          'sweetener',
          'liquid-sugar',
          'anti-crystallization',
          'humectant',
          'confectionery',
          'glucose-syrup'
        ],
        density: 1.4,
        phase: 'liquid',
        measurementUnits: {
          options: [
            {
              id: 'g'
            },
            {
              id: 'mL'
            },
            {
              id: 'tsp'
            },
            {
              id: 'Tbsp'
            }
          ],
          preferredId: 'g'
        },
        urls: [],
        notes: [
          {
            category: 'ai',
            note: "Ganache characteristics estimated based on typical light corn syrup composition: approximately 76% sugars (primarily glucose with some maltose and higher oligosaccharides) and 24% water. Standard corn syrup contains minimal to no fats or milk solids. Sweetness potency estimated at 0.75 relative to sucrose, as corn syrup is less sweet than table sugar. Density estimated at 1.4 g/mL for standard light corn syrup. These values may vary slightly by manufacturer and whether it's light or dark corn syrup."
          }
        ],
        category: 'sugar',
        hydrationNumber: 0,
        sweetnessPotency: 0.75
      },
      'goat-cheese-costco': {
        baseId: 'goat-cheese-costco',
        name: 'Goat Cheese (Costco)',
        ganacheCharacteristics: {
          cacaoFat: 0,
          sugar: 1,
          milkFat: 21,
          water: 60,
          solids: 17,
          otherFats: 1
        },
        description:
          'Fresh goat cheese (chèvre) from Costco, typically soft and creamy with a tangy, mild flavor. Commonly used in ganaches for its unique flavor profile and smooth texture when melted.',
        manufacturer: 'Kirkland (Various Suppliers)',
        allergens: ['milk'],
        traceAllergens: [],
        certifications: [],
        vegan: false,
        tags: ['cheese', 'goat', 'chèvre', 'fresh cheese', 'tangy', 'creamy', 'costco'],
        density: 1.03,
        phase: 'solid',
        measurementUnits: {
          options: [
            {
              id: 'g'
            },
            {
              id: 'mL'
            },
            {
              id: 'tsp'
            },
            {
              id: 'Tbsp'
            }
          ],
          preferredId: 'g'
        },
        urls: [],
        notes: [
          {
            category: 'ai',
            note: 'Nutritional composition estimated based on typical fresh goat cheese (chèvre) values: approximately 22% fat, 60% water, 17% protein and other solids, 1% lactose/sugar. Costco sources from multiple suppliers, so exact composition may vary by region and brand. The ganacheCharacteristics represent a typical soft goat cheese composition suitable for ganache applications.'
          },
          {
            category: 'ai',
            note: 'Density estimated at 1.03 g/mL based on typical fresh soft cheese density. When using in ganache, the high water content (60%) should be accounted for in shelf life calculations.'
          }
        ],
        category: 'dairy',
        fatContent: 22,
        waterContent: 60
      },
      mascarpone: {
        baseId: 'mascarpone',
        name: 'Mascarpone',
        ganacheCharacteristics: {
          cacaoFat: 0,
          sugar: 3,
          milkFat: 44,
          water: 49,
          solids: 4,
          otherFats: 0
        },
        description:
          'Italian cream cheese made from whole cream, coagulated by the addition of citric acid or acetic acid. Known for its rich, creamy texture and slightly sweet flavor. Commonly used in ganaches and desserts like tiramisu.',
        allergens: ['milk'],
        certifications: ['vegetarian'],
        vegan: false,
        tags: ['italian', 'cream-cheese', 'soft-cheese', 'dessert', 'ganache', 'filling'],
        density: 1.03,
        phase: 'solid',
        measurementUnits: {
          options: [
            {
              id: 'g'
            },
            {
              id: 'mL'
            },
            {
              id: 'Tbsp'
            },
            {
              id: 'tsp'
            }
          ],
          preferredId: 'g'
        },
        notes: [
          {
            category: 'ai',
            note: 'Ganache characteristics estimated based on typical mascarpone composition: approximately 44% milk fat, 49% water, 3% natural milk sugars (lactose), and 4% milk solids (proteins and minerals). Values may vary slightly by manufacturer and production method. Fat content and water content are typical ranges for commercial mascarpone. Density estimated at 1.03 g/mL based on high fat content.'
          }
        ],
        category: 'dairy',
        fatContent: 44,
        waterContent: 49
      },
      'coffee-beans': {
        baseId: 'coffee-beans',
        name: 'Coffee Beans',
        ganacheCharacteristics: {
          cacaoFat: 0,
          sugar: 0,
          milkFat: 0,
          water: 3,
          solids: 96,
          otherFats: 1
        },
        description:
          'Whole roasted coffee beans used to infuse flavor into creams, ganaches, and other chocolate preparations. Can be used whole for steeping or ground for direct incorporation. Provides rich coffee flavor and aroma to chocolate confections.',
        allergens: [],
        traceAllergens: [],
        certifications: [],
        vegan: true,
        tags: ['coffee', 'beans', 'infusion', 'flavor', 'aromatic', 'roasted'],
        density: 0.65,
        phase: 'solid',
        measurementUnits: {
          options: [
            {
              id: 'g'
            },
            {
              id: 'tsp'
            },
            {
              id: 'Tbsp'
            }
          ],
          preferredId: 'g'
        },
        urls: [],
        notes: [
          {
            category: 'ai',
            note: 'Ganache characteristics estimated for typical roasted coffee beans: approximately 96% solids (including cellulose, proteins, minerals, and coffee oils), 3% residual water, and 1% coffee oils (counted as otherFats). These beans are typically used for infusion rather than direct incorporation into ganache, so their composition affects flavor extraction rather than ganache texture. Density estimated at 0.65 g/mL for whole roasted beans. For use in ganache, beans are typically steeped in cream or other liquids to extract flavor compounds, then strained out.'
          }
        ],
        category: 'flavor'
      },
      'maple-syrup': {
        baseId: 'maple-syrup',
        name: 'Maple Syrup',
        ganacheCharacteristics: {
          cacaoFat: 0,
          sugar: 66,
          milkFat: 0,
          water: 33,
          solids: 1,
          otherFats: 0
        },
        description:
          'Pure maple syrup produced by concentrating the sap of sugar maple trees through evaporation. It delivers a distinctive complex sweetness with caramel, woody, and vanilla-like notes, making it ideal for enhancing chocolate ganaches, pralines, and flavored fillings while contributing natural moisture and subtle acidity.',
        allergens: [],
        traceAllergens: [],
        certifications: ['all-natural', 'vegan', 'vegetarian', 'non-gmo', 'kosher'],
        vegan: true,
        tags: ['sweetener', 'maple-flavor', 'natural-syrup', 'liquid-sweetener'],
        density: 1.33,
        phase: 'liquid',
        measurementUnits: {
          options: [
            {
              id: 'g'
            },
            {
              id: 'mL'
            },
            {
              id: 'tsp'
            },
            {
              id: 'Tbsp'
            }
          ],
          preferredId: 'mL'
        },
        urls: [
          {
            category: 'wikipedia',
            url: 'https://en.wikipedia.org/wiki/Maple_syrup'
          }
        ],
        notes: [
          {
            category: 'ai',
            note: 'GanacheCharacteristics based on standard pure maple syrup composition (minimum 66° Brix): ~66% sugars (primarily sucrose with trace glucose/fructose), ~33% water, ~1% other solids (minerals/organic acids/phenolics). Density averaged from industry sources (1.32–1.37 g/mL). Sweetness potency 0.6 relative to sucrose per Quebec maple industry technical data for the syrup as used. Hydration number 0 (anhydrous sucrose dominant). Generic values for unspecified pure maple syrup; minor batch variations possible by grade/producer.'
          }
        ],
        category: 'sugar',
        hydrationNumber: 0,
        sweetnessPotency: 0.6
      },
      'banana-overripe': {
        baseId: 'banana-overripe',
        name: 'Banana (Overripe)',
        ganacheCharacteristics: {
          cacaoFat: 0,
          sugar: 16,
          milkFat: 0,
          water: 79,
          solids: 4.8,
          otherFats: 0.2
        },
        description:
          'Overripe bananas are soft, with brown spots, and have heightened sweetness due to starch converting to simple sugars (fructose, glucose, sucrose). Ideal for mashing or pureeing into ganaches, truffles, or fillings in chocolate making for natural sweetness and banana flavor.',
        allergens: [],
        traceAllergens: [],
        vegan: true,
        tags: ['fruit', 'banana', 'natural-sugar', 'puree', 'sweetener'],
        density: 1.05,
        phase: 'solid',
        measurementUnits: {
          options: [
            {
              id: 'g'
            },
            {
              id: 'mL'
            }
          ],
          preferredId: 'g'
        },
        notes: [
          {
            category: 'ai',
            note: 'Ganache characteristics based on USDA-style data for overripe raw bananas: ~78.8% water, ~15.8-16% sugars, ~0.22% fat (as otherFats), ~4.8% solids (protein ~0.7%, fiber ~1.8%, starch ~0.4%, ash ~0.7%, etc.). Rounded for sum to 100. Water slightly adjusted to 79% for rounding. Sources: nutritionvalue.org, myfooddata.com, virhex.com.'
          }
        ],
        category: 'flavor'
      },
      water: {
        baseId: 'water',
        name: 'Water',
        ganacheCharacteristics: {
          cacaoFat: 0,
          sugar: 0,
          milkFat: 0,
          water: 100,
          solids: 0,
          otherFats: 0
        },
        description:
          'Water is a clear, tasteless, odorless, and nearly colorless substance that is essential for most forms of life. In chocolate making, it is used carefully as it can affect the texture and flavor of chocolate.',
        vegan: true,
        tags: ['liquid', 'essential', 'neutral'],
        density: 1,
        phase: 'liquid',
        measurementUnits: {
          options: [
            {
              id: 'mL'
            },
            {
              id: 'g'
            },
            {
              id: 'tsp'
            },
            {
              id: 'Tbsp'
            }
          ],
          preferredId: 'mL'
        },
        notes: [
          {
            category: 'ai',
            note: 'Water is assumed to be pure and its characteristics are based on typical properties of distilled water.'
          }
        ],
        category: 'liquid'
      },
      'sea-salt': {
        baseId: 'sea-salt',
        name: 'Sea Salt',
        ganacheCharacteristics: {
          cacaoFat: 0,
          sugar: 0,
          milkFat: 0,
          water: 0.2,
          solids: 99.8,
          otherFats: 0
        },
        description:
          'Sea salt is harvested from evaporated seawater and contains trace minerals like magnesium and potassium, giving it a more complex flavor than refined table salt. In chocolate-making, it is used sparingly to balance sweetness and enhance chocolate flavors in ganache, caramels, and truffles.',
        allergens: [],
        traceAllergens: [],
        certifications: [],
        vegan: true,
        tags: ['salt', 'sea-salt', 'mineral', 'seasoning', 'savory'],
        density: 2.16,
        phase: 'solid',
        measurementUnits: {
          options: [
            {
              id: 'g'
            },
            {
              id: 'pinch'
            }
          ],
          preferredId: 'g'
        },
        notes: [
          {
            category: 'ai',
            note: 'Ganache characteristics estimated for dry sea salt: ~99.8% solids (primarily NaCl with trace minerals), 0.2% water (typical residual moisture). No cacao, sugar, milk, or fats present. Density based on sodium chloride crystal density (2.165 g/mL). Composition typical for generic sea salt; specific products may vary slightly.'
          }
        ],
        category: 'flavor'
      },
      'malic-acid-solution': {
        baseId: 'malic-acid-solution',
        name: 'Malic Acid Solution',
        ganacheCharacteristics: {
          cacaoFat: 0,
          sugar: 0,
          milkFat: 0,
          water: 60,
          solids: 40,
          otherFats: 0
        },
        description:
          'A solution containing 60% water and 40% malic acid, used to add tartness and acidity to culinary applications.',
        vegan: true,
        tags: ['acidic', 'solution', 'tartness'],
        density: 1.2,
        phase: 'liquid',
        measurementUnits: {
          options: [
            {
              id: 'g'
            },
            {
              id: 'mL'
            },
            {
              id: 'tsp'
            },
            {
              id: 'Tbsp'
            }
          ],
          preferredId: 'mL'
        },
        notes: [
          {
            category: 'ai',
            note: 'Assumed density based on typical malic acid solution concentrations. Adjust if precise density measurement is available.'
          }
        ],
        category: 'other'
      },
      'citric-acid-solution': {
        baseId: 'citric-acid-solution',
        name: 'Citric acid solution',
        ganacheCharacteristics: {
          cacaoFat: 0,
          sugar: 0,
          milkFat: 0,
          water: 50,
          solids: 50,
          otherFats: 0
        },
        description:
          'A 50% w/w solution of citric acid in water, commonly used in chocolate and confectionery applications to impart tartness and acidity to ganaches, pates de fruit, fruit fillings, and other components.',
        vegan: true,
        tags: ['acidulant', 'citric-acid', 'sour', 'flavor-enhancer', 'preservative'],
        density: 1.24,
        phase: 'liquid',
        measurementUnits: {
          options: [
            {
              id: 'g'
            },
            {
              id: 'mL'
            },
            {
              id: 'tsp'
            },
            {
              id: 'Tbsp'
            }
          ],
          preferredId: 'g'
        },
        notes: [
          {
            category: 'ai',
            note: 'Assumed typical 50% w/w citric acid solution (equal parts citric acid powder and water by weight), as commonly referenced in chocolate and confectionery recipes (e.g., 1:1 ratio). Ganache characteristics: 50% water, 50% citric acid counted as solids. Density ~1.24 g/mL based on supplier specifications for 50% solutions at ~20°C.'
          }
        ],
        category: 'flavor'
      },
      'mango-puree': {
        baseId: 'mango-puree',
        name: 'Mango Puree',
        ganacheCharacteristics: {
          cacaoFat: 0,
          sugar: 15,
          milkFat: 0,
          water: 81,
          solids: 3.6,
          otherFats: 0.4
        },
        description:
          'Smooth puree derived from ripe mango fruit, providing intense tropical mango flavor and aroma. Commonly used in chocolate ganaches, mousses, ice creams, and fruit-based confections. Typically around 12-15° Brix for natural unsweetened varieties.',
        vegan: true,
        tags: ['fruit', 'mango', 'tropical', 'puree', 'ganache', 'mousse'],
        density: 1.05,
        phase: 'liquid',
        measurementUnits: {
          options: [
            {
              id: 'g'
            },
            {
              id: 'mL'
            }
          ],
          preferredId: 'g'
        },
        notes: [
          {
            category: 'ai',
            note: 'Ganache characteristics estimated from typical unsweetened mango puree nutritional data across sources (e.g., 80-85% water, 15-18g carbs/100g mostly sugars, 0.4g fat, 0.8g protein, implied fiber ~2-3g). Adjusted to sum 100: sugar 15% (natural soluble carbs ~14-16 Brix equiv.), solids 3.6% (fiber + protein + ash), otherFats 0.4%, water 81%. Sweetened varieties add cane sugar (e.g., Perfect Puree ~10% added), but generic assumed unsweetened. Density estimated typical for fruit purees ~1.05 g/mL. Vegan confirmed, no common allergens.<grok:render type="render_inline_citation"><argument name="citation_id">23</argument></grok:render><grok:render type="render_inline_citation"><argument name="citation_id">24</argument></grok:render><grok:render type="render_inline_citation"><argument name="citation_id">9</argument></grok:render>'
          }
        ],
        category: 'flavor'
      },
      'mango-juice-reduced': {
        baseId: 'mango-juice-reduced',
        name: 'Mango Juice (Reduced)',
        ganacheCharacteristics: {
          cacaoFat: 0,
          sugar: 60,
          milkFat: 0,
          water: 35,
          solids: 4,
          otherFats: 1
        },
        description:
          'Concentrated mango juice, typically reduced to around 65° Brix by evaporating water, used as a flavoring agent in chocolate ganaches and confections. Provides intense mango flavor with reduced water content to minimize impact on ganache texture.',
        vegan: true,
        tags: ['mango', 'fruit', 'juice', 'concentrate', 'tropical', 'flavoring'],
        density: 1.32,
        phase: 'liquid',
        measurementUnits: {
          options: [
            {
              id: 'g'
            },
            {
              id: 'mL'
            }
          ],
          preferredId: 'g'
        },
        notes: [
          {
            category: 'ai',
            note: 'Composition estimated from typical 65 Brix mango juice concentrate nutritional data: ~35% water (100% - 65% Brix), ~60% sugars (carbs), ~4% solids (proteins ~3g, fiber/minerals), ~1% other fats. Density from product spec sheets (specific gravity ~1.32). Assumed for generic reduced mango juice used in chocolate applications.'
          }
        ],
        category: 'liquid'
      }
    }
  },
  decorations: {
    metadata: {
      name: 'Decorations'
    },
    items: {
      'lustre-dust': {
        baseId: 'lustre-dust',
        name: 'Lustre Dust',
        ganacheCharacteristics: {
          cacaoFat: 0,
          sugar: 0,
          milkFat: 0,
          water: 0,
          solids: 100,
          otherFats: 0
        },
        description:
          'Edible decorative powder with a shimmering, metallic finish used to add visual appeal to chocolates and confections. Available in various colors including gold, silver, bronze, and pearl. Creates a lustrous sheen when applied to chocolate surfaces.',
        allergens: [],
        traceAllergens: [],
        certifications: [],
        vegan: true,
        tags: [
          'decoration',
          'edible-shimmer',
          'metallic-finish',
          'surface-decoration',
          'powder',
          'food-coloring'
        ],
        density: 0.4,
        phase: 'solid',
        measurementUnits: {
          options: [
            {
              id: 'g'
            },
            {
              id: 'tsp'
            },
            {
              id: 'pinch'
            }
          ],
          preferredId: 'pinch'
        },
        urls: [],
        notes: [
          {
            category: 'ai',
            note: "Lustre dust is typically composed of mica-based pearlescent pigments, titanium dioxide, and approved food colorants. The ganacheCharacteristics reflect it as 100% solids since it's a dry powder with negligible moisture. Density estimated at 0.4 g/mL as a loose powder. This is a surface decoration only and not incorporated into ganache formulations. Vegan status assumed true for most commercial lustre dusts, but specific products may vary - users should verify with manufacturer if using animal-derived pearl pigments."
          },
          {
            category: 'ai',
            note: 'Allergen information is product-specific. While pure lustre dust typically contains no common allergens, cross-contamination may occur during manufacturing. Users should verify with specific product manufacturers.'
          }
        ],
        category: 'decoration'
      },
      'cocoa-butter-decorative': {
        baseId: 'cocoa-butter-decorative',
        name: 'Cocoa Butter (Decorative)',
        ganacheCharacteristics: {
          cacaoFat: 100,
          sugar: 0,
          milkFat: 0,
          water: 0,
          solids: 0,
          otherFats: 0
        },
        description:
          'Pure cocoa butter specifically intended for decorative applications in chocolate work, including colored cocoa butter for spray work, transfer sheets, and artistic chocolate designs. Provides a stable, crystalline fat structure that adheres well to chocolate surfaces.',
        allergens: [],
        traceAllergens: ['milk', 'soy', 'nuts'],
        certifications: ['vegan', 'gluten-free', 'kosher'],
        vegan: true,
        tags: [
          'cocoa-butter',
          'decorative',
          'spray',
          'coloring',
          'artistic',
          'transfer-sheets',
          'pure-fat',
          'tempering'
        ],
        density: 0.91,
        phase: 'solid',
        measurementUnits: {
          options: [
            {
              id: 'g'
            },
            {
              id: 'mL'
            },
            {
              id: 'tsp'
            },
            {
              id: 'Tbsp'
            }
          ],
          preferredId: 'g'
        },
        urls: [],
        notes: [
          {
            category: 'ai',
            note: 'Ganache characteristics represent pure cocoa butter at 100% cacao fat. Density of 0.91 g/mL is standard for cocoa butter at room temperature. Melting point of 34°C (93°F) represents the typical melting point for stable Form V crystals in tempered cocoa butter. Trace allergens listed reflect common manufacturing environments where cocoa butter is processed alongside chocolate products. This ingredient is assumed to be pure, deodorized cocoa butter suitable for decorative work, though specific manufacturers may add colorants or have different processing standards.'
          },
          {
            category: 'usage',
            note: 'When used for decorative purposes, cocoa butter should be tempered (typically heated to 45-50°C, cooled to 26-27°C, then reheated to 31-32°C) to ensure proper crystallization and shine. Colored cocoa butter is often mixed with fat-soluble powder colors at ratios of approximately 10% color to 90% cocoa butter.'
          }
        ],
        category: 'fat',
        meltingPoint: 34
      },
      'gold-leaf': {
        baseId: 'gold-leaf',
        name: 'Gold Leaf',
        ganacheCharacteristics: {
          cacaoFat: 0,
          sugar: 0,
          milkFat: 0,
          water: 0,
          solids: 100,
          otherFats: 0
        },
        description:
          'Edible gold leaf used for decorating chocolates and confections. Typically 23-24 karat gold that has been hammered or rolled into extremely thin sheets. Adds luxury visual appeal and metallic shimmer to finished chocolate pieces.',
        allergens: [],
        traceAllergens: [],
        certifications: ['gluten-free', 'vegan', 'vegetarian', 'kosher', 'halal', 'all-natural'],
        vegan: true,
        tags: ['edible-gold', 'decoration', 'luxury', 'metallic', 'finishing', 'garnish', '24k', '23k'],
        density: 5,
        phase: 'solid',
        measurementUnits: {
          options: [
            {
              id: 'g'
            }
          ],
          preferredId: 'g'
        },
        urls: [],
        notes: [
          {
            category: 'ai',
            note: 'Gold leaf is pure elemental gold and contains no organic compounds, fats, sugars, or water. Actual gold density is 19.3 g/mL but set to maximum allowed value of 5.0 g/mL due to schema constraints. Solids percentage is 100% as it is a pure metal in solid form. Gold is biologically inert and passes through the digestive system unchanged, making it safe for consumption and suitable for all dietary restrictions. Typically sold in books of very thin sheets measured by weight in grams or by sheet count.'
          }
        ],
        category: 'decoration'
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
  flavors: {
    metadata: {
      name: 'Flavors'
    },
    items: {
      'cinnamon-ground': {
        baseId: 'cinnamon-ground',
        name: 'Cinnamon (Ground)',
        ganacheCharacteristics: {
          cacaoFat: 0,
          sugar: 2,
          milkFat: 0,
          water: 10,
          solids: 88,
          otherFats: 0
        },
        description:
          'Ground cinnamon is a warm, sweet spice derived from the inner bark of Cinnamomum trees. Commonly used in chocolate confections to add depth and aromatic warmth. Available in two main varieties: Ceylon (true cinnamon, sweeter and more delicate) and Cassia (more common, stronger flavor). Ground cinnamon adds complexity to ganaches, pralines, and flavored chocolates.',
        allergens: [],
        traceAllergens: [],
        certifications: [],
        vegan: true,
        tags: ['spice', 'warming', 'aromatic', 'sweet', 'bark', 'ground', 'cassia', 'ceylon'],
        density: 0.56,
        phase: 'solid',
        measurementUnits: {
          options: [
            {
              id: 'g'
            },
            {
              id: 'tsp'
            },
            {
              id: 'Tbsp'
            },
            {
              id: 'pinch'
            }
          ],
          preferredId: 'tsp'
        },
        urls: [],
        notes: [
          {
            category: 'ai',
            note: 'Ganache characteristics estimated for typical ground cinnamon: approximately 88% solids (fiber, carbohydrates, minerals), 10% residual moisture, 2% natural sugars. The composition can vary slightly between Ceylon and Cassia varieties. Density of 0.56 g/mL is an average for ground cinnamon powder. Most cinnamon used in chocolate work is Cassia variety unless specifically labeled as Ceylon. When using in ganache, typical dosage is 0.5-2% of total weight to avoid overpowering the chocolate.'
          }
        ],
        category: 'flavor'
      },
      'cinnamon-whole': {
        baseId: 'cinnamon-whole',
        name: 'Cinnamon (Whole)',
        ganacheCharacteristics: {
          cacaoFat: 0,
          sugar: 2,
          milkFat: 0,
          water: 10,
          solids: 88,
          otherFats: 0
        },
        description:
          'Whole cinnamon sticks (quills) from dried bark of Cinnamomum trees. Used for infusing creams, ganaches, and chocolate preparations. Provides warm, sweet, and slightly spicy aromatic notes. Typically steeped in hot liquid and removed before final preparation.',
        allergens: [],
        traceAllergens: [],
        certifications: [],
        vegan: true,
        tags: ['spice', 'aromatic', 'infusion', 'warm-spice', 'cinnamon', 'bark', 'whole-spice', 'flavoring'],
        density: 0.4,
        phase: 'solid',
        measurementUnits: {
          options: [
            {
              id: 'g'
            },
            {
              id: 'tsp'
            },
            {
              id: 'Tbsp'
            }
          ],
          preferredId: 'g'
        },
        urls: [],
        notes: [
          {
            category: 'ai',
            note: 'Ganache characteristics estimated for dried whole cinnamon sticks: approximately 88% solids (cellulose, lignin, and aromatic compounds), 10% residual water, 2% natural sugars. These values represent the physical composition of the spice itself. In practice, whole cinnamon is typically infused into liquids (cream, milk) and then removed, so it contributes primarily aromatic compounds rather than mass to the final ganache. The density of 0.4 g/mL reflects the low density of dried bark pieces.'
          },
          {
            category: 'ai',
            note: "Two main types exist: Ceylon cinnamon (Cinnamomum verum, 'true cinnamon') with delicate, sweet flavor, and Cassia cinnamon (Cinnamomum cassia) with stronger, more pungent flavor. This entry represents whole sticks generically. For infusions, typical usage is 1-2 sticks per 250-500mL liquid, steeped for 10-30 minutes depending on desired intensity."
          }
        ],
        category: 'flavor'
      },
      'cardamom-whole': {
        baseId: 'cardamom-whole',
        name: 'Cardamom (Whole)',
        ganacheCharacteristics: {
          cacaoFat: 0,
          sugar: 0,
          milkFat: 0,
          water: 8,
          solids: 90,
          otherFats: 2
        },
        description:
          'Whole green cardamom pods containing aromatic black seeds. A highly fragrant spice with sweet, floral, and slightly eucalyptus-like notes. Native to India and commonly used in both sweet and savory applications. The pods can be infused whole into liquids or the seeds can be ground for more intense flavor.',
        allergens: [],
        traceAllergens: [],
        certifications: [],
        vegan: true,
        tags: [
          'spice',
          'aromatic',
          'cardamom',
          'green-cardamom',
          'infusion',
          'indian-spice',
          'whole-spice',
          'pods'
        ],
        density: 0.55,
        phase: 'solid',
        measurementUnits: {
          options: [
            {
              id: 'g'
            },
            {
              id: 'pods'
            }
          ],
          preferredId: 'pods'
        },
        urls: [],
        notes: [
          {
            category: 'ai',
            note: 'Ganache characteristics estimated for whole cardamom pods: approximately 90% solids (fiber, carbohydrates, protein), 8% water content, 2% volatile oils/fats. These pods are typically used for infusion rather than direct incorporation into ganache. The essential oils contain terpenes and other aromatic compounds. Water content is based on typical dried spice moisture levels. For ganache applications, pods are usually steeped in cream or other liquids and then removed, so the actual contribution to final ganache composition would be minimal - primarily flavor compounds rather than mass.'
          },
          {
            category: 'ai',
            note: 'Density estimated at 0.55 g/mL for whole pods, which are lightweight and contain hollow chambers. Individual pods typically weigh 0.3-0.5g each. For recipe purposes, measuring by pod count is more practical than weight.'
          }
        ],
        category: 'flavor'
      },
      'cardamom-ground': {
        baseId: 'cardamom-ground',
        name: 'Cardamom (Ground)',
        ganacheCharacteristics: {
          cacaoFat: 0,
          sugar: 0,
          milkFat: 0,
          water: 8,
          solids: 90,
          otherFats: 2
        },
        description:
          "Ground cardamom is a warm, aromatic spice with sweet, floral, and slightly citrusy notes. It's derived from the seeds of cardamom pods and is commonly used in both sweet and savory applications. In chocolate making, it adds complexity and exotic flavor, pairing particularly well with dark chocolate, white chocolate, and ganaches.",
        allergens: [],
        traceAllergens: [],
        certifications: [],
        vegan: true,
        tags: ['spice', 'aromatic', 'warming', 'floral', 'citrus', 'middle-eastern', 'indian', 'exotic'],
        density: 0.55,
        phase: 'solid',
        measurementUnits: {
          options: [
            {
              id: 'g'
            },
            {
              id: 'tsp'
            },
            {
              id: 'Tbsp'
            },
            {
              id: 'pinch'
            }
          ],
          preferredId: 'tsp'
        },
        urls: [],
        notes: [
          {
            category: 'ai',
            note: 'Ganache characteristics estimated based on typical composition of ground cardamom: approximately 8% moisture content, 2% volatile oils (counted as otherFats), and 90% solids (including fiber, carbohydrates, and minerals). These values are estimates for dried, ground cardamom spice. Density of 0.55 g/mL is typical for ground spices. Use sparingly in chocolate applications as cardamom has a strong, distinctive flavor - typically 0.5-2% by weight of the chocolate mass.'
          },
          {
            category: 'usage',
            note: 'When incorporating into ganache or chocolate, bloom the cardamom in warm cream or fat first to extract maximum flavor. Start with small amounts (0.5-1% of total weight) and adjust to taste, as cardamom can quickly overpower other flavors. Pairs exceptionally well with orange, coffee, and rose flavors.'
          }
        ],
        category: 'flavor'
      },
      'cloves-whole': {
        baseId: 'cloves-whole',
        name: 'Cloves (whole)',
        ganacheCharacteristics: {
          cacaoFat: 0,
          sugar: 2,
          milkFat: 0,
          water: 9,
          solids: 87,
          otherFats: 2
        },
        description:
          'Whole dried flower buds of Syzygium aromaticum, offering an intense, warm, sweet, and slightly bitter flavor with aromatic notes. Used sparingly in chocolate confections for spiced ganaches, infusions, and specialty pralines. Should be infused in cream or other liquids and strained before use.',
        allergens: [],
        traceAllergens: [],
        certifications: [],
        vegan: true,
        tags: [
          'spice',
          'aromatic',
          'warm spice',
          'infusion',
          'whole spice',
          'eugenol',
          'holiday spice',
          'clove'
        ],
        density: 0.55,
        phase: 'solid',
        measurementUnits: {
          options: [
            {
              id: 'g'
            },
            {
              id: 'tsp'
            },
            {
              id: 'Tbsp'
            },
            {
              id: 'pinch'
            }
          ],
          preferredId: 'g'
        },
        urls: [],
        notes: [
          {
            category: 'ai',
            note: 'GanacheCharacteristics estimated based on typical composition of whole dried cloves: approximately 87% total solids (including fiber, volatile oils, and other dry matter), 9% moisture, 2% essential oils (counted as otherFats), and 2% natural sugars. Cloves contain 15-20% essential oils by weight, but for ganache calculations the volatile oil component is estimated conservatively at 2%. Density estimated at 0.55 g/mL for whole cloves in loose form. This ingredient should be used for infusion purposes only and strained out before incorporating into ganache.'
          },
          {
            category: 'ai',
            note: 'Usage recommendation: Typically infused at 1-3 whole cloves per 100g of cream or liquid, then strained. Direct incorporation into ganache is not recommended due to the hard, woody texture of whole cloves.'
          }
        ],
        category: 'flavor'
      },
      'cloves-ground': {
        baseId: 'cloves-ground',
        name: 'Cloves (Ground)',
        ganacheCharacteristics: {
          cacaoFat: 0,
          sugar: 2,
          milkFat: 0,
          water: 9,
          solids: 87,
          otherFats: 2
        },
        description:
          'Ground cloves are a warm, aromatic spice derived from the dried flower buds of the clove tree (Syzygium aromaticum). They have an intensely pungent, sweet-spicy flavor with notes of pepper and a slightly bitter undertone. Used sparingly in chocolate applications to add warmth and complexity, particularly in spiced ganaches, truffles, and holiday confections. Pairs well with cinnamon, nutmeg, and orange.',
        allergens: [],
        traceAllergens: [],
        certifications: [],
        vegan: true,
        tags: [
          'spice',
          'aromatic',
          'warming',
          'holiday',
          'traditional',
          'pungent',
          'eugenol',
          'asian-spice',
          'indonesian',
          'madagascar'
        ],
        density: 0.55,
        phase: 'solid',
        measurementUnits: {
          options: [
            {
              id: 'g'
            },
            {
              id: 'tsp'
            },
            {
              id: 'Tbsp'
            },
            {
              id: 'pinch'
            }
          ],
          preferredId: 'tsp'
        },
        urls: [],
        notes: [
          {
            category: 'ai',
            note: 'Ganache characteristics estimated based on typical composition of ground cloves: primarily fiber and carbohydrates (solids ~87%), residual moisture (~9%), small amounts of natural sugars (~2%), and essential oils containing eugenol (~2% as otherFats). Density of 0.55 g/mL is typical for ground spices. Use very sparingly in chocolate applications (typically 0.1-0.3% of total recipe weight) as the flavor is extremely potent and can easily overpower chocolate. Cloves contain 15-20% essential oils by weight, with eugenol being the primary aromatic compound.'
          },
          {
            category: 'ai',
            note: 'Usage recommendation: In ganaches, start with 0.1-0.2g per 100g of chocolate. Cloves work particularly well with dark chocolate (65-75% cacao), orange, cinnamon, cardamom, and ginger. Allow flavors to infuse in warm cream for 10-15 minutes before straining for best results, or add directly to ganache in very small quantities for a more pronounced spice presence.'
          }
        ],
        category: 'flavor'
      },
      'nutmeg-whole': {
        baseId: 'nutmeg-whole',
        name: 'Nutmeg (Whole)',
        ganacheCharacteristics: {
          cacaoFat: 0,
          sugar: 0,
          milkFat: 0,
          water: 8,
          solids: 85,
          otherFats: 7
        },
        description:
          'Whole nutmeg seeds from the Myristica fragrans tree, prized for their warm, sweet, and slightly spicy aromatic profile. Used in chocolate making by grating fresh or grinding to release volatile oils that complement chocolate, caramel, and cream-based preparations. Whole nutmeg retains potency far longer than pre-ground.',
        allergens: [],
        traceAllergens: [],
        certifications: [],
        vegan: true,
        tags: ['spice', 'aromatic', 'warm spice', 'baking spice', 'whole spice', 'grating spice'],
        density: 0.55,
        phase: 'solid',
        measurementUnits: {
          options: [
            {
              id: 'g'
            },
            {
              id: 'tsp'
            },
            {
              id: 'seeds'
            }
          ],
          preferredId: 'seeds'
        },
        urls: [],
        notes: [
          {
            category: 'ai',
            note: 'Ganache characteristics estimated for whole nutmeg seed: approximately 85% solids (cellulose, proteins, carbohydrates), 7% other fats (volatile oils including myristicin), and 8% residual water. These values represent the dried whole seed composition. Density estimated at 0.55 g/mL for whole nutmeg seeds. When used in chocolate applications, nutmeg is typically grated fresh in very small quantities for flavoring rather than incorporated as a bulk ingredient.'
          }
        ],
        category: 'flavor'
      },
      'nutmeg-ground': {
        baseId: 'nutmeg-ground',
        name: 'Nutmeg (Ground)',
        ganacheCharacteristics: {
          cacaoFat: 0,
          sugar: 5,
          milkFat: 0,
          water: 8,
          solids: 85,
          otherFats: 2
        },
        description:
          'Ground nutmeg is a warm, aromatic spice derived from the seed of the Myristica fragrans tree. It has a sweet, nutty flavor with hints of clove and is commonly used in baking and confectionery. In chocolate applications, it adds depth and complexity, particularly in ganaches, truffles, and spiced chocolate creations.',
        allergens: [],
        traceAllergens: [],
        certifications: [],
        vegan: true,
        tags: ['spice', 'warm', 'aromatic', 'baking', 'flavoring', 'traditional'],
        density: 0.45,
        phase: 'solid',
        measurementUnits: {
          options: [
            {
              id: 'g'
            },
            {
              id: 'tsp'
            },
            {
              id: 'Tbsp'
            },
            {
              id: 'pinch'
            }
          ],
          preferredId: 'tsp'
        },
        urls: [],
        notes: [
          {
            category: 'ai',
            note: 'Ganache characteristics estimated based on typical ground nutmeg composition: primarily carbohydrates and fiber (solids ~85%), small amounts of natural sugars (~5%), moisture content (~8%), and essential oils/fats (~2%). Nutmeg contains approximately 25-40% fixed oils in whole form, but ground nutmeg has lower fat content due to processing and oxidation. Density estimated at 0.45 g/mL for ground spice. Use sparingly in chocolate applications as nutmeg has a potent flavor that can easily overpower other ingredients.'
          }
        ],
        category: 'flavor'
      },
      'lebkuchen-spice': {
        baseId: 'lebkuchen-spice',
        name: 'Lebkuchen Spice',
        ganacheCharacteristics: {
          cacaoFat: 0,
          sugar: 0,
          milkFat: 0,
          water: 8,
          solids: 92,
          otherFats: 0
        },
        description:
          'Traditional German gingerbread spice blend typically containing cinnamon, cloves, allspice, coriander, cardamom, ginger, nutmeg, and mace. Used in holiday baking and confections, particularly lebkuchen (German gingerbread). Adds warm, aromatic, and slightly sweet spice notes to chocolates, ganaches, and baked goods.',
        allergens: [],
        traceAllergens: [],
        certifications: [],
        vegan: true,
        tags: [
          'spice',
          'spice-blend',
          'german',
          'christmas',
          'holiday',
          'gingerbread',
          'lebkuchen',
          'warming-spices',
          'aromatic',
          'baking-spice'
        ],
        density: 0.55,
        phase: 'solid',
        measurementUnits: {
          options: [
            {
              id: 'g'
            },
            {
              id: 'tsp'
            },
            {
              id: 'Tbsp'
            },
            {
              id: 'pinch'
            }
          ],
          preferredId: 'tsp'
        },
        urls: [],
        notes: [
          {
            category: 'ai',
            note: 'Ganache characteristics estimated based on typical ground spice blend composition: predominantly dry solids (92%) with minimal residual moisture (8%). Density of 0.55 g/mL is typical for ground spice blends. Exact composition may vary by manufacturer and blend recipe. Traditional lebkuchen spice typically includes cinnamon, cloves, allspice, coriander, cardamom, ginger, nutmeg, and mace, though proportions and exact ingredients vary by recipe and regional tradition.'
          }
        ],
        category: 'flavor'
      },
      'aztec-spice': {
        baseId: 'aztec-spice',
        name: 'Aztec Spice',
        ganacheCharacteristics: {
          cacaoFat: 0,
          sugar: 0,
          milkFat: 0,
          water: 8,
          solids: 92,
          otherFats: 0
        },
        description:
          'A warming spice blend inspired by traditional Aztec chocolate beverages, typically combining cinnamon, chili pepper, and sometimes vanilla, nutmeg, or allspice. Used to add complex heat and aromatic depth to chocolate confections, ganaches, and drinking chocolate.',
        allergens: [],
        traceAllergens: [],
        certifications: [],
        vegan: true,
        tags: [
          'spice',
          'aztec',
          'mexican',
          'cinnamon',
          'chili',
          'warming',
          'traditional',
          'heat',
          'aromatic'
        ],
        density: 0.55,
        phase: 'solid',
        measurementUnits: {
          options: [
            {
              id: 'g'
            },
            {
              id: 'tsp'
            },
            {
              id: 'Tbsp'
            },
            {
              id: 'pinch'
            }
          ],
          preferredId: 'tsp'
        },
        notes: [
          {
            category: 'ai',
            note: 'Ganache characteristics estimated for a typical dried spice blend: primarily solids (ground spices) with minimal residual water content. Actual composition may vary based on specific blend ingredients and freshness. The 92% solids represents the dried spice matter, while 8% water accounts for typical moisture content in dried spices.'
          },
          {
            category: 'ai',
            note: 'Density estimated at 0.55 g/mL, which is typical for ground spice blends. Actual density may vary depending on grind size and specific spice composition.'
          },
          {
            category: 'ai',
            note: 'Allergen information assumes a pure spice blend without cross-contamination. Users should verify with manufacturer if using a commercial blend, as processing facilities may introduce trace allergens.'
          }
        ],
        category: 'flavor'
      },
      'chai-spice': {
        baseId: 'chai-spice',
        name: 'Chai Spice',
        ganacheCharacteristics: {
          cacaoFat: 0,
          sugar: 0,
          milkFat: 0,
          water: 8,
          solids: 90,
          otherFats: 2
        },
        description:
          'A warming blend of aromatic spices traditionally used in chai tea, typically including cinnamon, cardamom, ginger, cloves, and black pepper. Perfect for infusing into ganaches, creams, and chocolate fillings to create exotic, spiced flavor profiles.',
        allergens: [],
        traceAllergens: [],
        certifications: [],
        vegan: true,
        tags: [
          'spice',
          'chai',
          'warming',
          'aromatic',
          'cinnamon',
          'cardamom',
          'ginger',
          'cloves',
          'infusion',
          'blend'
        ],
        density: 0.55,
        phase: 'solid',
        measurementUnits: {
          options: [
            {
              id: 'g'
            },
            {
              id: 'tsp'
            },
            {
              id: 'Tbsp'
            },
            {
              id: 'pinch'
            }
          ],
          preferredId: 'tsp'
        },
        urls: [],
        notes: [
          {
            category: 'ai',
            note: 'Ganache characteristics estimated for a typical chai spice blend composition: approximately 90% solids (ground spices), 8% residual water content, and 2% volatile oils. Density estimated at 0.55 g/mL for ground spice blend. Actual composition may vary significantly based on specific blend ratios and grinding fineness. For chocolate applications, this spice blend is typically infused into cream or other liquids rather than added directly to chocolate.'
          },
          {
            category: 'usage',
            note: 'Best used by infusing into warm cream or milk for 10-15 minutes, then straining before incorporating into ganache. Can also be ground finely and added directly in small quantities (0.5-2% of total recipe weight) for more pronounced flavor.'
          }
        ],
        category: 'flavor'
      },
      'coffee-beans': {
        baseId: 'coffee-beans',
        name: 'Coffee Beans',
        ganacheCharacteristics: {
          cacaoFat: 0,
          sugar: 0,
          milkFat: 0,
          water: 2,
          solids: 98,
          otherFats: 0
        },
        description:
          'Whole roasted coffee beans used to infuse flavor into ganaches, creams, and chocolate preparations. Can be steeped in dairy or cream to extract coffee flavor and aroma. Common varieties include Arabica and Robusta beans from various origins.',
        allergens: [],
        traceAllergens: [],
        certifications: [],
        vegan: true,
        tags: ['coffee', 'infusion', 'aromatic', 'beans', 'whole', 'roasted', 'flavor-infusion'],
        density: 0.65,
        phase: 'solid',
        measurementUnits: {
          options: [
            {
              id: 'g'
            },
            {
              id: 'tsp'
            },
            {
              id: 'Tbsp'
            }
          ],
          preferredId: 'g'
        },
        urls: [],
        notes: [
          {
            category: 'ai',
            note: "Ganache characteristics represent roasted whole coffee beans. The composition is approximately 98% dry solids (including oils, proteins, carbohydrates, fiber, and caffeine) and 2% residual moisture. Coffee beans contain natural oils (10-15% of weight) which are included in the solids percentage rather than separated out as 'otherFats' since they remain bound within the bean structure when used whole for infusion. When using coffee beans in ganache, they are typically steeped in cream/dairy and then strained out, so the actual contribution to the final ganache depends on extraction efficiency and infusion time."
          },
          {
            category: 'ai',
            note: 'Density estimated at 0.65 g/mL for whole roasted coffee beans (bulk density). Individual bean density may vary based on roast level and origin.'
          }
        ],
        category: 'flavor'
      },
      'thai-tea': {
        baseId: 'thai-tea',
        name: 'Thai Tea',
        ganacheCharacteristics: {
          cacaoFat: 0,
          sugar: 0,
          milkFat: 0,
          water: 5,
          solids: 94,
          otherFats: 1
        },
        description:
          'Thai tea is a strongly brewed black tea blend, typically featuring Ceylon or Assam tea mixed with spices like star anise, cardamom, and sometimes vanilla or tamarind. Known for its distinctive orange color (often from food coloring in commercial versions) and sweet, creamy, spiced flavor profile. When used in chocolate applications, it provides aromatic, floral, and slightly spiced notes.',
        allergens: [],
        traceAllergens: [],
        certifications: [],
        vegan: true,
        tags: ['tea', 'thai', 'spiced', 'aromatic', 'infusion', 'asian', 'floral', 'black-tea'],
        density: 0.35,
        phase: 'solid',
        measurementUnits: {
          options: [
            {
              id: 'g'
            },
            {
              id: 'tsp'
            },
            {
              id: 'Tbsp'
            }
          ],
          preferredId: 'g'
        },
        urls: [],
        notes: [
          {
            category: 'ai',
            note: 'Ganache characteristics estimated for dried Thai tea leaves/powder: assumed minimal moisture (5% water), predominantly tea solids (94%), trace natural oils (1%). The composition can vary based on whether this is pure tea leaves, a pre-mixed blend with spices, or includes added sugar/creamer (this assumes pure tea). For infusion use in ganache, the tea would typically be steeped in cream or liquid, extracting flavor compounds while the solids are strained out.'
          },
          {
            category: 'ai',
            note: 'Density estimated at 0.35 g/mL for loose dried tea leaves. Thai tea blends vary widely - some are pure tea, others include sugar, food coloring, and spices pre-mixed. This entry assumes a basic dried tea blend without added sugar or dairy, suitable for infusing into chocolate ganache or cream.'
          }
        ],
        category: 'flavor'
      },
      'yuzu-extract': {
        baseId: 'yuzu-extract',
        name: 'Yuzu Extract',
        ganacheCharacteristics: {
          cacaoFat: 0,
          sugar: 5,
          milkFat: 0,
          water: 75,
          solids: 15,
          otherFats: 5
        },
        description:
          "A concentrated extract made from yuzu, a Japanese citrus fruit with a distinctive tart, floral, and aromatic flavor profile. Yuzu extract captures the essence of the fruit's zest and juice, providing intense citrus notes with hints of grapefruit, mandarin, and bergamot. Commonly used in ganaches, creams, and fillings to add bright, complex citrus flavor to chocolate confections.",
        allergens: [],
        traceAllergens: [],
        certifications: [],
        vegan: true,
        tags: ['citrus', 'japanese', 'asian', 'extract', 'flavoring', 'yuzu', 'aromatic', 'tart', 'floral'],
        density: 1.05,
        phase: 'liquid',
        measurementUnits: {
          options: [
            {
              id: 'g'
            },
            {
              id: 'mL'
            },
            {
              id: 'tsp'
            },
            {
              id: 'Tbsp'
            }
          ],
          preferredId: 'mL'
        },
        urls: [],
        notes: [
          {
            category: 'ai',
            note: 'Ganache characteristics are estimates based on typical extract compositions. Yuzu extract is primarily water-based with some dissolved solids (citrus oils, aromatics, flavor compounds), minimal natural sugars from the fruit, and trace amounts of natural citrus oils. The exact composition varies significantly by manufacturer and extraction method (alcohol-based vs. water-based vs. oil-based). This assumes a water-based extract with some alcohol or oil carrier. Commercial extracts may contain additional ingredients like alcohol (as preservative/carrier), natural flavors, or citric acid. Density estimate is slightly higher than water due to dissolved solids and oils. Use sparingly as the flavor is highly concentrated.'
          }
        ],
        category: 'flavor'
      },
      'vietnamese-coffee-concentrate': {
        baseId: 'vietnamese-coffee-concentrate',
        name: 'Vietnamese Coffee Concentrate',
        ganacheCharacteristics: {
          cacaoFat: 0,
          sugar: 0,
          milkFat: 0,
          water: 85,
          solids: 15,
          otherFats: 0
        },
        description:
          'A strong, concentrated coffee extract made from Vietnamese robusta coffee beans, typically prepared using the traditional phin filter method. This concentrate delivers intense coffee flavor with characteristic bold, earthy notes and slight bitterness. Often used in ganaches, truffles, and coffee-flavored confections.',
        allergens: [],
        traceAllergens: [],
        certifications: [],
        vegan: true,
        tags: [
          'coffee',
          'vietnamese',
          'concentrate',
          'extract',
          'robusta',
          'beverage',
          'flavoring',
          'liquid-flavoring'
        ],
        density: 1.02,
        phase: 'liquid',
        measurementUnits: {
          options: [
            {
              id: 'mL'
            },
            {
              id: 'g'
            },
            {
              id: 'tsp'
            },
            {
              id: 'Tbsp'
            }
          ],
          preferredId: 'mL'
        },
        urls: [],
        notes: [
          {
            category: 'ai',
            note: 'Ganache characteristics estimated based on typical coffee concentrate composition: approximately 85% water and 15% coffee solids (including caffeine, chlorogenic acids, and other extracted compounds). Actual composition may vary based on brewing method, concentration ratio, and bean variety. Density estimated at 1.02 g/mL for concentrated coffee extract. Vietnamese coffee concentrate is traditionally made strong, so this assumes a 3:1 to 4:1 concentration ratio compared to regular brewed coffee.'
          },
          {
            category: 'ai',
            note: "This ingredient is categorized as 'flavor' rather than 'liquid' because its primary function in chocolate-making is flavoring rather than hydration, though it does contribute water content to ganache formulations. When calculating water activity and shelf life, the water content (85%) should be factored into ganache recipes."
          }
        ],
        category: 'flavor'
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
        name: 'Guittard Coucher du Soleil 72% Dark',
        ganacheCharacteristics: {
          cacaoFat: 42,
          sugar: 27,
          milkFat: 0,
          water: 0,
          solids: 30,
          otherFats: 1
        },
        description:
          'Dark and rich chocolate with a smooth, creamy mouthfeel. Full-bodied throughout with a clean, fresh finish',
        manufacturer: 'Guittard',
        traceAllergens: ['milk'],
        certifications: [
          'fair-trade',
          'all-natural',
          'real-vanilla',
          'non-gmo',
          'peanut-free',
          'gluten-free'
        ],
        vegan: true,
        tags: ['dark', 'bittersweet', 'couverture', 'smooth', 'full-bodied'],
        category: 'chocolate',
        chocolateType: 'dark',
        cacaoPercentage: 72,
        fluidityStars: 4,
        viscosityMcM: 65,
        temperatureCurve: {
          melt: 45,
          working: 31
        },
        origins: ['South Pacific', 'West Africa', 'South America blend'],
        beanVarieties: ['Forastero', 'Trinitario'],
        applications: ['enrobing', 'molding', 'confectionary', 'ganache', 'mousse']
      },
      'lever-du-soleil-61': {
        baseId: 'lever-du-soleil-61',
        name: 'Guittard Lever du Soleil 61% Dark',
        ganacheCharacteristics: {
          cacaoFat: 38,
          sugar: 37,
          milkFat: 0,
          water: 0,
          solids: 24,
          otherFats: 1
        },
        description: 'Dark chocolate couverture with balanced sweetness and smooth texture',
        manufacturer: 'Guittard',
        traceAllergens: ['milk'],
        certifications: [
          'fair-trade',
          'all-natural',
          'real-vanilla',
          'non-gmo',
          'peanut-free',
          'gluten-free'
        ],
        vegan: true,
        tags: ['dark', 'bittersweet', 'couverture', 'balanced'],
        urls: [
          {
            category: 'product-page',
            url: 'https://www.guittard.com/our-chocolate/detail/pro_lever-du-soleil'
          }
        ],
        category: 'chocolate',
        chocolateType: 'dark',
        cacaoPercentage: 61,
        fluidityStars: 4,
        temperatureCurve: {
          melt: 45,
          working: 31
        },
        origins: ['South Pacific', 'West Africa', 'South America blend'],
        beanVarieties: ['Forastero', 'Trinitario'],
        applications: ['enrobing', 'molding', 'confectionary', 'ganache', 'mousse']
      },
      'creme-francaise-31': {
        baseId: 'creme-francaise-31',
        name: 'Guittard Crème Française 31% White',
        ganacheCharacteristics: {
          cacaoFat: 20,
          sugar: 47,
          milkFat: 8,
          water: 1,
          solids: 24,
          otherFats: 0
        },
        description:
          'French-style white chocolate with sweet fresh cream flavor, nutty undertones and lingering hint of citrus. Balanced, sweet dairy and rich cocoa butter taste',
        manufacturer: 'Guittard',
        allergens: ['milk'],
        certifications: [
          'fair-trade',
          'all-natural',
          'real-vanilla',
          'non-gmo',
          'peanut-free',
          'gluten-free'
        ],
        vegan: false,
        tags: ['white', 'french-style', 'creamy', 'citrus', 'nutty'],
        category: 'chocolate',
        chocolateType: 'white',
        cacaoPercentage: 31,
        fluidityStars: 4,
        viscosityMcM: 75,
        temperatureCurve: {
          melt: 45
        },
        applications: ['ganache', 'mousse', 'baking', 'ice-cream', 'sorbet', 'confectionary', 'drinks']
      },
      'letoile-du-nord-64': {
        baseId: 'letoile-du-nord-64',
        name: "Guittard L'Étoile du Nord 64% Dark",
        ganacheCharacteristics: {
          cacaoFat: 37,
          sugar: 34,
          milkFat: 0,
          water: 0,
          solids: 28,
          otherFats: 1
        },
        description:
          'High impact, lingering bittersweet chocolate balanced with minimal sweetness, dark color with warm chocolate and spice notes',
        manufacturer: 'Guittard',
        traceAllergens: ['milk'],
        certifications: [
          'fair-trade',
          'all-natural',
          'real-vanilla',
          'non-gmo',
          'peanut-free',
          'gluten-free'
        ],
        vegan: true,
        tags: ['dark', 'bittersweet', 'high-impact', 'spice', 'minimal-sweetness'],
        category: 'chocolate',
        chocolateType: 'dark',
        cacaoPercentage: 64,
        fluidityStars: 4,
        viscosityMcM: 85,
        temperatureCurve: {
          melt: 45,
          working: 31
        },
        applications: ['cremeux', 'ganache', 'mousse', 'baking', 'ice-cream', 'sorbet']
      },
      'la-nuit-noire-55': {
        baseId: 'la-nuit-noire-55',
        name: 'Guittard La Nuit Noire 55% Dark',
        ganacheCharacteristics: {
          cacaoFat: 33,
          sugar: 43,
          milkFat: 0,
          water: 0,
          solids: 23,
          otherFats: 1
        },
        description:
          'Classic deep chocolate flavor with pronounced fudge and multi-dimensional, balanced flavor profile. Nutty with lingering chocolate and vanilla finish',
        manufacturer: 'Guittard',
        traceAllergens: ['milk'],
        certifications: [
          'fair-trade',
          'all-natural',
          'real-vanilla',
          'non-gmo',
          'peanut-free',
          'gluten-free'
        ],
        vegan: true,
        tags: ['dark', 'classic', 'fudge', 'nutty', 'vanilla', 'balanced'],
        category: 'chocolate',
        chocolateType: 'dark',
        cacaoPercentage: 55,
        fluidityStars: 3,
        viscosityMcM: 115,
        temperatureCurve: {
          melt: 45,
          working: 31
        },
        applications: ['cremeux', 'ganache', 'mousse']
      },
      'soleil-dor-38': {
        baseId: 'soleil-dor-38',
        name: "Guittard Soleil d'Or 38% Milk",
        ganacheCharacteristics: {
          cacaoFat: 20,
          sugar: 40,
          milkFat: 8,
          water: 1,
          solids: 31,
          otherFats: 0
        },
        description:
          'Bold, rich upfront chocolate flavor accented with subtle caramel notes and lingering hint of cinnamon, fresh dairy flavor and spicy finish',
        manufacturer: 'Guittard',
        allergens: ['milk'],
        certifications: [
          'fair-trade',
          'all-natural',
          'real-vanilla',
          'non-gmo',
          'peanut-free',
          'gluten-free'
        ],
        vegan: false,
        tags: ['milk', 'bold', 'caramel', 'cinnamon', 'dairy', 'spicy'],
        category: 'chocolate',
        chocolateType: 'milk',
        cacaoPercentage: 38,
        fluidityStars: 4,
        temperatureCurve: {
          melt: 45,
          working: 30
        },
        applications: ['cremeux', 'ganache', 'mousse', 'baking', 'ice-cream', 'sorbet']
      },
      'guittard-onyx-72': {
        baseId: 'guittard-onyx-72',
        name: 'Guittard Onyx 72% Dark',
        ganacheCharacteristics: {
          cacaoFat: 40,
          sugar: 28,
          milkFat: 0,
          water: 1,
          solids: 31,
          otherFats: 0
        },
        description:
          'Guittard Onyx 72% is a deep, rich, bittersweet dark chocolate with an unsurpassed intense chocolate flavor, ideal for general-purpose use in ganache, molding, enrobing, and baking.',
        manufacturer: 'Guittard',
        allergens: ['soy'],
        traceAllergens: ['milk'],
        certifications: ['gluten-free', 'kosher', 'non-gmo'],
        vegan: false,
        tags: ['bittersweet', 'dark', 'wafers', 'couverture'],
        density: 1.3,
        phase: 'solid',
        notes: [
          {
            category: 'ai',
            note: "cacaoFat set to 40% based on product listing as 40% fat (primarily cocoa butter in high-cacao dark chocolate). sugar estimated as ~28% (100-72=28, typical for minimal non-cocoa ingredients). solids roughly estimated as non-fat cocoa solids ~31%. milkFat and otherFats at 0 as it's dark chocolate with no milk or added fats. water low at ~1% typical for couverture. Viscosity 130 McM from one retailer source. Fluidity estimated as medium (3 stars) given general-purpose use and not listed as high-fluidity. Trace milk allergen due to shared equipment. Not vegan due to possible dairy trace and vanilla (often non-vegan)."
          }
        ],
        category: 'chocolate',
        chocolateType: 'dark',
        cacaoPercentage: 72,
        fluidityStars: 3,
        viscosityMcM: 130,
        temperatureCurve: {
          melt: 45
        },
        origins: ["Côte d'Ivoire", 'Ghana'],
        beanVarieties: ['Blend'],
        applications: ['baking', 'confectionary', 'ganache', 'molding', 'enrobing', 'pralines']
      },
      'guittard-high-sierra-white-chocolate': {
        baseId: 'guittard-high-sierra-white-chocolate',
        name: 'Guittard High Sierra White Chocolate',
        ganacheCharacteristics: {
          cacaoFat: 30,
          sugar: 45,
          milkFat: 20,
          water: 1,
          solids: 3,
          otherFats: 1
        },
        manufacturer: 'Guittard',
        allergens: ['milk', 'soy'],
        traceAllergens: [],
        certifications: ['non-gmo', 'kosher-dairy'],
        vegan: false,
        tags: ['white chocolate', 'Guittard', 'baking'],
        density: 1.1,
        phase: 'solid',
        measurementUnits: {
          options: [
            {
              id: 'g'
            },
            {
              id: 'mL'
            }
          ],
          preferredId: 'g'
        },
        urls: [],
        notes: [
          {
            category: 'ai',
            note: 'The ganache characteristics are estimated based on typical white chocolate composition. Specific product details may vary.'
          }
        ],
        category: 'chocolate',
        chocolateType: 'white',
        cacaoPercentage: 0,
        fluidityStars: 3,
        viscosityMcM: 80,
        temperatureCurve: {
          melt: 45,
          cool: 27,
          working: 29
        },
        origins: ['Various'],
        beanVarieties: ['Blend'],
        applications: ['baking', 'confectionary', 'ganache', 'molding', 'cremeux']
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
        variations: [
          {
            variationSpec: '2026-01-01-01',
            name: 'Original',
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
                },
                {
                  id: 'common.ganache-hot-method'
                }
              ],
              preferredId: 'common.ganache-cold-method'
            }
          },
          {
            variationSpec: '2026-02-13-01-reduced',
            name: 'Reduced Batch',
            createdDate: '2026-02-13',
            ingredients: [
              {
                ingredient: {
                  ids: ['cacao-barry.guayaquil-64', 'common.chocolate-dark-64', 'felchlin.arriba-72'],
                  preferredId: 'cacao-barry.guayaquil-64'
                },
                amount: 300
              },
              {
                ingredient: {
                  ids: ['common.heavy-cream-36'],
                  preferredId: 'common.heavy-cream-36'
                },
                amount: 150
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
                    note: 'Added at 35°C for shine'
                  }
                ]
              }
            ],
            baseWeight: 465,
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
                },
                {
                  id: 'common.ganache-hot-method'
                }
              ],
              preferredId: 'common.ganache-cold-method'
            }
          }
        ],
        goldenVariationSpec: '2026-01-01-01'
      },
      'milk-ganache-classic': {
        baseId: 'milk-ganache-classic',
        name: 'Classic Milk Ganache',
        category: 'ganache',
        description:
          'Smooth milk chocolate ganache with caramel notes. Higher chocolate ratio compensates for milk solids.',
        tags: ['classic', 'milk', 'truffle', 'bonbon'],
        variations: [
          {
            variationSpec: '2026-01-01-01',
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
                },
                {
                  id: 'common.ganache-hot-method'
                }
              ],
              preferredId: 'common.ganache-cold-method'
            }
          }
        ],
        goldenVariationSpec: '2026-01-01-01'
      },
      'white-ganache-classic': {
        baseId: 'white-ganache-classic',
        name: 'Classic White Ganache',
        category: 'ganache',
        description:
          'Delicate white chocolate ganache with creamy vanilla notes. Higher chocolate ratio needed for proper emulsion and set.',
        tags: ['classic', 'white', 'truffle', 'bonbon'],
        variations: [
          {
            variationSpec: '2026-01-01-01',
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
                },
                {
                  id: 'common.ganache-hot-method'
                }
              ],
              preferredId: 'common.ganache-cold-method'
            }
          }
        ],
        goldenVariationSpec: '2026-01-01-01'
      },
      'vegan-ganache-coconut-cream': {
        baseId: 'vegan-ganache-coconut-cream',
        name: 'Vegan Ganache (Coconut Cream)',
        category: 'ganache',
        description:
          'Dairy-free ganache using full-fat coconut cream. Subtle coconut undertones complement the dark chocolate.',
        tags: ['vegan', 'dairy-free', 'dark', 'coconut'],
        variations: [
          {
            variationSpec: '2026-01-01-01',
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
                },
                {
                  id: 'common.ganache-hot-method'
                }
              ],
              preferredId: 'common.ganache-cold-method'
            }
          }
        ],
        goldenVariationSpec: '2026-01-01-01'
      },
      'vegan-ganache-coconut-oil': {
        baseId: 'vegan-ganache-coconut-oil',
        name: 'Vegan Ganache (Coconut Oil)',
        category: 'ganache',
        description:
          'Dairy-free ganache using coconut oil and water. Neutral flavor profile lets chocolate shine.',
        tags: ['vegan', 'dairy-free', 'dark', 'neutral'],
        variations: [
          {
            variationSpec: '2026-01-01-01',
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
                },
                {
                  id: 'common.ganache-hot-method'
                }
              ],
              preferredId: 'common.ganache-cold-method'
            }
          }
        ],
        goldenVariationSpec: '2026-01-01-01'
      },
      'caramelized-ganache': {
        baseId: 'caramelized-ganache',
        name: 'Caramelized Ganache',
        category: 'ganache',
        description:
          'Luxurious ganache made with caramelized white chocolate. Notes of dulce de leche and salted caramel.',
        tags: ['caramelized', 'blonde', 'truffle', 'bonbon', 'salted-caramel'],
        variations: [
          {
            variationSpec: '2026-01-01-01',
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
                },
                {
                  id: 'common.ganache-hot-method'
                }
              ],
              preferredId: 'common.ganache-cold-method'
            }
          }
        ],
        goldenVariationSpec: '2026-01-01-01'
      },
      'gianduja-basic': {
        baseId: 'gianduja-basic',
        name: 'Basic Gianduja',
        category: 'gianduja',
        description: 'Classic Italian hazelnut-chocolate combination. Smooth, nutty, and luxurious.',
        tags: ['gianduja', 'hazelnut', 'italian', 'praline'],
        variations: [
          {
            variationSpec: '2026-01-01-01',
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
        goldenVariationSpec: '2026-01-01-01'
      }
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
        name: '25mm hemisphere dome',
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
        name: '30mm hemisphere dome',
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
        name: '28mm bullet/ogive shape',
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
        name: '25mm square',
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
        name: 'Hex Swirl',
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
        tags: ['hex-swirl', 'praline'],
        urls: [
          {
            category: 'product-page',
            url: 'https://www.chocolateworld.be/winkel/moulds/frame-moulds/CW2227'
          }
        ]
      },
      'chocolate-world-cw1988': {
        baseId: 'chocolate-world-cw1988',
        manufacturer: 'Chocolate World',
        productNumber: 'CW1988',
        name: 'Pleated Leaf',
        cavities: {
          kind: 'grid',
          columns: 7,
          rows: 3,
          info: {
            weight: 12,
            dimensions: {
              width: 30.5,
              length: 33.5,
              depth: 19
            }
          }
        },
        format: 'series-1000',
        tags: ['leaf', 'pleated', 'botanical', 'polycarbonate', 'bonbon'],
        related: [],
        notes: [
          {
            category: 'ai',
            note: 'Dimensions and weight per cavity sourced from multiple retailer listings (Amazon, Vantage House, Pastry Chefs Boutique); consistent across sources as 33.5 x 30.5 x 19 mm and 12g. Mold size confirms series-1000 (135x275mm). Layout is grid 3 rows x 7 columns totaling 21 cavities.'
          }
        ],
        urls: [
          {
            category: 'manufacturer',
            url: 'https://www.chocolateworld.be/'
          },
          {
            category: 'purchase',
            url: 'https://www.amazon.com/Chocolate-World-CW1988-Pleated-Leaf-Polycarbonate/dp/B08NTNX7F3'
          }
        ]
      },
      'chocolate-world-cw12060': {
        baseId: 'chocolate-world-cw12060',
        manufacturer: 'Chocolate World',
        productNumber: 'CW12060',
        name: 'The Duel',
        description: 'Signature modern square praline with tapered design by Paul Wagemaker',
        cavities: {
          kind: 'grid',
          columns: 7,
          rows: 3,
          info: {
            weight: 14,
            dimensions: {
              width: 30,
              length: 30,
              depth: 20.5
            }
          }
        },
        format: 'series-1000',
        tags: ['square', 'modern', 'praline', 'bonbon', 'polycarbonate', 'signature', 'paul-wagemaker'],
        related: [],
        notes: [
          {
            category: 'ai',
            note: "CW12060 is a signature mold 'The Duel' designed in collaboration with Paul Wagemaker. Features 21 cavities in 3x7 grid layout. Cavity dimensions consistently listed as 30x30x20.5 mm with 14g chocolate capacity across sources (Vantage House, Pastry Chefs Boutique, Chocolate World catalog excerpts, Sweetlink). Mold frame: 275x135x26 mm, confirming series-1000 format. Described as a modern square/tapered praline shape suitable for bonbons. Video demo available on Chocolate World's YouTube."
          }
        ],
        urls: [
          {
            category: 'manufacturer',
            url: 'https://www.chocolateworld.be/winkel/moulds/frame-moulds/CW12060'
          },
          {
            category: 'manufacturer',
            url: 'https://www.chocolateworld.be/pdf/Signature_moulds.pdf'
          },
          {
            category: 'purchase',
            url: 'https://www.vantagehouse.com/product/moulds/chocolate-world-moulds/CW12060'
          },
          {
            category: 'purchase',
            url: 'https://www.chocolat-chocolat.com/product/chocolate-mold-the-duel-by-paul-wagemaker'
          },
          {
            category: 'purchase',
            url: 'https://www.pastrychefsboutique.com/CHOCOLATE/Chocolate-Molds/polycarbonate-chocolate-molds/Modern-Shaped-Molds/chocolate-world-cw12060-polycarbonate-chocolate-mold-the-duel-by-paul-wagemaker-30mm-x-30mm-x-205mm-14gr-21-cavity-modern-shaped'
          },
          {
            category: 'video',
            url: 'https://www.youtube.com/watch?v=FY8DJTc3eRs'
          }
        ]
      },
      'chocolate-world-cw12027': {
        baseId: 'chocolate-world-cw12027',
        manufacturer: 'Chocolate World',
        productNumber: 'CW12027',
        name: 'The Taster',
        description:
          "Signature mold 'The Taster' designed by Lana Orlova Bauer, featuring 21 squeezed-in-the-middle half-sphere cavities, ideal for filled pralines or bonbons with glossy finish",
        cavities: {
          kind: 'grid',
          columns: 7,
          rows: 3,
          info: {
            weight: 13.5,
            dimensions: {
              width: 29.5,
              length: 34.5,
              depth: 17
            }
          }
        },
        format: 'series-1000',
        tags: ['bonbon', 'praline', 'polycarbonate', 'signature', 'modern', 'filled'],
        notes: [
          {
            category: 'ai',
            note: "Dimensions consistently listed as 34.5 x 29.5 x 17 mm across sources (length x width x height/depth); weight per cavity 13.5g from official catalog and retailer specs. Format 'series-1000' confirmed via multiple sources as 275x135mm frame. Cavity shape described as 'squeezed-in-the-middle half-sphere' or similar modern abstract form. Grid is 3 rows x 7 columns totaling 21 cavities. Same model referenced as CW2468 in some contexts."
          }
        ],
        urls: [
          {
            category: 'manufacturer-catalog-reference',
            url: 'https://www.chocolateworld.be/pdf/CW_Moulds2026.pdf'
          },
          {
            category: 'purchase',
            url: 'https://www.amazon.com/Chocolate-World-CW12027-Polycarbonate-Lana-Orlova-Bauer/dp/B09L1LSG8Y'
          },
          {
            category: 'purchase',
            url: 'https://www.vantagehouse.com/product/moulds/chocolate-world-moulds/CW12027'
          },
          {
            category: 'purchase',
            url: 'https://zuccherocanada.us/products/the-taster-lana-orlova-bauer-chocolate-mold-cw12027'
          }
        ]
      },
      'chocolate-world-cw1840': {
        baseId: 'chocolate-world-cw1840',
        manufacturer: 'Chocolate World',
        productNumber: 'CW1840',
        name: 'Cube with edge',
        description:
          'Dan Forgey signature polycarbonate mold featuring 24 modern cube-shaped cavities with a slanted or flattened edge/corner, ideal for glossy pralines or bonbons',
        cavities: {
          kind: 'grid',
          columns: 8,
          rows: 3,
          info: {
            weight: 12,
            dimensions: {
              width: 23,
              length: 23,
              depth: 20
            }
          }
        },
        format: 'series-1000',
        tags: ['cube', 'modern', 'bonbon', 'praline', 'polycarbonate', 'signature', 'dan forgey'],
        notes: [
          {
            category: 'ai',
            note: "Cavity dimensions consistently reported as 23 x 23 x 20 mm (width x length x depth/height) across multiple retailers and manufacturer specs. Weight per cavity 12g confirmed in official and sales listings. Layout 3 rows x 8 columns for 24 cavities. Format 'series-1000' (275x135mm) verified in product details. Shape described as 'cube with edge', 'cube with slanted edge', or 'square flattened at one corner'. Mold overall height ~30mm."
          }
        ],
        urls: [
          {
            category: 'manufacturer',
            url: 'https://www.chocolateworld.be/winkel/vormen/kadervormen/CW1840'
          },
          {
            category: 'purchase',
            url: 'https://www.amazon.com/Chocolate-World-CW1840-Polycarbonate-Dan-Forgey-Square/dp/B09L1KP2ND'
          },
          {
            category: 'purchase',
            url: 'https://www.vantagehouse.com/product/moulds/chocolate-world-moulds/CW1840'
          },
          {
            category: 'purchase',
            url: 'https://zuccherocanada.us/products/dan-forgey-chocolate-mold-cw1840'
          },
          {
            category: 'purchase',
            url: 'https://www.pastrychefsboutique.com/CHOCOLATE/Chocolate-Molds/polycarbonate-chocolate-molds/Modern-Shaped-Molds/chocolate-world-cw1840-polycarbonate-cube-with-edge-by-dan-forgey-chocolate-mold-23-x-23-x-20-mm-12gr-3x8-cavity-275x135x24mm-mo'
          }
        ]
      },
      'chocolate-world-cw1301': {
        baseId: 'chocolate-world-cw1301',
        manufacturer: 'Chocolate World',
        productNumber: 'CW1301',
        name: 'Wiro',
        description:
          "Polycarbonate chocolate mold featuring hexagonal or square cavities with a spiral 'wiro' swirl design on the bottom, creating elegant pralines or bonbons with decorative texture",
        cavities: {
          kind: 'grid',
          columns: 8,
          rows: 3,
          info: {
            weight: 10,
            dimensions: {
              width: 30,
              length: 30,
              depth: 16
            }
          }
        },
        format: 'series-1000',
        tags: ['bonbon', 'praline', 'swirl', 'hexagonal', 'wiro', 'polycarbonate', 'fantasy'],
        notes: [
          {
            category: 'ai',
            note: "Cavity dimensions Ø30x16 mm (circular/round base with swirl, listed as 30x30x16 mm in rectangular approximation) from multiple retailer specs and catalog. Weight per cavity 10g consistent across sources. Layout 3 rows x 8 columns for 24 cavities in series-1000 (275x135 mm) frame, mold height 24 mm. Shape named 'Wiro' referring to spiral/swirl design, often categorized under fantasy or modern pralines; same model as CW2227 in series-2000. Dimensions are internal cavity specs; weight based on solid milk chocolate molding."
          }
        ],
        urls: [
          {
            category: 'manufacturer',
            url: 'https://www.chocolateworld.be/winkel/vormen/kadervormen/CW1301'
          },
          {
            category: 'purchase',
            url: 'https://www.vantagehouse.com/product/moulds/chocolate-world-moulds/CW1301'
          },
          {
            category: 'purchase',
            url: 'https://secure.auifinefoods.com/polycarbonate-mold-wiro-27-5x13-5x2-4cm-8613011301'
          },
          {
            category: 'catalog-reference',
            url: 'https://cocoaoutlet.com/media/pdf/CWmoulds13.pdf'
          }
        ]
      }
    }
  },
  greyas: {
    metadata: {
      name: 'Greyas',
      description: 'Polycarbonate Chocolate Molds by Greyas plastics'
    },
    items: {
      'greyas-cm-3843': {
        baseId: 'greyas-cm-3843',
        manufacturer: 'Greyas',
        productNumber: 'CM-3843',
        name: 'Heart‑cylinder (Luis Amado Signature)',
        cavities: {
          kind: 'grid',
          columns: 6,
          rows: 4,
          info: {
            weight: 12.5,
            dimensions: {
              width: 30,
              length: 30,
              depth: 16
            }
          }
        },
        format: 'series-2000',
        tags: ['polycarbonate', 'bonbon', 'heart', 'cylinder', 'luis-amado'],
        related: [],
        notes: [
          {
            category: 'ai',
            note: 'Dimensions, weight, cavity count, and frame size are taken from product listings (24 cavities, 30×16 mm, 12.5 g, 275×175 mm). Grid layout inferred from 24‑piece arrangement.'
          }
        ],
        urls: [
          {
            category: 'purchase',
            url: 'https://greyas.com/products/cm-3843-luis-amado-signature-herz-pralinen-schokoladenform'
          },
          {
            category: 'purchase',
            url: 'https://homenkitchenshop.com/products/greyas-cm-3843-louis-amado-clear-polycarbonate-chocolate-mold'
          },
          {
            category: 'purchase',
            url: 'https://amazon.com/dp/B09QD36Q4J'
          }
        ]
      },
      cm1207: {
        baseId: 'cm1207',
        manufacturer: 'Greyas',
        productNumber: 'CM1207',
        name: 'Praline Mayan Pyramide',
        description: 'Mayan Pyramide praline chocolate mold with 24 cavities, each holding 12g of chocolate.',
        cavities: {
          kind: 'grid',
          columns: 6,
          rows: 4,
          info: {
            weight: 12,
            dimensions: {
              width: 26,
              length: 26,
              depth: 22
            }
          }
        },
        format: 'series-2000',
        tags: ['praline', 'mayan', 'pyramide', 'pyramid', 'polycarbonate'],
        notes: [
          {
            category: 'ai',
            note: 'Grid layout assumed as 6 columns x 4 rows based on mold dimensions (275x175mm) and 24 cavities, typical for Greyas series-2000 praline molds. Cavity dimensions sourced from retailer ChocDepot.com; confirmed weight 12g per cavity from manufacturer site.'
          }
        ],
        urls: [
          {
            category: 'manufacturer',
            url: 'https://www.greyas.com/products/cm-1207-pralin-cikolata-kalibi'
          },
          {
            category: 'purchase',
            url: 'https://www.chocdepot.com/Urun/greyas-cm-1207-polycarbon-chocolate-mold'
          }
        ]
      },
      'cm-3898': {
        baseId: 'cm-3898',
        manufacturer: 'Greyas',
        productNumber: 'CM-3898',
        name: 'Soft Square Praline',
        description:
          'Soft square praline chocolate mould with 24 cavities, each holding 12g of chocolate. Mold dimensions: 275 x 175 mm.',
        cavities: {
          kind: 'grid',
          columns: 6,
          rows: 4,
          info: {
            weight: 12,
            dimensions: {
              width: 36,
              length: 36,
              depth: 15.9
            }
          }
        },
        format: 'series-2000',
        tags: ['praline', 'square', 'soft square', 'bonbon', 'polycarbonate'],
        notes: [
          {
            category: 'ai',
            note: 'Grid layout estimated as 4 rows x 6 columns based on mold size (275x175mm) and cavity dimensions (36x36mm); not explicitly stated on manufacturer page. Cavity depth and weight directly from product specifications.'
          }
        ],
        urls: [
          {
            category: 'manufacturer',
            url: 'https://www.greyas.com/products/cm-3898'
          }
        ]
      }
    }
  },
  implast: {
    metadata: {
      name: 'Implast',
      description: 'Polycarbonate Chocolate Molds by Implast Plastics',
      tags: ['implast']
    },
    items: {
      'chef-jungstedt-sm-1': {
        baseId: 'chef-jungstedt-sm-1',
        manufacturer: 'Implast',
        productNumber: '753',
        name: 'Chef Jungstedt SM-1 Dome',
        cavities: {
          kind: 'grid',
          columns: 7,
          rows: 4,
          info: {
            weight: 11,
            dimensions: {
              width: 31,
              length: 31,
              depth: 18
            }
          }
        },
        format: 'other',
        tags: ['polycarbonate', 'bonbon', 'dome', 'chef-jungstedt', 'implast'],
        related: [],
        notes: [
          {
            category: 'ai',
            note: "Dimensions, weight, and layout are taken directly from product listings; manufacturer series format is not specified, so 'other' is used."
          }
        ],
        urls: [
          {
            category: 'purchase',
            url: 'https://chocolat-chocolat.com/products/chocolate-and-praline-mold-smooth-dome'
          },
          {
            category: 'purchase',
            url: 'https://tantfondant.se/products/implast-pralinform-nr-753-chef-jungstedt'
          }
        ]
      }
    }
  },
  martellato: {
    metadata: {
      name: 'Martellato'
    },
    items: {}
  },
  other: {
    metadata: {
      name: 'Other'
    },
    items: {
      'cabrellon-10176-coffee-cup': {
        baseId: 'cabrellon-10176-coffee-cup',
        manufacturer: 'Cabrellon',
        productNumber: '10176',
        name: 'Coffee cup',
        description:
          'Small coffee cup / tea cup shaped cavities in a classic mini format, suitable for bonbons or hollow shells',
        cavities: {
          kind: 'grid',
          columns: 8,
          rows: 4,
          info: {
            weight: 9.4,
            dimensions: {
              width: 26,
              length: 26,
              depth: 15.6
            }
          }
        },
        format: 'series-2000',
        tags: ['cup', 'coffee cup', 'tea cup', 'mini', 'polycarbonate', 'bonbon'],
        notes: [
          {
            category: 'ai',
            note: "Weight per cavity approximated as ~9.4g based on 1/3oz (≈9.45g) from one retailer listing; exact manufacturer weight may vary slightly as approximations are common. Dimensions Ø 26mm (taken as width/length) and height 15.6mm from catalog excerpt. Format 'series-2000' assigned due to 275x175mm size matching the larger series. Listed as 'coffee cup' per user query but often described as 'small tea cup' or 'tiny cup' in sources."
          }
        ],
        urls: [
          {
            category: 'manufacturer-catalog-reference',
            url: 'https://www.cabrellon.it/wp-content/uploads/2023/05/CATALOGO-23-1.pdf'
          },
          {
            category: 'purchase',
            url: 'https://www.homechocolatefactory.com/PROD/PMC10176.html'
          },
          {
            category: 'purchase',
            url: 'https://www.chocolat-chocolat.com/product/art10176-chocolate-mold-tiny-cup'
          }
        ]
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
              taskId: 'common.melt-chocolate',
              params: {
                ingredient: 'chocolate',
                temp: 45
              }
            },
            activeTime: 5,
            temperature: 45
          },
          {
            order: 2,
            task: {
              taskId: 'common.warm-ingredient',
              params: {
                ingredient: 'cream',
                temp: 35
              }
            },
            activeTime: 3,
            temperature: 35
          },
          {
            order: 3,
            task: {
              taskId: 'common.combine-and-emulsify',
              params: {
                tool: 'immersion blender'
              }
            },
            activeTime: 5
          },
          {
            order: 4,
            task: {
              taskId: 'common.add-and-blend',
              params: {
                ingredient: 'butter',
                temp: 35
              }
            },
            activeTime: 2,
            temperature: 35
          },
          {
            order: 5,
            task: {
              taskId: 'common.rest-at-temperature',
              params: {
                temp: 'room temperature'
              }
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
              taskId: 'common.bring-to-boil',
              params: {
                ingredient: 'cream'
              }
            },
            activeTime: 5,
            temperature: 100
          },
          {
            order: 2,
            task: {
              taskId: 'common.pour-over',
              params: {
                source: 'cream',
                target: 'finely chopped chocolate'
              }
            },
            activeTime: 1
          },
          {
            order: 3,
            task: {
              taskId: 'common.let-stand',
              params: {
                duration: 2
              }
            },
            waitTime: 2
          },
          {
            order: 4,
            task: {
              taskId: 'common.stir-to-emulsify',
              params: {}
            },
            activeTime: 5
          },
          {
            order: 5,
            task: {
              taskId: 'common.blend-until-smooth',
              params: {
                ingredient: 'butter'
              }
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
              taskId: 'common.roast-nuts',
              params: {
                nuts: 'hazelnuts',
                temp: 150
              }
            },
            activeTime: 15,
            temperature: 150
          },
          {
            order: 2,
            task: {
              taskId: 'common.remove-skins',
              params: {}
            },
            activeTime: 5
          },
          {
            order: 3,
            task: {
              taskId: 'common.grind-to-paste',
              params: {
                ingredient: 'hazelnuts'
              }
            },
            activeTime: 10
          },
          {
            order: 4,
            task: {
              taskId: 'common.melt-chocolate',
              params: {
                ingredient: 'chocolate',
                temp: 45
              }
            },
            activeTime: 5,
            temperature: 45
          },
          {
            order: 5,
            task: {
              taskId: 'common.combine-and-mix',
              params: {
                ingredients: 'paste and chocolate'
              }
            },
            activeTime: 5
          },
          {
            order: 6,
            task: {
              taskId: 'common.temper-and-mold',
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
      },
      'transfer-sheet-application': {
        baseId: 'transfer-sheet-application',
        name: 'Transfer Sheet Application',
        category: 'decoration',
        steps: [
          {
            order: 1,
            task: {
              task: {
                baseId: 'transfer-sheet-step-1',
                name: 'Prepare Mold Surface',
                template: 'Ensure mold cavities are clean and polished'
              },
              params: {}
            },
            activeTime: 2
          },
          {
            order: 2,
            task: {
              task: {
                baseId: 'transfer-sheet-step-2',
                name: 'Cut Transfer Sheet',
                template: 'Cut transfer sheet to fit mold cavity dimensions'
              },
              params: {}
            },
            activeTime: 3
          },
          {
            order: 3,
            task: {
              task: {
                baseId: 'transfer-sheet-step-3',
                name: 'Apply to Mold',
                template: 'Press transfer sheet (printed side down) into mold cavity'
              },
              params: {}
            },
            activeTime: 5,
            notes: [
              {
                category: 'user',
                note: 'Ensure no air bubbles between sheet and mold surface'
              }
            ]
          },
          {
            order: 4,
            task: {
              task: {
                baseId: 'transfer-sheet-step-4',
                name: 'Pour Tempered Chocolate',
                template: 'Pour tempered chocolate over transfer sheet and proceed with shell method'
              },
              params: {}
            },
            activeTime: 5,
            temperature: 31
          },
          {
            order: 5,
            task: {
              task: {
                baseId: 'transfer-sheet-step-5',
                name: 'Peel Transfer Sheet',
                template: 'After chocolate sets, peel away transfer sheet backing to reveal pattern'
              },
              params: {}
            },
            activeTime: 2,
            waitTime: 15,
            temperature: 16
          }
        ],
        tags: ['decoration', 'transfer', 'cocoa-butter', 'pattern']
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
        goldenVariationSpec: '2026-01-01-01',
        variations: [
          {
            variationSpec: '2026-01-01-01',
            name: 'Single Fill',
            createdDate: '2026-01-01',
            notes: [
              {
                category: 'user',
                note: 'Basic dome bonbon with dark ganache filling'
              }
            ],
            yield: {
              numFrames: 2
            },
            fillings: [
              {
                slotId: 'center',
                filling: {
                  options: [
                    {
                      type: 'recipe',
                      id: 'common.dark-ganache-classic'
                    },
                    {
                      type: 'recipe',
                      id: 'common.milk-ganache-classic'
                    },
                    {
                      type: 'recipe',
                      id: 'common.caramelized-ganache'
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
                },
                {
                  id: 'cw.chocolate-world-cw-2227'
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
            decorations: {
              options: [
                {
                  id: 'common.gold-leaf-accent'
                },
                {
                  id: 'common.cocoa-butter-transfer'
                }
              ],
              preferredId: 'common.gold-leaf-accent'
            }
          },
          {
            variationSpec: '2026-02-13-01-dual-fill',
            name: 'Dual Fill',
            createdDate: '2026-02-13',
            notes: [
              {
                category: 'user',
                note: 'Dual-fill: gianduja base with dark ganache cap'
              }
            ],
            yield: {
              numFrames: 1
            },
            fillings: [
              {
                slotId: 'inner',
                name: 'Gianduja Base',
                filling: {
                  options: [
                    {
                      type: 'recipe',
                      id: 'common.gianduja-basic'
                    }
                  ],
                  preferredId: 'common.gianduja-basic'
                }
              },
              {
                slotId: 'center',
                name: 'Ganache Cap',
                filling: {
                  options: [
                    {
                      type: 'recipe',
                      id: 'common.dark-ganache-classic'
                    },
                    {
                      type: 'recipe',
                      id: 'common.milk-ganache-classic'
                    },
                    {
                      type: 'recipe',
                      id: 'common.caramelized-ganache'
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
                },
                {
                  id: 'cw.chocolate-world-cw-2227'
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
            decorations: {
              options: [
                {
                  id: 'common.gold-leaf-accent'
                },
                {
                  id: 'common.cocoa-butter-transfer'
                }
              ],
              preferredId: 'common.gold-leaf-accent'
            }
          }
        ]
      },
      'dark-bar-truffle': {
        baseId: 'dark-bar-truffle',
        confectionType: 'bar-truffle',
        name: 'Classic Dark Bar Truffle',
        description: 'Ganache slab cut into squares and enrobed',
        tags: ['classic', 'dark', 'bar', 'enrobed'],
        goldenVariationSpec: '2026-01-01-01',
        variations: [
          {
            variationSpec: '2026-01-01-01',
            createdDate: '2026-01-01',
            notes: [
              {
                category: 'user',
                note: 'Standard 25mm square bar truffles'
              }
            ],
            yield: {
              numPieces: 48,
              weightPerPiece: 10,
              dimensions: {
                width: 25,
                height: 25,
                depth: 8
              }
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
            decorations: {
              options: [
                {
                  id: 'common.dipping-fork-wave'
                },
                {
                  id: 'common.cocoa-powder-dusting'
                }
              ],
              preferredId: 'common.dipping-fork-wave'
            }
          }
        ]
      },
      'dark-cocoa-truffle': {
        baseId: 'dark-cocoa-truffle',
        confectionType: 'rolled-truffle',
        name: 'Classic Cocoa-Dusted Truffle',
        description: 'Hand-rolled ganache truffle dusted with cocoa powder',
        tags: ['classic', 'dark', 'rolled', 'cocoa'],
        goldenVariationSpec: '2026-01-01-01',
        variations: [
          {
            variationSpec: '2026-01-01-01',
            createdDate: '2026-01-01',
            notes: [
              {
                category: 'user',
                note: 'Traditional rolled truffle with cocoa coating'
              }
            ],
            yield: {
              numPieces: 40,
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

/**
 * Generated decoration collections from source YAML files.
 * @public
 */
export const decorationCollections: Record<string, JsonObject> = {
  common: {
    metadata: {
      name: 'Common Decorations',
      description: 'Seed data decorations for the decorations library'
    },
    items: {
      'gold-leaf-accent': {
        baseId: 'gold-leaf-accent',
        name: 'Gold Leaf Accent',
        description: 'Delicate gold leaf applied to dome peak for an elegant finish',
        ingredients: [
          {
            ingredient: {
              ids: ['common.gold-leaf'],
              preferredId: 'common.gold-leaf'
            },
            amount: 1
          }
        ],
        tags: ['elegant', 'gold', 'accent'],
        ratings: [
          {
            category: 'difficulty',
            score: 3,
            notes: [
              {
                category: 'user',
                note: 'Requires steady hand and tweezers'
              }
            ]
          },
          {
            category: 'durability',
            score: 4
          },
          {
            category: 'appearance',
            score: 5
          }
        ]
      },
      'cocoa-butter-transfer': {
        baseId: 'cocoa-butter-transfer',
        name: 'Cocoa Butter Transfer Sheet',
        description: 'Decorative pattern applied via colored cocoa butter transfer sheet',
        ingredients: [
          {
            ingredient: {
              ids: ['common.cocoa-butter-colored'],
              preferredId: 'common.cocoa-butter-colored'
            },
            amount: 5
          }
        ],
        procedures: {
          options: [
            {
              id: 'common.transfer-sheet-application'
            }
          ],
          preferredId: 'common.transfer-sheet-application'
        },
        tags: ['transfer', 'pattern', 'cocoa-butter'],
        ratings: [
          {
            category: 'difficulty',
            score: 2
          },
          {
            category: 'durability',
            score: 5
          },
          {
            category: 'appearance',
            score: 4
          }
        ]
      },
      'dipping-fork-wave': {
        baseId: 'dipping-fork-wave',
        name: 'Dipping Fork Wave Pattern',
        description: 'Classic wave pattern created with a dipping fork during enrobing',
        ingredients: [
          {
            ingredient: {
              ids: ['common.chocolate-dark-64', 'cacao-barry.guayaquil-64'],
              preferredId: 'common.chocolate-dark-64'
            },
            amount: 5,
            notes: [
              {
                category: 'user',
                note: 'Uses same chocolate as enrobing'
              }
            ]
          }
        ],
        tags: ['classic', 'enrobed', 'wave'],
        ratings: [
          {
            category: 'difficulty',
            score: 2
          },
          {
            category: 'durability',
            score: 5
          },
          {
            category: 'appearance',
            score: 3
          }
        ]
      },
      'cocoa-powder-dusting': {
        baseId: 'cocoa-powder-dusting',
        name: 'Cocoa Powder Light Dusting',
        description: 'Light dusting of cocoa powder for a rustic finish',
        ingredients: [
          {
            ingredient: {
              ids: ['common.cocoa-powder'],
              preferredId: 'common.cocoa-powder'
            },
            amount: 5
          }
        ],
        tags: ['classic', 'rustic', 'cocoa'],
        ratings: [
          {
            category: 'difficulty',
            score: 1
          },
          {
            category: 'durability',
            score: 3
          },
          {
            category: 'appearance',
            score: 3
          }
        ]
      }
    }
  }
};
/* eslint-enable @typescript-eslint/naming-convention */
