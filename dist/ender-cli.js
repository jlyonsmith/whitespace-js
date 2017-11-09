#!/usr/bin/env node
'use strict';

var _Ender = require('./Ender');

var _chalk = require('chalk');

var _chalk2 = _interopRequireDefault(_chalk);

function _interopRequireDefault(obj) { return obj && obj.__esModule ? obj : { default: obj }; }

const log = {
  info: console.error,
  error: function () {
    console.error(_chalk2.default.red('error:', [...arguments].join(' ')));
  },
  warning: function () {
    console.error(_chalk2.default.yellow('warning:', [...arguments].join(' ')));
  }
};

const tool = new _Ender.Ender(console);
tool.run(process.argv.slice(2)).then(exitCode => {
  process.exit(exitCode);
}).catch(err => {
  console.error(err);
});
//# sourceMappingURL=ender-cli.js.map