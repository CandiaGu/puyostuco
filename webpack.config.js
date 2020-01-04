const HtmlWebPackPlugin = require('html-webpack-plugin');
const path = require('path');

module.exports = {
  entry: {
    practice: './src/scripts/gameSingle.js',
    multi: './src/scripts/gameMulti.js',
  },
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
    path: path.join(__dirname, '/dist'),
    filename: '[name].js',
  },
  plugins: [
    new HtmlWebPackPlugin({
      template: './src/html/practice.html',
      chunks: ['practice'],
      filename: './practice.html',
    }),
    new HtmlWebPackPlugin({
      template: './src/html/multiplayer.html',
      chunks: ['multi'],
      filename: './multiplayer.html',
    }),
  ],
};
