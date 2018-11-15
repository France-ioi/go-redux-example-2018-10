
require("dotenv").config();

const path = require('path');
const webpack = require("webpack");
const distPath = path.resolve(__dirname, 'dist');
const isDevelopment = process.env.NODE_ENV === 'development';
const isProduction = process.env.NODE_ENV === 'production';
const mountPath = process.env.MOUNT_PATH || '';
if (!isDevelopment && !isProduction) {
  console.log(`Unsupported NODE_ENV "${process.env.NODE_ENV}"`);
}
console.log(`public path is ${mountPath}/dist`);

const config = {
  entry: {
    main: [
      isDevelopment ? './src/index.dev.tsx' : './src/index.prod.ts'
    ]
  },
  output: {
    path: distPath,
    publicPath: `${mountPath}/dist`,
    filename: '[name].js',
  },
  mode: isDevelopment ? 'development' : 'production',
  devtool: isDevelopment ? 'inline-source-map' : 'eval',
  resolve: {
    extensions: [".tsx", ".ts", ".js", ".json"]
  },
  module: {
    rules: [
      {
        test: /(\.js|\.ts)x?$/,
        exclude: /node_modules/,
        use: [{loader: 'ts-loader'}]
      },
      {
        test: /\.css$/,
        use: [
          {loader: 'style-loader', options: {sourceMap: isDevelopment}},
          {loader: 'css-loader', options: {}},
        ]
      },
      {
        test: /\.scss$/,
        use: [
          {loader: 'style-loader', options: {sourceMap: isDevelopment}},
          {loader: 'css-loader'},
          {loader: 'resolve-url-loader'},
          {loader: 'sass-loader', options: {sourceMap: isDevelopment, precision: 8}}
        ]
      },
      {
        test: /\.(eot|ttf|woff(2)?)(\?v=\d+\.\d+\.\d+)?/,
        use: [
          {loader: 'file-loader', options: {name: 'fonts/[name].[ext]'}}
        ]
      },
      {
        test: /\.(ico|gif|png|jpg|jpeg|svg)$/,
        use: [
          {loader: 'file-loader', options: {name: 'images/[name].[ext]'}}
        ]
      }
    ]
  },
  node: {
    fs: 'empty'
  },
  plugins: [
    new webpack.EnvironmentPlugin(['NODE_ENV', 'MOUNT_PATH', 'BACKEND_URL']),
    new webpack.optimize.OccurrenceOrderPlugin()
  ],
  optimization: {
    splitChunks: {
      cacheGroups: {
        vendors: {
          test: /[\\/]node_modules[\\/]/,
          name: 'vendor',
          chunks: 'all'
        }
      }
    }
  },
  performance: {
    hints: false
  }
};

if (isDevelopment) {
  config.entry.main.push(
    `webpack-hot-middleware/client?path=${mountPath}/__webpack_hmr&timeout=20000`);
  config.plugins.push(new webpack.HotModuleReplacementPlugin());
}

require('pretty-error').start();
/*
Error.prepareStackTrace = Error.prepareStackTrace || function (exc, frames) {
  return exc.toString() + "\n" + frames.map(function (frame) {
    return `  at ${frame.toString()}`;
  }).join("\n");
};
*/
const oldPrepareStackTrace = Error.prepareStackTrace;
const nodeModulesPath = path.resolve(__dirname, 'node_modules');
Error.prepareStackTrace = function (exc, frames) {
  let hideNodeModules = false;
  frames = frames.filter(function (call_site) {
    const fn = call_site.getFileName();
    if (fn && fn.startsWith(nodeModulesPath)) {
      if (hideNodeModules) {
        return false;
      } else {
        hideNodeModules = true;
        return true;
      }
    }
    return true;
  });
  return oldPrepareStackTrace.call(null, exc, frames);
};

module.exports = config;
