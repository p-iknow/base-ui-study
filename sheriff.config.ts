import { noDependencies, sameTag, SheriffConfig } from '@softarc/sheriff-core'

export const config: SheriffConfig = {
  enableBarrelLess: true,

  entryPoints: {
    playground: './apps/playground/src/routes/index.tsx',
  },

  modules: {
    'apps/playground/src': 'app:playground',
    'packages/react/src': 'lib:react',
    'packages/utils/src': 'lib:utils',
  },

  depRules: {
    'app:*': [sameTag, 'lib:react', 'lib:utils'],
    'lib:react': ['lib:utils'],
    'lib:utils': noDependencies,
    root: ['app:*', 'lib:react', 'lib:utils', 'noTag'],
    noTag: ['noTag', 'lib:react', 'lib:utils'],
  },
}
