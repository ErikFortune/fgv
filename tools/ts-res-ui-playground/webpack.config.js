const path = require('path');
const HtmlWebpackPlugin = require('html-webpack-plugin');
const webpack = require('webpack');

module.exports = {
  entry: './src/main.tsx',
  output: {
    path: path.resolve(__dirname, 'dist'),
    filename: 'bundle.js',
    clean: true
  },
  resolve: {
    extensions: ['.ts', '.tsx', '.js', '.jsx'],
    symlinks: true,
    fallback: {
      // Keep only essential polyfills for ts-res libraries
      crypto: false, // Use native Web Crypto API instead
      stream: require.resolve('stream-browserify'), // Needed by some dependencies
      util: require.resolve('util'), // Needed by some dependencies
      buffer: require.resolve('buffer/'), // Needed by some dependencies
      process: require.resolve('process/browser'), // Needed by some dependencies
      zlib: false, // Not needed since we use FileApiTreeAccessors
      assert: false, // Not needed for browser tools
      // Remove fs and path since we're using in-memory FileTree
      fs: false,
      path: false,
      vm: false
    },
    alias: {
      // Replace the Node.js ZIP implementation with empty module
      'adm-zip': false
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
      template: './public/index.html'
    }),
    new webpack.ProvidePlugin({
      process: 'process/browser',
      Buffer: ['buffer', 'Buffer']
    })
  ],
  devServer: {
    port: 3001,
    hot: true,
    open: true
  }
};
