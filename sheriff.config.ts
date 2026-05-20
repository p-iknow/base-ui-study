import { noDependencies, sameTag, SheriffConfig } from '@softarc/sheriff-core'

export const config: SheriffConfig = {
  enableBarrelLess: true,

  entryPoints: {
    playground: './apps/playground/src/routes/index.tsx',
  },

  modules: {
    'apps/playground/src': 'app:playground',
    'packages/package/src': 'lib:package',
  },

  depRules: {
    'app:*': [sameTag, 'lib:package'],
    'lib:package': noDependencies,
    root: ['app:*', 'lib:package', 'noTag'],
    noTag: ['noTag', 'lib:package'],
  },
}
