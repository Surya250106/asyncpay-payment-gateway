const path = require("path");

module.exports = {
  entry: "./src/sdk/PaymentGateway.js",
  output: {
    path: path.resolve(__dirname, "dist"),
    filename: "checkout.js",
    library: "PaymentGateway",
    libraryTarget: "umd",
  },
  module: {
    rules: [
      {
        test: /\.css$/,
        use: ["style-loader", "css-loader"],
      },
      {
        test: /\.jsx?$/,
        exclude: /node_modules/,
        use: "babel-loader",
      },
    ],
  },
  resolve: {
    extensions: [".js", ".jsx"],
  },
  mode: "production",
};
