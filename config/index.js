import { version } from '../package.json'

// ?? 🤔 ?? --> https://en.freesewing.dev/packages/core/config

export default {
  name: 'maude',
  version,
  design: 'sannek',
  code: 'sannek',
  department: 'womenswear',
  type: 'block',
  difficulty: 3,
  tags: [
    'freesewing',
    'design',
    'diy',
    'fashion',
    'made to measure',
    'parametric design',
    'block',
    'sewing',
    'sewing pattern'
  ],
  optionGroups: {
    fit: ['size']
  },
  measurements: [],
  dependencies: {},
  inject: {},
  hide: [],
  parts: ['box'],
  options: {
    size: { pct: 50, min: 10, max: 100 }
  }
}
