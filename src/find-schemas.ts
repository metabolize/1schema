import { globby } from 'globby'

export async function findSourceSchemas(basedir?: string): Promise<string[]> {
  return globby(['**/schema.ts', '**/*.schema.ts'], {
    cwd: basedir,
    gitignore: true,
  })
}

export async function findGeneratedSchemas(
  basedir?: string
): Promise<string[]> {
  return globby(['**/generated/schema.json', '**/generated/*.schema.json'], {
    cwd: basedir,
    gitignore: true,
  })
}
