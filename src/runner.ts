/* eslint-disable no-console */

import chalk from 'chalk'
import fs from 'fs'
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
const BOOM = '\uD83D\uDCA5'

export class Runner {
  readonly basedir: string

  constructor({ basedir }: { basedir?: string } = {}) {
    this.basedir = basedir || process.cwd()
  }

  schemaSourceRelativePaths(): Promise<string[]> {
    return findSourceSchemas(this.basedir)
  }

  get tsconfig(): string | undefined {
    return fs.existsSync('tsconfig.json') ? 'tsconfig.json' : undefined
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
        await fs.promises.unlink(path.join(basedir, foundSchema))
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
    const { basedir, tsconfig } = this

    const generatedJsonSchemaRelativePaths = []
    for (const schemaSourceRelativePath of await this.schemaSourceRelativePaths()) {
      try {
        const { generatedJsonSchemaRelativePath } = await updateSchema({
          basedir,
          schemaSourceRelativePath,
          tsconfig,
        })
        generatedJsonSchemaRelativePaths.push(generatedJsonSchemaRelativePath)
        console.log(
          `${chalk.cyan(
            schemaSourceRelativePath
          )} ${RIGHT_ARROW} ${chalk.greenBright(
            generatedJsonSchemaRelativePath
          )}`
        )
      } catch (e) {
        console.log(
          `${BOOM} ${chalk.redBright('Error in')} ${chalk.red(
            schemaSourceRelativePath
          )}`
        )
        throw e
      }
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
    const { basedir, tsconfig } = this

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
        contents = await fs.promises.readFile(generatedSchemaPath, 'utf-8')
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
        tsconfig,
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

    return { isValid, missing, outdated }
  }
}
