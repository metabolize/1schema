export const EXAMPLE_SCHEMA_TS = `
export interface Address {
  streetAddress: string
  locality: string
  region: string
  postalCode: string
  country: string
}
`

export const EXPECTED_JSON_SCHEMA = {
  $schema: 'http://json-schema.org/draft-07/schema#',
  $ref: '#/definitions/Address',
  definitions: {
    Address: {
      type: 'object',
      properties: {
        streetAddress: {
          type: 'string',
        },
        locality: {
          type: 'string',
        },
        region: {
          type: 'string',
        },
        postalCode: {
          type: 'string',
        },
        country: {
          type: 'string',
        },
      },
      required: [
        'streetAddress',
        'locality',
        'region',
        'postalCode',
        'country',
      ],
      additionalProperties: false,
    },
  },
}

export const ERROR_SCHEMA_TS = `
import { Foo } from 'nonexistent'
`
