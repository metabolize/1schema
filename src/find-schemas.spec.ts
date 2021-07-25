import { expect } from 'chai'
import { promises as fs } from 'fs'
import pathLib from 'path'
import tmp, { DirectoryResult } from 'tmp-promise'

import { findSchemas } from './find-schemas.js'

async function touchPath(dst: string): Promise<void> {
  await fs.mkdir(pathLib.dirname(dst), { recursive: true })
  await fs.writeFile(dst, '', 'utf8')
}

async function touchPaths(paths: string[], directory: string): Promise<void> {
  for (const examplePath of paths) {
    await touchPath(pathLib.join(directory, examplePath))
  }
}

async function createExampleTree(paths: string[]): Promise<DirectoryResult> {
  const result = await tmp.dir({ unsafeCleanup: true })
  await touchPaths(paths, result.path)
  return result
}

describe('findSchemas()', () => {
  const schemaPaths = ['schema.ts', 'foo/schema.ts', 'bar/other.schema.ts']

  let path: string
  let cleanup: () => void
  beforeEach(async () => {
    ;({ path, cleanup } = await createExampleTree(schemaPaths))
  })
  afterEach(() => cleanup())

  it('finds the expected paths', async () => {
    expect(await findSchemas(path)).to.have.members(schemaPaths)
  })
})
