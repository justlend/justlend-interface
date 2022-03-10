const { override, addDecoratorsLegacy, disableEsLint, overrideDevServer, watchAll } = require('customize-cra');

module.exports = {
  webpack: override(
    // enable legacy decorators babel plugin
    addDecoratorsLegacy(),
    // usual webpack plugin
    disableEsLint()
  ),
  devServer: overrideDevServer(
    // dev server plugin
    watchAll()
  )
};
