#!/usr/bin/env ts-node-script

'use strict'

import { ArgumentParser } from 'argparse'
import { promises as fs } from 'fs'
import path from 'path'
import { fileURLToPath } from 'url'

import { Runner } from './runner.js'

export default async function main(inArgs?: string[]): Promise<void> {
  const { description, name, version } = JSON.parse(
    await fs.readFile(
      path.join(
        path.dirname(fileURLToPath(import.meta.url)),
        '..',
        'package.json'
      ),
      'utf-8'
    )
  )

  const parser = new ArgumentParser({ prog: name, description })
  parser.add_argument('-v', '--version', { action: 'version', version })

  const subparsers = parser.add_subparsers({
    dest: 'command',
    title: 'subcommands',
    description: 'valid subcommands',
    required: true,
  })
  subparsers.add_parser('update', { help: 'Update JSON schema' })
  subparsers.add_parser('check', {
    help: 'Verify that JSON schema are up to date',
  })

  const args = parser.parse_args(inArgs)

  switch (args.command) {
    case 'update':
      await new Runner().update()
      break
    case 'check': {
      const { isValid } = await new Runner().check()
      if (!isValid) {
        process.exit(1)
      }
      break
    }
    default:
      throw Error(`Unknown command: ${args.command}`)
  }
}

;(async (): Promise<void> => {
  try {
    await main()
  } catch (e) {
    // eslint-disable-next-line no-console
    console.error(e)
    process.exit(2)
  }
})()
