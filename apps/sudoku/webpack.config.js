const path = require('path');
const HtmlWebpackPlugin = require('html-webpack-plugin');
const webpack = require('webpack');

module.exports = (env, argv) => {
  const isProduction = argv.mode === 'production';

  return {
    entry: './src/main.tsx',
    mode: argv.mode || 'development',
    devtool: isProduction ? 'source-map' : 'eval-source-map',
    output: {
      path: path.resolve(__dirname, 'dist'),
      filename: 'bundle.js',
      clean: true
    },
    resolve: {
      extensions: ['.ts', '.tsx', '.js', '.jsx'],
      symlinks: true,
      fallback: {
        // Essential polyfills for ts-sudoku-ui library compatibility
        crypto: false, // Use native Web Crypto API instead
        stream: require.resolve('stream-browserify'), // Needed by some dependencies
        util: require.resolve('util'), // Needed by some dependencies
        buffer: require.resolve('buffer'), // Needed by some dependencies
        process: require.resolve('process/browser.js'), // Needed by some dependencies
        zlib: false, // Not needed for sudoku app
        assert: false, // Not needed for browser app
        fs: false,
        path: false,
        vm: false
      }
    },
    module: {
      rules: [
        {
          test: /\.tsx?$/,
          use: 'babel-loader',
          exclude: /node_modules/
        },
        {
          test: /\.css$/,
          use: ['style-loader', 'css-loader', 'postcss-loader']
        }
      ]
    },
    plugins: [
      new HtmlWebpackPlugin({
        template: './public/index.html',
        title: 'FGV Sudoku'
      }),
      new webpack.ProvidePlugin({
        process: 'process/browser.js',
        Buffer: ['buffer', 'Buffer']
      })
    ],
    devServer: {
      port: 3002,
      hot: true,
      open: true
    }
  };
};
