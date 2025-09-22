module.exports = {
  presets: [
    [
      '@babel/preset-env',
      {
        targets: {
          node: '20'
        }
      }
    ],
    '@babel/preset-typescript'
  ],
  env: {
    test: {
      plugins: [
        [
          'babel-plugin-istanbul',
          {
            preserveComments: true
          }
        ]
      ]
    }
  },
  sourceMaps: 'inline'
};
