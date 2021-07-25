#!/usr/bin/env ts-node-script

'use strict'

import { ArgumentParser } from 'argparse'
import { promises as fs } from 'fs'
import path from 'path'
import { fileURLToPath } from 'url'

import Archive from './archive.js'
import Manifest, { MatchResult } from './manifest.js'

export default async function main(inArgs?: string[]): Promise<void> {
  const { description, version } = JSON.parse(
    await fs.readFile(
      path.join(
        path.dirname(fileURLToPath(import.meta.url)),
        '..',
        'package.json'
      ),
      'utf-8'
    )
  )

  // TODO Improve this interface using subcommands.
  const parser = new ArgumentParser({ prog: 'palletjack', description })
  parser.add_argument('-v', '--version', { action: 'version', version })
  parser.add_argument('--export', {
    help: 'Perform the export',
    metavar: 'TARGET',
  })
  parser.add_argument('--overwrite', {
    help: 'Overwrite target even if it already exists',
    action: 'store_true',
  })
  parser.add_argument('--basedir', {
    help: 'Base directory (default to .)',
  })
  parser.add_argument('--verbose', {
    help: 'Be extra verbose',
    action: 'store_true',
  })
  parser.add_argument('manifest', {
    help: 'Path to a yaml file containing glob patterns',
  })

  const args = parser.parse_args(inArgs)

  const manifest = await Manifest.load(args.manifest)
  const archive = new Archive({
    manifest,
    basedir: args.basedir || undefined,
    overwrite: args.overwrite,
  })
  await archive.collectPaths()

  if (archive.renameErrors && archive.renameErrors.length) {
    // eslint-disable-next-line no-console
    console.error(archive.renameErrors)
    process.exit(1)
  }

  if (args.export) {
    if (args.verbose) {
      Manifest.logMatches(archive.matchResult as MatchResult, {
        verbose: true,
      })
      manifest.logRename({ verbose: true })
    }
    await archive.export(args.export, { verbose: args.verbose })
  } else {
    Manifest.logMatches(archive.matchResult as MatchResult, {
      verbose: args.verbose,
    })
    manifest.logRename({ verbose: args.verbose })
  }
}

;(async (): Promise<void> => {
  try {
    await main()
  } catch (e) {
    // eslint-disable-next-line no-console
    console.error(e)
    process.exit(1)
  }
})()
