import { promises as fs } from 'fs'
import stringify from 'json-stable-stringify'
import path from 'path'
import prettier from 'prettier'
import { createGenerator, Schema } from 'ts-json-schema-generator'

import { createDirForTargetFile } from './fs.js'

export function generateSchema({
  basedir,
  schemaSourceRelativePath,
  tsconfig,
}: {
  basedir: string
  schemaSourceRelativePath: string
  tsconfig?: string
}): Schema {
  return createGenerator({
    path: path.resolve(basedir, schemaSourceRelativePath),
    tsconfig,
    expose: 'export',
    jsDoc: 'extended',
    topRef: true,
  }).createSchema()
}

export function pathForGeneratedJsonSchema(
  schemaSourceRelativePath: string
): string {
  return path.join(
    path.dirname(schemaSourceRelativePath),
    'generated',
    path.basename(schemaSourceRelativePath).replace(/\.ts$/, '.json')
  )
}

export function format(schema: Schema, basedir: string): string {
  const stringified = stringify(schema, { space: 2 })
  const prettierOptions = prettier.resolveConfig(basedir)
  return prettier.format(stringified, { parser: 'json', ...prettierOptions })
}

export async function updateSchema({
  basedir,
  schemaSourceRelativePath,
  generatedJsonSchemaRelativePath,
  tsconfig,
}: {
  basedir: string
  schemaSourceRelativePath: string
  generatedJsonSchemaRelativePath?: string
  tsconfig?: string
}): Promise<{ generatedJsonSchemaRelativePath: string }> {
  if (!generatedJsonSchemaRelativePath) {
    generatedJsonSchemaRelativePath = pathForGeneratedJsonSchema(
      schemaSourceRelativePath
    )
  }

  const generated = await generateSchema({
    basedir,
    schemaSourceRelativePath,
    tsconfig,
  })
  const formatted = await format(generated, basedir)

  const dst = path.join(basedir, generatedJsonSchemaRelativePath)
  await createDirForTargetFile(dst)
  await fs.writeFile(dst, formatted, { encoding: 'utf-8' })

  return { generatedJsonSchemaRelativePath }
}
