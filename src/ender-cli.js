#!/usr/bin/env node
import { Ender } from './Ender'
import chalk from 'chalk'

const log = {
  info: console.info,
  error: function() { console.error(chalk.red('error:', [...arguments].join(' ')))},
  warning: function() { console.error(chalk.yellow('warning:', [...arguments].join(' ')))}
}

const tool = new Ender(console)
tool.run(process.argv.slice(2)).then((exitCode) => {
  process.exit(exitCode)
}).catch((err) => {
  console.error(err)
})
