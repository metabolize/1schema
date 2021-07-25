import { expect } from 'chai'
import { promises as fs } from 'fs'
import path from 'path'
import tmp, { DirectoryResult } from 'tmp-promise'

import { updateSchema } from './update.js'
import { touchFile } from './fs-test-helpers.js'

async function loadJson(path: string): Promise<any> {
  const contents = await fs.readFile(path, 'utf-8')
  return JSON.parse(contents)
}

const EXAMPLE_SCHEMA_TS = `
export interface Address {
  streetAddress: string
  locality: string
  region: string
  postalCode: string
  country: string
}
`

const EXPECTED_JSON_SCHEMA = {
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

describe('updateSchema()', () => {
  let dir: DirectoryResult
  beforeEach(async () => {
    dir = await tmp.dir({ unsafeCleanup: true })
  })
  afterEach(() => dir && dir.cleanup())

  const schemaSourceRelativePath = 'example/this.schema.ts'
  beforeEach(async () => {
    const dst = path.join(dir.path, schemaSourceRelativePath)
    await touchFile(dst, EXAMPLE_SCHEMA_TS)
  })

  it('creates the expected JSON Schema file', async function () {
    this.timeout('60s')
    const { generatedJsonSchemaRelativePath } = await updateSchema({
      basedir: dir.path,
      schemaSourceRelativePath,
    })
    expect(generatedJsonSchemaRelativePath).to.equal(
      'example/generated/this.schema.json'
    )
    const generated = await loadJson(
      path.join(dir.path, generatedJsonSchemaRelativePath)
    )
    expect(generated).to.deep.equal(EXPECTED_JSON_SCHEMA)
  })
})
