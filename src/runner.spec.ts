import chai, { expect } from 'chai'
import dirtyChai from 'dirty-chai'
import fs from 'fs'
import path from 'path'
import tmp, { DirectoryResult } from 'tmp-promise'

import { loadJson, writeFile } from './fs-test-helpers.js'
import { Runner } from './runner.js'
import { EXAMPLE_SCHEMA_TS, EXPECTED_JSON_SCHEMA } from './test-fixtures.js'

chai.use(dirtyChai)

describe('Runner', () => {
  let dir: DirectoryResult
  beforeEach(async () => {
    dir = await tmp.dir({ unsafeCleanup: true })
  })
  afterEach(() => dir && dir.cleanup())

  const schemaSourceRelativePath = 'example/this.schema.ts'
  beforeEach(() =>
    writeFile(path.join(dir.path, schemaSourceRelativePath), EXAMPLE_SCHEMA_TS)
  )

  let runner: Runner
  beforeEach(() => {
    runner = new Runner({ basedir: dir.path })
  })

  describe('`update()`', () => {
    it('creates the expected JSON Schema file', async function () {
      this.timeout('5s')

      const { generatedJsonSchemaRelativePaths } = await runner.update()
      expect(generatedJsonSchemaRelativePaths).to.deep.equal([
        'example/generated/this.schema.json',
      ])

      const generated = await loadJson(
        path.join(dir.path, generatedJsonSchemaRelativePaths[0])
      )
      expect(generated).to.deep.equal(EXPECTED_JSON_SCHEMA)
    })

    context('when an extra generated schema file is present', () => {
      const extraGeneratedSchema = 'foobar/generated/schema.json'
      beforeEach(() => writeFile(path.join(dir.path, extraGeneratedSchema)))

      it('removes it', async function () {
        this.timeout('5s')

        // Confidence check.
        expect(
          await fs.existsSync(path.join(dir.path, extraGeneratedSchema))
        ).to.be.true()

        // Act.
        const { deletedSchemaPaths } = await runner.update()

        // Assert.
        expect(deletedSchemaPaths).to.have.members([extraGeneratedSchema])
        expect(
          await fs.existsSync(path.join(dir.path, extraGeneratedSchema))
        ).to.be.false()
      })
    })
  })
})
