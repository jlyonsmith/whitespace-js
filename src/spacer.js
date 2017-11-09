import parseArgs from 'minimist'
import fs from 'fs'
import concat from 'concat-stream'
import { fullVersion } from './version'
import autoBind from 'auto-bind2'
import stream from 'stream'

export class Spacer {
  constructor(log) {
    this.log = log
    autoBind(this)
  }

  readBolInfo() {
    return new Promise((resolve, reject) => {
      const readable = (!this.args['input-file'] ? process.stdin :
        fs.createReadStream(this.args['input-file'], { encoding: 'utf8' }))

      // Read the entire file && determine all the different line endings
      let info = {
        spaces: 0,
        tabs: 0,
      }

      readable.on('error', (err) => {
        reject(err)
      })

      let writable = concat((fileContents) => {
        info.fileContents = fileContents
        let i = 0
        let atBol = true

        while (i < fileContents.length) {
          const c = fileContents[i]

          if (atBol) {
            if (c === ' ') {
              info.spaces += 1
            } else if (c === '\t') {
              info.tabs += 1
            } else {
              atBol = false
            }
          } else if (c === '\n') {
            atBol = true
          }

          i += 1
        }

        resolve(info)
      })
      readable.pipe(writable)
    })
  }

  async writeNewFile(info) {
    function untabify(s, ts) {
      let t = ''

      for (let i = 0; i < s.length; i++) {
        const c = s[i]

        if (c === '\t') {
          const n = ts - (t.length % ts)

          t += ' '.repeat(n)
        } else {
          t += c
        }
      }

      return t
    }

    function tabify(s, ts, r) {
      let ns = 0
      let t = ''

      for (let i = 0; i < s.length; i++) {
        const c = s[i]

        if (c === ' ') {
          ns += 1
        }

        if (ns % ts === 0) {
          t += '\t'
          ns = 0
        }
      }

      if (ns > 0) {
        if (!r) {
          t += ' '.repeat(ns)
        } else {
          ns = 0
        }
      }

      return [t, ns]
    }

    return new Promise((resolve, reject) => {
      info.newSpaces = 0
      info.newTabs = 0

      let writable = null

      if (!this.args['output-file']) {
        writable = new stream.PassThrough()
        writable.pipe(process.stdout)
      } else {
        writable = fs.createWriteStream(this.args['output-file'], { flags: 'w', encoding: 'utf8' })
      }

      writable.on('finish', () => {
        resolve()
      })
      writable.on('error', (err) => {
        reject()
      })

      const toTabs = (this.args['new-bol'] === 'tabs')
      let atBol = true
      let ts = this.args['tab-size']
      let r = this.args['round']
      let i = 0
      let s = ''

      while (i < info.fileContents.length) {
        const c = info.fileContents[i]

        if (c === '\n') {
          s = ''
          atBol = true
          writable.write(c)
        } else if (atBol) {
          if (c === ' ' || c === '\t') {
            s += c
          } else {
            atBol = false

            s = untabify(s, ts)

            if (toTabs) {
              const [t, ns] = tabify(s, ts, r)

              s = t
              info.newTabs += t.length - ns
              info.newSpaces += ns
            } else {
              info.newSpaces += s.length
            }

            writable.write(s)
            writable.write(c)
            atBol = false
          }
        } else {
          writable.write(c)
        }

        i += 1
      }

      writable.end()
    })
  }

  async run(argv) {
    const options = {
      string: [ 'new-bol', 'output-file', 'tab-size' ],
      boolean: [ 'help', 'version', 'round' ],
      alias: {
        'o': 'output-file',
        'n': 'new-bol',
        't': 'tab-size',
        'r': 'round',
      },
      default: {
        'round': false,
        'tab-size': '2',
      }
    }
    let args = parseArgs(argv, options)

    if (args.version) {
      this.log.info(fullVersion)
      return 0
    }

    if (args.help) {
      this.log.info(`
Beginning of line normalizer.

spacer [<options>] <file>

<file>                      The input file. Defaults to reading from STDIN.
-o, --output-file <file>    The output file. Can be the same as the input file. Defaults to STDOUT.
-n, --new-bol <space>       The new BOL line spacing, either 'tabs' or 'spaces' or 'auto'.
                            Default is to just report.
-t, --tab-size               The tab size to assume in the existing file, in spaces. Defaults to 2.
-r, --round                 When tabifying, rounds extra spaces down to a whole number of tabs.
                            Defaults to false.
--help                      Displays help
--version                   Displays version
`)
      return 0
    }

    args['input-file'] = (args['_'].length > 0 ? args['_'][0] : null)

    if (args['input-file'] && !fs.existsSync(args['input-file'])) {
      this.log.error(`File '${args['input-file']}' does not exist`)
      return -1
    }

    const bolList = ['tabs', 'spaces', 'auto']
    if (args['new-bol'] && !bolList.includes(args['new-bol'])) {
      this.log.error(`New BOL must be one of ${bolList.join(', ')}`)
      return -1
    }

    args['tab-size'] = parseInt(args['tab-size'])
    this.args = args

    const info = await this.readBolInfo()
    const bolType = (s, t) => (t > 0 ? (s > 0 ? 'mixed' : 'tabs') : 'spaces')
    let msg = `'${args['input-file'] || '<STDIN>'}', ${bolType(info.spaces, info.tabs)}`

    if (args['new-bol']) {
      if (args['new-bol'] === 'auto') {
        if (info.spaces > info.tabs) {
          args['new-bol'] = 'spaces'
        } else {
          args['new-bol'] = 'tabs'
        }
      }

      if (!(this.args['new-bol'] === 'tabs' && info.spaces === 0) &&
          !(this.args['new-bol'] === 'spaces' && info.tabs === 0)) {
        // We're not changing the line beginnings; nothing to do
        await this.writeNewFile(info)
      } else {
        info.newSpaces = info.spaces
        info.newTabs = info.tabs
      }

      msg += ` -> '${args['output-file'] || '<stdout>'}', ${bolType(info.newSpaces, info.newTabs)}`
    }

    this.log.info(msg)

    return 0
  }
}
