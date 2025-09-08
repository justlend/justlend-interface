const { override, addWebpackModuleRule, addDecoratorsLegacy, disableEsLint, overrideDevServer, watchAll } = require('customize-cra');
const webpack = require('webpack');

const rewiredMap = () => config => {
  config.devtool = config.mode === 'development' ? 'cheap-module-source-map' : false;
  return config;
};

const ignoreWarnings = value => config => {
  config.ignoreWarnings = value;
  return config;
};

const addResolution = () => config => {
  config.resolve.alias = {
    ...config.resolve.alias,
    'ethereum-cryptography/secp256k1': require.resolve('ethereum-cryptography/secp256k1.js')
  }
  config.resolve.alias['@ledgerhq/devices/hid-framing'] = '@ledgerhq/devices/lib/hid-framing.js';
  config.resolve.fallback = {
    ...config.resolve.fallback,
    process: require.resolve('process'),
    stream: require.resolve('stream-browserify'),
    assert: require.resolve("assert/"),
    constants: require.resolve("constants-browserify"),
    buffer: require.resolve('buffer/'),
    crypto: require.resolve("crypto-browserify"),
    querystring: require.resolve("querystring-es3")
  };
  if (config.watchOptions) {
    config.watchOptions = {
      ...config.watchOptions,
      ignored: [/node_modules/, /dist/, /public/],
      poll: 1000,
      aggregateTimeout: 200,
      usePolling: true,
    };
  }
  config.plugins = [
    ...config.plugins,
    new webpack.ProvidePlugin({
      Buffer: ['buffer', 'Buffer'],
      process: "process",
    }),
  ];
  return config;
};

module.exports = {
  webpack: override(
    addWebpackModuleRule({ test: /\.cjs$/, type: 'javascript/auto' }),
    // enable legacy decorators babel plugin
    addDecoratorsLegacy(),
    // usual webpack plugin
    disableEsLint(),
    rewiredMap(),
    ignoreWarnings([/Failed to parse source map/]),
    addResolution()
  ),
  devServer: overrideDevServer(
    // dev server plugin
    watchAll()
  )
};
