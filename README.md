# 1schema

1schema provides friendly developer tooling for runtime checking of TypeScript
schemas. It uses the powerful and effective [ts-json-schema-generator][] to
generate [JSON Schema][] which can be validated at runtime using 1schema's
built-in support for [Ajv][] or [any other JSON Schema validator][validators].
For example, in our Python projects we use [jsonschema][python-jsonschema].

This is way better than writing and maintaining JSON Schema by hand, and if you
use TypeScript you also get the benefit of compile-time checking.

Since the schemas are written in TypeScript it's ideal for TypeScript projects,
however it's easy to use in JavaScript projects, and works in non-JavaScript
projects too.

I didn't write this blog post, but
[it explains the idea really well][blog post].

We've been using this pattern for a while at Metabolize–Curvewise, both for
validating user uploads and validating across interface boundaries. This
open-source tooling is new and considered alpha. Developer feedback and
contributions welcome!

[ts-json-schema-generator]: https://github.com/vega/ts-json-schema-generator
[JSON Schema]: https://json-schema.org/
[ajv]: https://ajv.js.org/
[validators]: https://json-schema.org/implementations.html#validators
[python-jsonschema]: https://python-jsonschema.readthedocs.io/en/stable/validate/
[blog post]: https://levelup.gitconnected.com/how-we-use-our-typescript-type-information-at-runtime-6e95b801cfeb

## How it works

- In your project, create a `schema.ts` file:
    ```ts
    export type ContactMethodType = 'mobile' | 'home' | 'work' | 'other'

    export interface Address {
      streetAddress: string
      locality: string
      region: string
      postalCode: string
      country: string
    }

    export interface Contact {
      familyName: string
      givenName: string
      honorificPrefix?: string
      honorificSuffix?: string
      nickname?: string
      url?: string
      imageUrl?: string
      email: {
        address: string
        type: ContactMethodType
      }[]
      phone: {
        phoneNumber: string
        type: ContactMethodType
      }[]
      address: Array<Address & { type: ContactMethodType }>
      birthdate: Date
      gender?: string
    }
    ```
- Run `1schema update` to generate `generated/schema.json` with all exported
  types and their dependents. Check in this file.
- At runtime, `import { validate } from '1schema'` and `validate(inputData)`.
- If you're using TypeScript, cast the validated input to the appropriate type
  from your schema (e.g. `const contact = inputData as Contact`) to get
  compile-time checking.
- In CI, run `1schema check` to verify the generated schema are up to date.

Your schema files are just ordinary TypeScript files so they can import and
extend other TypeScript types and schemas, so long as
[the types are supported by ts-json-schema-validator][supported types].

If you have a `tsconfig.json` it will be used and if not one is provided for
you.

You can spread schemas across multiple files: If you create: `this.schema.ts`,
`that.schema.ts`, `the-other/schema.ts`. Running `1schema update` will generate
`generated/this.schema.json`, `generated/that.schema.json` and
`the-other/schema.json`.

[supported types]: https://github.com/vega/ts-json-schema-generator#current-state

## Related projects

We use 1schema with [Werkit][], a toolkit for encapsulating Python functions on
AWS Lambda.

[werkit]: https://github.com/metabolize/werkit/

## Acknowledgements

Serious thanks to [Dominik Moritz][] for maintaining the wonderful
ts-json-schema-validator tool. And thanks to [Jacob Beard][] who turned me back
onto JSON Schema in the first place.

[Dominik Moritz]: https://github.com/domoritz
[Jacob Beard]: https://github.com/jbeard4
