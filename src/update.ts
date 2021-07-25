import { promises as fs } from 'fs'
import path from 'path'
import prettier from 'prettier'
import { createGenerator, Schema } from 'ts-json-schema-generator'

import { createDirForTargetFile } from './fs.js'

export function generateSchema({
  basedir,
  schemaSourceRelativePath,
}: {
  basedir: string
  schemaSourceRelativePath: string
}): Schema {
  return createGenerator({
    path: path.resolve(basedir, schemaSourceRelativePath),
    expose: 'export',
    jsDoc: 'extended',
    topRef: true,
  }).createSchema()
}

export function format(schema: Schema, basedir: string): string {
  const options = prettier.resolveConfig(basedir)
  return prettier.format(JSON.stringify(schema), { parser: 'json', ...options })
}

export async function updateSchema({
  basedir,
  schemaSourceRelativePath,
  generatedJsonSchemaRelativePath,
}: {
  basedir: string
  schemaSourceRelativePath: string
  generatedJsonSchemaRelativePath?: string
}): Promise<{ generatedJsonSchemaRelativePath: string }> {
  const generated = await generateSchema({ basedir, schemaSourceRelativePath })

  if (!generatedJsonSchemaRelativePath) {
    generatedJsonSchemaRelativePath = path.join(
      path.dirname(schemaSourceRelativePath),
      'generated',
      path.basename(schemaSourceRelativePath).replace(/\.ts$/, '.json')
    )
  }

  const formatted = await format(generated, basedir)

  const dst = path.join(basedir, generatedJsonSchemaRelativePath)
  await createDirForTargetFile(dst)
  await fs.writeFile(dst, formatted, { encoding: 'utf-8' })

  return { generatedJsonSchemaRelativePath }
}
