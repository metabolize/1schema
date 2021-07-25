import { expect } from 'chai'
import tmp, { DirectoryResult } from 'tmp-promise'

import { findSourceSchemas } from './find-schemas.js'
import { touchFiles } from './fs-test-helpers.js'

async function createExampleTree(paths: string[]): Promise<DirectoryResult> {
  const result = await tmp.dir({ unsafeCleanup: true })
  await touchFiles(paths, result.path)
  return result
}

describe('findSchemas()', () => {
  const schemaPaths = ['schema.ts', 'foo/schema.ts', 'bar/other.schema.ts']

  let dir: DirectoryResult
  beforeEach(async () => {
    dir = await createExampleTree(schemaPaths)
  })
  afterEach(() => dir && dir.cleanup())

  it('finds the expected paths', async () => {
    expect(await findSourceSchemas(dir.path)).to.have.members(schemaPaths)
  })
})
