import { promises as fs } from 'fs'
import path from 'path'
import { JsonValue } from 'type-fest'

import { createDirForTargetFile } from './fs.js'

export async function writeFile(dst: string, contents = ''): Promise<void> {
  await createDirForTargetFile(dst)
  await fs.writeFile(dst, contents, 'utf8')
}

export async function touchFiles(
  paths: string[],
  directory: string
): Promise<void> {
  for (const examplePath of paths) {
    await writeFile(path.join(directory, examplePath))
  }
}

export async function loadJson(path: string): Promise<JsonValue> {
  const contents = await fs.readFile(path, 'utf-8')
  return JSON.parse(contents)
}
