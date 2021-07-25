import { promises as fs } from 'fs'
import lodash from 'lodash'
import path from 'path'

import { findSchemas } from './find-schemas.js'
import {
  generateSchema,
  pathForGeneratedJsonSchema,
  updateSchema,
} from './update-schema.js'

export class Runner {
  readonly basedir: string

  constructor({ basedir }: { basedir: string }) {
    this.basedir = basedir
  }

  schemaSourceRelativePaths(): Promise<string[]> {
    return findSchemas(this.basedir)
  }

  async update(): Promise<{ generatedJsonSchemaRelativePaths: string[] }> {
    const { basedir } = this

    const generatedJsonSchemaRelativePaths = []
    for (const schemaSourceRelativePath of await this.schemaSourceRelativePaths()) {
      const { generatedJsonSchemaRelativePath } = await updateSchema({
        basedir,
        schemaSourceRelativePath,
      })
      generatedJsonSchemaRelativePaths.push(generatedJsonSchemaRelativePath)
    }

    return { generatedJsonSchemaRelativePaths }
  }

  async check(): Promise<void> {
    const { basedir } = this

    const missing = []
    const outdated = []
    for (const schemaSourceRelativePath of await this.schemaSourceRelativePaths()) {
      const generatedJsonSchemaRelativePath = pathForGeneratedJsonSchema(
        schemaSourceRelativePath
      )
      const generatedSchemaPath = path.join(
        this.basedir,
        generatedJsonSchemaRelativePath
      )
      let contents
      try {
        contents = await fs.readFile(generatedSchemaPath, 'utf-8')
      } catch (e) {
        missing.push(generatedJsonSchemaRelativePath)
        continue
      }

      let parsed
      try {
        parsed = JSON.parse(contents)
      } catch (e) {
        outdated.push(generatedJsonSchemaRelativePath)
      }

      const generated = await generateSchema({
        basedir,
        schemaSourceRelativePath,
      })

      if (!lodash.isEqual(parsed, generated)) {
        outdated.push(generatedJsonSchemaRelativePath)
      }
    }
  }
}
