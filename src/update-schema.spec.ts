import { expect } from 'chai'
import path from 'path'
import tmp, { DirectoryResult } from 'tmp-promise'

import { loadJson, writeFile } from './fs-test-helpers.js'
import { EXAMPLE_SCHEMA_TS, EXPECTED_JSON_SCHEMA } from './test-fixtures.js'
import { updateSchema } from './update-schema.js'

describe('updateSchema()', () => {
  let dir: DirectoryResult
  beforeEach(async () => {
    dir = await tmp.dir({ unsafeCleanup: true })
  })
  afterEach(() => dir && dir.cleanup())

  const schemaSourceRelativePath = 'example/this.schema.ts'
  beforeEach(() =>
    writeFile(path.join(dir.path, schemaSourceRelativePath), EXAMPLE_SCHEMA_TS)
  )

  it('creates the expected JSON Schema file', async function () {
    this.timeout('5s') // Loading prettier is pretty slow.

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
