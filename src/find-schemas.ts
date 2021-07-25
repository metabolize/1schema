import { globby } from 'globby'

export async function findSchemas(basedir?: string): Promise<string[]> {
  return globby(['**/schema.ts', '**/*.schema.ts'], {
    cwd: basedir,
    gitignore: true,
  })
}
