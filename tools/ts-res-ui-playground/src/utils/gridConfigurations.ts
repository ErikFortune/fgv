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
    resourceSelection: { type: 'ids', ids: ['app-config'] },
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
          }
        ]
      }
    ]
  },

  {
    id: 'common-strings',
    title: 'Common UI Strings',
    description: 'Localized common strings used throughout the application',
    resourceSelection: { type: 'ids', ids: ['common'] },
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
          }
        ]
      }
    ]
  },

  {
    id: 'ui-terms',
    title: 'UI Terminology',
    description: 'Region-specific UI terminology and spelling variations',
    resourceSelection: { type: 'ids', ids: ['ui-terms'] },
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
          }
        ]
      }
    ]
  },

  {
    id: 'error-messages',
    title: 'Error Messages',
    description: 'User-facing error messages for validation and system errors',
    resourceSelection: { type: 'ids', ids: ['errors'] },
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
    resourceSelection: { type: 'ids', ids: ['app-config'] },
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
          }
        ]
      }
    ]
  },
  {
    id: 'territory-terms',
    title: 'Territory UI Terms',
    description: 'Territory-specific UI terminology',
    resourceSelection: { type: 'ids', ids: ['ui-terms'] },
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
        }
      ]
    }
  ]
};
