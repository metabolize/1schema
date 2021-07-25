import path from 'path'
import { promises as fs } from 'fs'
import { createDirForTargetFile } from './fs.js'

export async function touchFile(dst: string, contents = ''): Promise<void> {
  await createDirForTargetFile(dst)
  await fs.writeFile(dst, contents, 'utf8')
}

export async function touchFiles(
  paths: string[],
  directory: string
): Promise<void> {
  for (const examplePath of paths) {
    await touchFile(path.join(directory, examplePath))
  }
}
