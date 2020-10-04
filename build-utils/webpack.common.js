// eslint-disable-next-line import/no-extraneous-dependencies
const HtmlWebPackPlugin = require('html-webpack-plugin');
const path = require('path');

module.exports = {
  devServer: {
    historyApiFallback: true,
  },
  entry: './src/index.js',
  module: {
    rules: [
      {
        test: /\.js?$/,
        exclude: /node_modules/,
        use: {
          loader: 'babel-loader',
        },
      },
      {
        test: /\.html$/,
        use: [
          {
            loader: 'html-loader',
          },
        ],
      },
      {
        test: /\.css$/,
        use: ['style-loader', 'css-loader'],
      },
    ],
  },
  output: {
    path: path.resolve(__dirname, '../', 'dist'),
    publicPath: '/',
  },
  plugins: [
    new HtmlWebPackPlugin({
      hash: true,
      template: './public/index.html',
      filename: './index.html',
    }),
  ],
};
