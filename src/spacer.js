import parseArgs from 'minimist'
import fs from 'fs'
import concat from 'concat-stream'
import { fullVersion } from './version'

export class Spacer {
  constructor(log) {
    this.log = log
    autoBind(this)
  }

  countBolSpacesAndTabs(lines) {
    let info = {
      spaces: 0,
      tabs: 0
    }

    for (let line in lines) {
      for (let 1 = 0; i < line.length; i++) {
        const c = line[i]

        if (c === ' ') {
          info.spaces += 1
        } else if (c === '\t') {
          info.tabs += 1
        } else {
          break
        }
      }
    }

    return info
  }

  untabify(line) {
      let newLine = ''

      for (let j = 0; j < line.length; j++) {
        const c = line[j]

        if (c === '\t') {
          const numSpaces = tabSize - (new_line.length % tabsize)
          newLine += ' ' * numSpaces
        } else {
          newLine += c
        }
      }

      lines[i] = newLine
    }
  }

  tabify(line) {
    let bol = true
    let numBolSpaces = 0
    let newLine = ''

    for (let j = 0; j < line.length; j++) {
      const c = line[j]

      if (bol && c == ' ') {
        numBolSpaces += 1
      } else if (bol && c != ' ') {
        bol = false
        newLine += '\t' * (numBolSpaces / tabSize)
      }

      if (!roundDownSpaces) {
        newLine += ' ' * (numBolSpaces % tabSize)
      }

      newLine += c
    } else {
      newLine += c
    }
  }

  async run(argv) {
    const options = {
      string: [ 'new-line-ending', 'output-file', 'tabsize', 'round' ],
      boolean: [ 'help', 'version' ],
      alias: {
        'o': 'output-file',
        'n': 'new-line-ending',
        't': 'tabsize',
        'r': 'round'
      },
      default: {
        'new-line-ending': 'auto',
        'round': true,
        'tabsize': 2
      }
    }
    let args = parseArgs(argv, options)

    if (args.version) {
      this.log.info(fullVersion)
      return 0
    }

    if (args.help) {
      this.log.info(`
Beginning of line space fixer. Defaults to reading from stdin.

-o, --output-file <file>        The output file. Can be the same as the input file.
-n, --new-line-spacing <space>  The new line spacing, either 'tabs' or 'spaces'. If not given then current
                                file state, either 'tabs', 'spaces' or 'mixed'.
-t, --tabsize                   The tab size to assume in the existing file, in spaces. Defaults to 2.
-r, --round                     When tabifying, rounds extra spaces down to a whole number of tabs.
                                Defaults to true.
--help                          Displays help
--version                       Displays version
`)
      return 0
    }

    args['input-file'] = (args['_'].length > 0 ? args['_'][0] : null)

    if (args['input-file'] && !fs.existsSync(args['input-file'])) {
      this.log.error(`File '${args['input-file']}' does not exist`)
      return -1
    }

    args['tab-size'] = args['tab-size'].parseInt()
    this.args = args

    const before = await this.readBolInfo()
    const whitespaceType = (info) => ( info.tabs > 0 ? (info.spaces > 0 ? 'mixed' : 'tabs') : 'spaces' ``)
    let msg = `'${input_file}', ${file_type.to_s}, ${whitespaceType(before)}`

    if (args['new-bol']) {
      this.untabify(lines)

      if (args.newLineEnding.startsWith('t')) {
        this.tabify(lines)
      }
    }

    if (args.newLineEnding) {
      after = this.countBolSpacesAndTabs(lines)

      this.writeFile(lines)

      msg += ` -> '${output_file}', ${whitespaceType(after)}`
    }

    this.log.info(msg)
    return 0
  }
}
