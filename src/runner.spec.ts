import { expect } from 'chai'
import path from 'path'
import tmp, { DirectoryResult } from 'tmp-promise'

import { loadJson, writeFile } from './fs-test-helpers.js'
import { Runner } from './runner.js'
import { EXAMPLE_SCHEMA_TS, EXPECTED_JSON_SCHEMA } from './test-fixtures.js'

describe('Runner', () => {
  it('works', async () => {
    let dir: DirectoryResult
    beforeEach(async () => {
      dir = await tmp.dir({ unsafeCleanup: true })
    })
    afterEach(() => dir && dir.cleanup())

    const schemaSourceRelativePath = 'example/this.schema.ts'
    beforeEach(() =>
      writeFile(
        path.join(dir.path, schemaSourceRelativePath),
        EXAMPLE_SCHEMA_TS
      )
    )

    it('creates the expected JSON Schema file', async function () {
      this.timeout('3s')

      const runner = new Runner({ basedir: dir.path })

      const { generatedJsonSchemaRelativePaths } = await runner.update()
      expect(generatedJsonSchemaRelativePaths).to.deep.equal([
        'example/generated/this.schema.json',
      ])

      const generated = await loadJson(
        path.join(dir.path, generatedJsonSchemaRelativePaths[0])
      )
      expect(generated).to.deep.equal(EXPECTED_JSON_SCHEMA)
    })
  })
})
