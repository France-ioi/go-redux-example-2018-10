
require("dotenv").config();

const fs = require("fs");
const path = require("path");
const http = require("http");
const express = require("express");

const rootPath = path.resolve(__dirname);
const isDevelopment = process.env.NODE_ENV !== "production";
const webpackConfig = require(path.join(rootPath, "webpack.config.js"));

let app = express();

app.enable("strict routing");
app.set("views", rootPath);
app.set("view engine", "pug");

app.use("/public", express.static(path.join(rootPath, "public")));

let makeDistUrl;
if (isDevelopment) {
  const webpack = require("webpack");
  const compiler = webpack(webpackConfig);
  app.use(require("webpack-dev-middleware")(compiler, {
    publicPath: '/dist',
    logLevel: "warn",
    headers: {
      'Cache-Control': 'max-age=0, must-revalidate'
    }
  }));
  app.use(require("webpack-hot-middleware")(compiler, {
    log: console.log, path: "/__webpack_hmr", heartbeat: 10 * 1000
  }));
  app.use("/node_modules", express.static(path.join(rootPath, "node_modules")));
  const logger = require("logops");
  const expressLogging = require("express-logging");
  app.use(expressLogging(logger));
  makeDistUrl = (path) => `${mountPath}/dist/${path}`;
} else {
  const ts = fs.statSync(path.join(rootPath, "dist")).getTime().toString();
  app.use("/dist", express.static(webpackConfig.output.path, {maxage: '1y'}));
  makeDistUrl = (path) => `${mountPath}/dist/${path}?t=${ts}`;
}
app.use("/dist", function(req, res, next) {
  res.status(404).send('Not Found')
});

app.get("*", function (req, res) {
  res.render("index", {
    options: {mountPath},
    distUrl: makeDistUrl,
  });
});

const mountPath = process.env.MOUNT_PATH || "";
if (mountPath) {
  console.log(`App mounted at ${mountPath}`);
  const rootApp = express();
  rootApp.use(mountPath, app);
  app = rootApp;
}

const port = parseInt(process.env.PORT) || 8100;
console.log("Starting http server on port", port);
http.createServer(app.listen(port));
