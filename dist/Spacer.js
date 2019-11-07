#!/usr/bin/env node
"use strict";

var _SpacerTool = require("./SpacerTool");

var _chalk = _interopRequireDefault(require("chalk"));

function _interopRequireDefault(obj) { return obj && obj.__esModule ? obj : { default: obj }; }

const log = {
  info: console.error,
  error: function () {
    console.error(_chalk.default.red("error:", [...arguments].join(" ")));
  },
  warning: function () {
    console.error(_chalk.default.yellow("warning:", [...arguments].join(" ")));
  }
};
const tool = new _SpacerTool.SpacerTool(console);
tool.run(process.argv.slice(2)).then(exitCode => {
  process.exit(exitCode);
}).catch(err => {
  console.error(err);
});
//# sourceMappingURL=spacer.js.map