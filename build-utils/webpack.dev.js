// eslint-disable-next-line import/no-extraneous-dependencies
const { DefinePlugin } = require('webpack');

module.exports = {
  mode: 'development',
  plugins: [
    new DefinePlugin({
      'process.env': {
        NODE_ENV: JSON.stringify('development'),
      },
    }),
  ],
};
