module.exports = {
  entry: "./src/index.js",
  output: {
    filename: "webextension-messages.js",
    library: "WebextensionMessages",
    libraryTarget: "umd",
    globalObject: "this",
  },
  mode: "development",
  watch: true,

  stats: {
    colors: true,
  },

  devtool: false,
};
