const path = require('path');
const HtmlWebpackPlugin = require('html-webpack-plugin');

module.exports = (env, argv) => {
  const isProduction = argv.mode === 'production';

  return {
    entry: './src/web/index.tsx',
    mode: argv.mode || 'development',
    devtool: isProduction ? 'source-map' : 'eval-source-map',
    output: {
      path: path.resolve(__dirname, 'dist-web'),
      filename: 'bundle.js',
      clean: true
    },
    resolve: {
      extensions: ['.ts', '.tsx', '.js', '.jsx'],
      symlinks: true
      // No `resolve.fallback` stubs for Node core modules (fs/path/crypto/os/...): a stub
      // silently masks a Node-only import leaking into the browser bundle. Node-only code
      // must be loaded via `webpackIgnore` dynamic imports inside CLI-only scenario paths
      // (see e.g. scenarios/mcpProbe); a resolve error here means a scenario broke that rule.
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
        title: 'fgv testbed'
      })
    ],
    // @huggingface/transformers (transformers.web.js) uses a standalone `import.meta`
    // for environment detection. webpack 5 can't statically analyze it and emits a
    // "Critical dependency: 'import.meta' ..." warning, replacing the expression with
    // `{}` (the library falls back correctly). The warning is benign; scope it out so it
    // doesn't surface as a dev-server overlay. Keep the scope narrow so real warnings show.
    ignoreWarnings: [
      {
        module: /@huggingface[/\\]transformers/,
        message: /Critical dependency: 'import\.meta'/
      }
    ],
    devServer: {
      port: 3004,
      hot: true,
      open: true,
      // Show real errors as a full-screen overlay, but not warnings (the benign
      // transformers.js import.meta warning would otherwise read as a startup error).
      client: {
        overlay: { errors: true, warnings: false }
      }
    }
  };
};
