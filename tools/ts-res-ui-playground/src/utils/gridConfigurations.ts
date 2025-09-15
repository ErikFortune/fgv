import { GridTools } from '@fgv/ts-res-ui-components';

/**
 * Sample grid configurations for demonstrating GridView functionality
 * with the test data available in the playground.
 */

export const sampleGridConfigurations: GridTools.GridViewInitParams[] = [
  {
    id: 'app-config',
    title: 'Application Configuration',
    description: 'View and edit application configuration values across different territories',
    resourceSelection: { type: 'ids', resourceIds: ['grid-demo-collection.app-config'] },
    columnMapping: [
      {
        resourceType: 'json',
        columns: [
          {
            id: 'currency',
            title: 'Currency',
            dataPath: 'currency',
            editable: true,
            cellType: 'dropdown',
            dropdownOptions: [
              { value: 'USD', label: 'US Dollar' },
              { value: 'CAD', label: 'Canadian Dollar' },
              { value: 'GBP', label: 'British Pound' },
              { value: 'EUR', label: 'Euro' }
            ],
            validation: { required: true }
          },
          {
            id: 'dateFormat',
            title: 'Date Format',
            dataPath: 'dateFormat',
            editable: true,
            cellType: 'dropdown',
            dropdownOptions: [
              { value: 'MM/DD/YYYY', label: 'MM/DD/YYYY (US)' },
              { value: 'DD/MM/YYYY', label: 'DD/MM/YYYY (International)' },
              { value: 'YYYY-MM-DD', label: 'YYYY-MM-DD (ISO)' }
            ],
            validation: { required: true }
          },
          {
            id: 'timeFormat',
            title: 'Time Format',
            dataPath: 'timeFormat',
            editable: true,
            cellType: 'dropdown',
            dropdownOptions: [
              { value: '12h', label: '12 Hour' },
              { value: '24h', label: '24 Hour' }
            ]
          },
          {
            id: 'measurement',
            title: 'Measurement System',
            dataPath: 'measurement',
            editable: true,
            cellType: 'dropdown',
            dropdownOptions: [
              { value: 'imperial', label: 'Imperial' },
              { value: 'metric', label: 'Metric' }
            ]
          },
          {
            id: 'supportEmail',
            title: 'Support Email',
            dataPath: 'supportEmail',
            editable: true,
            cellType: 'string',
            validation: {
              required: true,
              pattern: /^[^\s@]+@[^\s@]+\.[^\s@]+$/,
              maxLength: 100
            }
          },
          {
            id: 'supportPhone',
            title: 'Support Phone',
            dataPath: 'supportPhone',
            editable: true,
            cellType: 'string',
            validation: {
              required: true,
              pattern: /^\+?[\d\s\-\(\)]{10,}$/,
              maxLength: 20
            }
          },
          {
            id: 'isActive',
            title: 'Active',
            dataPath: 'isActive',
            editable: true,
            cellType: 'boolean'
          },
          {
            id: 'maintenanceMode',
            title: 'Maintenance Mode',
            dataPath: 'maintenanceMode',
            editable: true,
            cellType: 'boolean'
          },
          {
            id: 'betaFeatures',
            title: 'Beta Features',
            dataPath: 'betaFeatures',
            editable: true,
            cellType: 'tristate',
            triStatePresentation: 'dropdown',
            triStateLabels: {
              trueLabel: 'Enabled',
              falseLabel: 'Disabled',
              undefinedLabel: 'Not Set'
            }
          }
        ]
      }
    ]
  },

  {
    id: 'common-strings',
    title: 'Common UI Strings',
    description: 'Localized common strings used throughout the application',
    resourceSelection: { type: 'ids', resourceIds: ['grid-demo-collection.common'] },
    columnMapping: [
      {
        resourceType: 'json',
        columns: [
          {
            id: 'welcome',
            title: 'Welcome Message',
            dataPath: 'welcome',
            editable: true,
            cellType: 'string',
            validation: {
              required: true,
              minLength: 5,
              maxLength: 100
            }
          },
          {
            id: 'hello',
            title: 'Hello',
            dataPath: 'hello',
            editable: true,
            cellType: 'string',
            validation: {
              required: true,
              maxLength: 50
            }
          },
          {
            id: 'goodbye',
            title: 'Goodbye',
            dataPath: 'goodbye',
            editable: true,
            cellType: 'string',
            validation: {
              required: true,
              maxLength: 50
            }
          },
          {
            id: 'yes',
            title: 'Yes',
            dataPath: 'yes',
            editable: true,
            cellType: 'string',
            validation: {
              required: true,
              maxLength: 20
            }
          },
          {
            id: 'no',
            title: 'No',
            dataPath: 'no',
            editable: true,
            cellType: 'string',
            validation: {
              required: true,
              maxLength: 20
            }
          },
          {
            id: 'cancel',
            title: 'Cancel',
            dataPath: 'cancel',
            editable: true,
            cellType: 'string',
            validation: {
              required: true,
              maxLength: 30
            }
          },
          {
            id: 'loading',
            title: 'Loading Text',
            dataPath: 'loading',
            editable: true,
            cellType: 'string',
            validation: {
              required: true,
              maxLength: 50
            }
          },
          {
            id: 'showProgressBar',
            title: 'Show Progress Bar',
            dataPath: 'showProgressBar',
            editable: true,
            cellType: 'boolean'
          },
          {
            id: 'enableDebugMode',
            title: 'Debug Mode',
            dataPath: 'enableDebugMode',
            editable: true,
            cellType: 'tristate',
            triStatePresentation: 'checkbox'
          }
        ]
      }
    ]
  },

  {
    id: 'ui-terms',
    title: 'UI Terminology',
    description: 'Region-specific UI terminology and spelling variations',
    resourceSelection: { type: 'ids', resourceIds: ['grid-demo-collection.ui-terms'] },
    columnMapping: [
      {
        resourceType: 'json',
        columns: [
          {
            id: 'ShoppingCart',
            title: 'Shopping Cart',
            dataPath: 'ShoppingCart',
            editable: true,
            cellType: 'string',
            validation: {
              required: true,
              maxLength: 50
            }
          },
          {
            id: 'ZipCode',
            title: 'Zip/Postal Code',
            dataPath: 'ZipCode',
            editable: true,
            cellType: 'string',
            validation: {
              required: true,
              maxLength: 30
            }
          },
          {
            id: 'Color',
            title: 'Color/Colour',
            dataPath: 'Color',
            editable: true,
            cellType: 'string',
            validation: {
              required: true,
              maxLength: 20
            }
          },
          {
            id: 'Favorite',
            title: 'Favorite/Favourite',
            dataPath: 'Favorite',
            editable: true,
            cellType: 'string',
            validation: {
              required: true,
              maxLength: 30
            }
          },
          {
            id: 'Email',
            title: 'Email Term',
            dataPath: 'Email',
            editable: true,
            cellType: 'string',
            validation: {
              required: true,
              maxLength: 30
            }
          },
          {
            id: 'useTooltips',
            title: 'Use Tooltips',
            dataPath: 'useTooltips',
            editable: true,
            cellType: 'boolean'
          },
          {
            id: 'showHelpIcons',
            title: 'Help Icons',
            dataPath: 'showHelpIcons',
            editable: true,
            cellType: 'tristate',
            triStatePresentation: 'dropdown'
          }
        ]
      }
    ]
  },

  {
    id: 'error-messages',
    title: 'Error Messages',
    description: 'User-facing error messages for validation and system errors',
    resourceSelection: { type: 'ids', resourceIds: ['grid-demo-collection.errors'] },
    columnMapping: [
      {
        resourceType: 'json',
        columns: [
          {
            id: 'validation_required',
            title: 'Required Field Error',
            dataPath: 'validation_required',
            editable: true,
            cellType: 'string',
            validation: {
              required: true,
              minLength: 10,
              maxLength: 100
            }
          },
          {
            id: 'validation_email',
            title: 'Invalid Email Error',
            dataPath: 'validation_email',
            editable: true,
            cellType: 'string',
            validation: {
              required: true,
              minLength: 15,
              maxLength: 100
            }
          },
          {
            id: 'network_error',
            title: 'Network Error',
            dataPath: 'network_error',
            editable: true,
            cellType: 'string',
            validation: {
              required: true,
              minLength: 10,
              maxLength: 100
            }
          },
          {
            id: 'server_error',
            title: 'Server Error',
            dataPath: 'server_error',
            editable: true,
            cellType: 'string',
            validation: {
              required: true,
              minLength: 10,
              maxLength: 100
            }
          },
          {
            id: 'permission_denied',
            title: 'Permission Denied',
            dataPath: 'permission_denied',
            editable: true,
            cellType: 'string',
            validation: {
              required: true,
              minLength: 10,
              maxLength: 100
            }
          },
          {
            id: 'showToUser',
            title: 'Show to User',
            dataPath: 'showToUser',
            editable: true,
            cellType: 'boolean'
          },
          {
            id: 'logLevel',
            title: 'Log Level',
            dataPath: 'logLevel',
            editable: true,
            cellType: 'tristate',
            triStatePresentation: 'dropdown',
            triStateLabels: {
              trueLabel: 'Verbose',
              falseLabel: 'Silent',
              undefinedLabel: 'Default'
            }
          }
        ]
      }
    ]
  }
];

/**
 * Multi-grid configurations for administrative workflows
 * that demonstrate working across multiple related grids simultaneously.
 */
export const multiGridConfigurations: GridTools.GridViewInitParams[] = [
  {
    id: 'territory-setup',
    title: 'Territory Configuration',
    description: 'Configure territory-specific application settings',
    resourceSelection: { type: 'ids', resourceIds: ['grid-demo-collection.app-config'] },
    columnMapping: [
      {
        resourceType: 'json',
        columns: [
          {
            id: 'currency',
            title: 'Currency',
            dataPath: 'currency',
            editable: true,
            cellType: 'dropdown',
            dropdownOptions: [
              { value: 'USD', label: 'USD' },
              { value: 'CAD', label: 'CAD' },
              { value: 'GBP', label: 'GBP' },
              { value: 'EUR', label: 'EUR' }
            ],
            validation: { required: true }
          },
          {
            id: 'dateFormat',
            title: 'Date Format',
            dataPath: 'dateFormat',
            editable: true,
            cellType: 'dropdown',
            dropdownOptions: [
              { value: 'MM/DD/YYYY', label: 'MM/DD/YYYY' },
              { value: 'DD/MM/YYYY', label: 'DD/MM/YYYY' },
              { value: 'YYYY-MM-DD', label: 'YYYY-MM-DD' }
            ],
            validation: { required: true }
          },
          {
            id: 'supportEmail',
            title: 'Support Email',
            dataPath: 'supportEmail',
            editable: true,
            cellType: 'string',
            validation: {
              required: true,
              pattern: /^[^\s@]+@[^\s@]+\.[^\s@]+$/
            }
          },
          {
            id: 'isActive',
            title: 'Territory Active',
            dataPath: 'isActive',
            editable: true,
            cellType: 'boolean'
          },
          {
            id: 'setupComplete',
            title: 'Setup Complete',
            dataPath: 'setupComplete',
            editable: true,
            cellType: 'tristate',
            triStatePresentation: 'checkbox'
          }
        ]
      }
    ]
  },
  {
    id: 'territory-terms',
    title: 'Territory UI Terms',
    description: 'Territory-specific UI terminology',
    resourceSelection: { type: 'ids', resourceIds: ['grid-demo-collection.ui-terms'] },
    columnMapping: [
      {
        resourceType: 'json',
        columns: [
          {
            id: 'ZipCode',
            title: 'Zip/Postal Code Term',
            dataPath: 'ZipCode',
            editable: true,
            cellType: 'string',
            validation: { required: true }
          },
          {
            id: 'Color',
            title: 'Color Spelling',
            dataPath: 'Color',
            editable: true,
            cellType: 'dropdown',
            dropdownOptions: [
              { value: 'Color', label: 'Color (US)' },
              { value: 'Colour', label: 'Colour (UK/CA)' }
            ],
            validation: { required: true }
          },
          {
            id: 'Favorite',
            title: 'Favorite Spelling',
            dataPath: 'Favorite',
            editable: true,
            cellType: 'dropdown',
            dropdownOptions: [
              { value: 'Favorite', label: 'Favorite (US)' },
              { value: 'Favourite', label: 'Favourite (UK/CA)' }
            ],
            validation: { required: true }
          },
          {
            id: 'useRegionalTerms',
            title: 'Use Regional Terms',
            dataPath: 'useRegionalTerms',
            editable: true,
            cellType: 'boolean'
          },
          {
            id: 'autoDetectRegion',
            title: 'Auto-Detect Region',
            dataPath: 'autoDetectRegion',
            editable: true,
            cellType: 'tristate',
            triStatePresentation: 'dropdown'
          }
        ]
      }
    ]
  }
];

/**
 * Configuration for demonstration purposes with various cell types
 * and validation scenarios.
 */
export const demonstrationGridConfig: GridTools.GridViewInitParams = {
  id: 'demonstration',
  title: 'Cell Types Demonstration',
  description: 'Showcase different cell types and validation features',
  resourceSelection: { type: 'ids', ids: ['app-config'] },
  columnMapping: [
    {
      resourceType: 'json',
      columns: [
        {
          id: 'currency',
          title: 'Currency (Dropdown)',
          dataPath: 'currency',
          editable: true,
          cellType: 'dropdown',
          dropdownOptions: [
            { value: 'USD', label: 'US Dollar ($)' },
            { value: 'CAD', label: 'Canadian Dollar (C$)' },
            { value: 'GBP', label: 'British Pound (£)' },
            { value: 'EUR', label: 'Euro (€)' }
          ],
          validation: { required: true }
        },
        {
          id: 'supportEmail',
          title: 'Email (String + Pattern)',
          dataPath: 'supportEmail',
          editable: true,
          cellType: 'string',
          validation: {
            required: true,
            pattern: /^[^\s@]+@[^\s@]+\.[^\s@]+$/,
            maxLength: 100
          }
        },
        {
          id: 'measurement',
          title: 'Measurement (Dropdown)',
          dataPath: 'measurement',
          editable: true,
          cellType: 'dropdown',
          dropdownOptions: [
            { value: 'imperial', label: 'Imperial' },
            { value: 'metric', label: 'Metric' }
          ]
        },
        {
          id: 'dateFormat',
          title: 'Date Format (String)',
          dataPath: 'dateFormat',
          editable: true,
          cellType: 'string',
          validation: {
            required: true,
            maxLength: 20
          }
        },
        {
          id: 'isActive',
          title: 'Active (Boolean)',
          dataPath: 'isActive',
          editable: true,
          cellType: 'boolean'
        },
        {
          id: 'debugMode',
          title: 'Debug Mode (Tri-state)',
          dataPath: 'debugMode',
          editable: true,
          cellType: 'tristate',
          triStatePresentation: 'dropdown',
          triStateLabels: {
            trueLabel: 'On',
            falseLabel: 'Off',
            undefinedLabel: 'Auto'
          }
        }
      ]
    }
  ]
};

/**
 * Flexible grid configurations that can adapt to different data sources.
 * These use more generic resource selection strategies.
 */
export const flexibleGridConfigurations: GridTools.GridViewInitParams[] = [
  {
    id: 'app-config-flexible',
    title: 'Application Configuration (Flexible)',
    description: 'Auto-detects app-config resources from any data source',
    resourceSelection: { type: 'pattern', pattern: '.*app-config$' },
    columnMapping: [
      {
        resourceType: 'json',
        columns: [
          {
            id: 'currency',
            title: 'Currency',
            dataPath: 'currency',
            editable: true,
            cellType: 'dropdown',
            dropdownOptions: [
              { value: 'USD', label: 'US Dollar' },
              { value: 'CAD', label: 'Canadian Dollar' },
              { value: 'GBP', label: 'British Pound' },
              { value: 'EUR', label: 'Euro' }
            ],
            validation: { required: true }
          },
          {
            id: 'dateFormat',
            title: 'Date Format',
            dataPath: 'dateFormat',
            editable: true,
            cellType: 'dropdown',
            dropdownOptions: [
              { value: 'MM/DD/YYYY', label: 'MM/DD/YYYY (US)' },
              { value: 'DD/MM/YYYY', label: 'DD/MM/YYYY (International)' },
              { value: 'YYYY-MM-DD', label: 'YYYY-MM-DD (ISO)' },
              { value: 'DD.MM.YYYY', label: 'DD.MM.YYYY (German)' }
            ],
            validation: { required: true }
          },
          {
            id: 'timeFormat',
            title: 'Time Format',
            dataPath: 'timeFormat',
            editable: true,
            cellType: 'dropdown',
            dropdownOptions: [
              { value: '12h', label: '12 Hour' },
              { value: '24h', label: '24 Hour' }
            ]
          },
          {
            id: 'measurement',
            title: 'Measurement System',
            dataPath: 'measurement',
            editable: true,
            cellType: 'dropdown',
            dropdownOptions: [
              { value: 'imperial', label: 'Imperial' },
              { value: 'metric', label: 'Metric' }
            ]
          },
          {
            id: 'supportEmail',
            title: 'Support Email',
            dataPath: 'supportEmail',
            editable: true,
            cellType: 'string',
            validation: {
              required: true,
              pattern: /^[^\s@]+@[^\s@]+\.[^\s@]+$/,
              maxLength: 100
            }
          },
          {
            id: 'supportPhone',
            title: 'Support Phone',
            dataPath: 'supportPhone',
            editable: true,
            cellType: 'string',
            validation: {
              required: true,
              pattern: /^\+?[\d\s\-\(\)]{10,}$/,
              maxLength: 20
            }
          },
          {
            id: 'isActive',
            title: 'Active',
            dataPath: 'isActive',
            editable: true,
            cellType: 'boolean'
          },
          {
            id: 'maintenanceMode',
            title: 'Maintenance Mode',
            dataPath: 'maintenanceMode',
            editable: true,
            cellType: 'boolean'
          },
          {
            id: 'betaFeatures',
            title: 'Beta Features',
            dataPath: 'betaFeatures',
            editable: true,
            cellType: 'tristate',
            presentation: 'checkbox'
          }
        ]
      }
    ]
  },

  {
    id: 'strings-flexible',
    title: 'UI Strings (Flexible)',
    description: 'Auto-detects common/strings resources from any data source',
    resourceSelection: { type: 'pattern', pattern: '.*(common|strings)$' },
    columnMapping: [
      {
        resourceType: 'json',
        columns: [
          {
            id: 'welcome',
            title: 'Welcome Message',
            dataPath: 'welcome',
            editable: true,
            cellType: 'string',
            validation: {
              required: true,
              minLength: 5,
              maxLength: 100
            }
          },
          {
            id: 'hello',
            title: 'Hello',
            dataPath: 'hello',
            editable: true,
            cellType: 'string',
            validation: {
              required: true,
              maxLength: 50
            }
          },
          {
            id: 'goodbye',
            title: 'Goodbye',
            dataPath: 'goodbye',
            editable: true,
            cellType: 'string',
            validation: {
              required: true,
              maxLength: 50
            }
          },
          {
            id: 'yes',
            title: 'Yes',
            dataPath: 'yes',
            editable: true,
            cellType: 'string',
            validation: {
              required: true,
              maxLength: 20
            }
          },
          {
            id: 'no',
            title: 'No',
            dataPath: 'no',
            editable: true,
            cellType: 'string',
            validation: {
              required: true,
              maxLength: 20
            }
          },
          {
            id: 'cancel',
            title: 'Cancel',
            dataPath: 'cancel',
            editable: true,
            cellType: 'string',
            validation: {
              required: true,
              maxLength: 30
            }
          },
          {
            id: 'loading',
            title: 'Loading Text',
            dataPath: 'loading',
            editable: true,
            cellType: 'string',
            validation: {
              required: true,
              maxLength: 50
            }
          },
          {
            id: 'showProgressBar',
            title: 'Show Progress Bar',
            dataPath: 'showProgressBar',
            editable: true,
            cellType: 'boolean'
          },
          {
            id: 'enableAnimations',
            title: 'Enable Animations',
            dataPath: 'enableAnimations',
            editable: true,
            cellType: 'tristate',
            presentation: 'dropdown'
          }
        ]
      }
    ]
  },

  {
    id: 'ui-terms-flexible',
    title: 'UI Terminology (Flexible)',
    description: 'Auto-detects UI terms from any data source',
    resourceSelection: { type: 'pattern', pattern: '.*(ui-terms|terms)$' },
    columnMapping: [
      {
        resourceType: 'json',
        columns: [
          {
            id: 'ShoppingCart',
            title: 'Shopping Cart',
            dataPath: 'ShoppingCart',
            editable: true,
            cellType: 'string',
            validation: {
              required: true,
              maxLength: 50
            }
          },
          {
            id: 'ZipCode',
            title: 'Zip/Postal Code',
            dataPath: 'ZipCode',
            editable: true,
            cellType: 'string',
            validation: {
              required: true,
              maxLength: 30
            }
          },
          {
            id: 'Color',
            title: 'Color/Colour',
            dataPath: 'Color',
            editable: true,
            cellType: 'dropdown',
            dropdownOptions: [
              { value: 'Color', label: 'Color (US)' },
              { value: 'Colour', label: 'Colour (UK/CA)' }
            ],
            validation: {
              required: true,
              maxLength: 20
            }
          },
          {
            id: 'Favorite',
            title: 'Favorite/Favourite',
            dataPath: 'Favorite',
            editable: true,
            cellType: 'dropdown',
            dropdownOptions: [
              { value: 'Favorite', label: 'Favorite (US)' },
              { value: 'Favourite', label: 'Favourite (UK/CA)' }
            ],
            validation: {
              required: true,
              maxLength: 30
            }
          },
          {
            id: 'Email',
            title: 'Email Term',
            dataPath: 'Email',
            editable: true,
            cellType: 'string',
            validation: {
              required: true,
              maxLength: 30
            }
          },
          {
            id: 'useTooltips',
            title: 'Use Tooltips',
            dataPath: 'useTooltips',
            editable: true,
            cellType: 'boolean'
          },
          {
            id: 'showContextualHelp',
            title: 'Contextual Help',
            dataPath: 'showContextualHelp',
            editable: true,
            cellType: 'tristate',
            presentation: 'checkbox'
          }
        ]
      }
    ]
  },

  {
    id: 'errors-flexible',
    title: 'Error Messages (Flexible)',
    description: 'Auto-detects error message resources from any data source',
    resourceSelection: { type: 'pattern', pattern: '.*(errors|error-messages)$' },
    columnMapping: [
      {
        resourceType: 'json',
        columns: [
          {
            id: 'validation_required',
            title: 'Required Field Error',
            dataPath: 'validation_required',
            editable: true,
            cellType: 'string',
            validation: {
              required: true,
              minLength: 10,
              maxLength: 100
            }
          },
          {
            id: 'validation_email',
            title: 'Invalid Email Error',
            dataPath: 'validation_email',
            editable: true,
            cellType: 'string',
            validation: {
              required: true,
              minLength: 15,
              maxLength: 100
            }
          },
          {
            id: 'network_error',
            title: 'Network Error',
            dataPath: 'network_error',
            editable: true,
            cellType: 'string',
            validation: {
              required: true,
              minLength: 10,
              maxLength: 100
            }
          },
          {
            id: 'server_error',
            title: 'Server Error',
            dataPath: 'server_error',
            editable: true,
            cellType: 'string',
            validation: {
              required: true,
              minLength: 10,
              maxLength: 100
            }
          },
          {
            id: 'permission_denied',
            title: 'Permission Denied',
            dataPath: 'permission_denied',
            editable: true,
            cellType: 'string',
            validation: {
              required: true,
              minLength: 10,
              maxLength: 100
            }
          },
          {
            id: 'showToUser',
            title: 'Show to User',
            dataPath: 'showToUser',
            editable: true,
            cellType: 'boolean'
          },
          {
            id: 'enableStackTrace',
            title: 'Stack Trace',
            dataPath: 'enableStackTrace',
            editable: true,
            cellType: 'tristate',
            presentation: 'dropdown'
          }
        ]
      }
    ]
  }
];

/**
 * Combined configurations - includes both specific and flexible options
 */
export const allGridConfigurations: GridTools.GridViewInitParams[] = [
  ...sampleGridConfigurations,
  ...flexibleGridConfigurations
];
