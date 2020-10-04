const webpackMerge = require('webpack-merge');
const commonConfig = require('./webpack.common');
const devConfig = require('./webpack.dev');
const prodConfig = require('./webpack.prod');

module.exports = ({ env }) => {
  let envConfig;
  switch (env) {
    case 'dev':
      envConfig = devConfig;
      break;
    case 'prod':
      envConfig = prodConfig;
      break;
    default:
      throw new Error('Unknown env');
  }
  return webpackMerge(commonConfig, envConfig);
};
