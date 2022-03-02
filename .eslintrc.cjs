// vim: sts=2:ts=2:sw=2
module.exports = {
  'globals': {
    'define': true
  },
  'env': {
    'browser': true,
    'commonjs': true,
    'node': true
  },
  'extends': 'eslint:recommended',
  'rules': {
    'indent': [
      'error',
      2
    ],
    'linebreak-style': [
      'error',
      'unix'
    ],
    'quotes': [
      'error',
      'single'
    ],
    'semi': [
      'error',
      'always'
    ]
  }
};
