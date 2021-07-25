/* eslint-disable no-console */

import chalk from 'chalk'
import { promises as fs } from 'fs'
import lodash from 'lodash'
import path from 'path'

import { findGeneratedSchemas, findSourceSchemas } from './find-schemas.js'
import {
  generateSchema,
  pathForGeneratedJsonSchema,
  updateSchema,
} from './update-schema.js'

const RIGHT_ARROW = '\u27A1'
const CHECK = '\u2714'
const X = '\u2717'

export class Runner {
  readonly basedir: string

  constructor({ basedir }: { basedir?: string } = {}) {
    this.basedir = basedir || process.cwd()
  }

  schemaSourceRelativePaths(): Promise<string[]> {
    return findSourceSchemas(this.basedir)
  }

  private async prune({
    generatedJsonSchemaRelativePaths,
  }: {
    generatedJsonSchemaRelativePaths: string[]
  }): Promise<{ deletedSchemaPaths: string[] }> {
    const { basedir } = this

    const deletedSchemaPaths = []
    for (const foundSchema of await findGeneratedSchemas(this.basedir)) {
      if (!generatedJsonSchemaRelativePaths.includes(foundSchema)) {
        await fs.unlink(path.join(basedir, foundSchema))
        deletedSchemaPaths.push(foundSchema)
        console.log(`${chalk.gray(foundSchema)} removed`)
      }
    }
    return { deletedSchemaPaths }
  }

  async update(): Promise<{
    generatedJsonSchemaRelativePaths: string[]
    deletedSchemaPaths: string[]
  }> {
    const { basedir } = this

    const generatedJsonSchemaRelativePaths = []
    for (const schemaSourceRelativePath of await this.schemaSourceRelativePaths()) {
      const { generatedJsonSchemaRelativePath } = await updateSchema({
        basedir,
        schemaSourceRelativePath,
      })
      generatedJsonSchemaRelativePaths.push(generatedJsonSchemaRelativePath)
      console.log(
        `${chalk.cyan(
          schemaSourceRelativePath
        )} ${RIGHT_ARROW} ${chalk.greenBright(generatedJsonSchemaRelativePath)}`
      )
    }

    const { deletedSchemaPaths } = await this.prune({
      generatedJsonSchemaRelativePaths,
    })

    if (generatedJsonSchemaRelativePaths.length === 0) {
      console.log(chalk.blue('No schema source files found'))
    }

    return { generatedJsonSchemaRelativePaths, deletedSchemaPaths }
  }

  async check(): Promise<{
    isValid: boolean
    missing: string[]
    outdated: string[]
  }> {
    const { basedir } = this

    const missing = []
    const outdated = []
    const schemaSourceRelativePaths = await this.schemaSourceRelativePaths()
    for (const schemaSourceRelativePath of schemaSourceRelativePaths) {
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
        console.log(
          `${chalk.red(X)} ${chalk.redBright(
            generatedJsonSchemaRelativePath
          )} is missing`
        )
        continue
      }

      let parsed
      try {
        parsed = JSON.parse(contents)
      } catch (e) {
        outdated.push(generatedJsonSchemaRelativePath)
        console.log(
          `${chalk.red(X)} ${chalk.redBright(
            generatedJsonSchemaRelativePath
          )} could not be parsed`
        )
      }

      const generated = await generateSchema({
        basedir,
        schemaSourceRelativePath,
      })

      if (lodash.isEqual(parsed, generated)) {
        console.log(
          `${CHECK} ${chalk.greenBright(generatedJsonSchemaRelativePath)}`
        )
      } else {
        outdated.push(generatedJsonSchemaRelativePath)
        console.log(
          `${chalk.red(X)} ${chalk.redBright(
            generatedJsonSchemaRelativePath
          )} is out of date`
        )
      }
    }

    const isValid = missing.length === 0 && outdated.length === 0

    if (schemaSourceRelativePaths.length === 0) {
      console.log(chalk.blue('No schema source files found'))
    } else if (isValid) {
      console.log(chalk.blue('All schemas up to date'))
    }

    return {
      isValid: missing.length > 0 || outdated.length > 0,
      missing,
      outdated,
    }
  }
}
