import parseArgs from 'minimist'
import fs from 'fs'
import concat from 'concat-stream'
import autoBind from 'auto-bind2'
import { fullVersion } from './version'

export class Ender {
  constructor(log) {
    autoBind(this)
    this.log = log
  }

  async readEolInfo() {
    return new Promise((resolve, reject) => {
      const readable = (!this.args['input-file'] ? process.stdin :
        fs.createReadStream(this.args['input-file'], { encoding: 'utf8' }))

      // Read the entire file && determine all the different line endings
      this.numCR = 0
      this.numLF = 0
      this.numCRLF = 0
      this.numLines = 1

      readable.on('error', (err) => {
        reject(err)
      })
      let writeable = concat((fileContents) => {
        this.fileContents = fileContents
        let i = 0
        while (i < fileContents.length) {
          const c = fileContents[i]

          if (c == '\r') {
            if (i < fileContents.length - 1 && fileContents[i + 1] == '\n') {
              this.numCRLF += 1
              i += 1
            } else {
              this.numCR += 1
            }

            this.numLines += 1
          } else if (c == '\n') {
            this.numLF += 1
            this.numLines += 1
          }
          i += 1
        }

        this.numEndings = (this.numCR > 0 ? 1 : 0) + (this.numLF > 0 ? 1 : 0) + (this.numCRLF > 0 ? 1 : 0)
        resolve()
      })
      readable.pipe(writeable)
    })
  }

  async writeNewFile() {
    return new Promise((resolve, reject) => {
      let newNumLines = 1

      if ((this.args['new-eol'] === 'cr' && this.numCR + 1 === this.numLines) ||
          (this.args['new-eol'] === 'lf' && this.numLF + 1 === this.numLines) ||
          (this.args['new-eol'] === 'crlf' && this.numCRLF + 1 === this.numLines)) {
        // We're not changing the line endings; nothing to do
        return resolve()
      }

      const newlineChars = (this.args['new-eol'] === 'cr' ? '\r' : this.args['new-eol'] === 'lf' ? '\n' : '\r\n')
      const writeable = fs.createWriteStream(this.args['output-file'], { flags: 'w', encoding: 'utf8' })

      writeable.on('finish', () => {
        resolve()
      })
      writeable.on('error', (err) => {
        reject()
      })

      let i = 0
      while (i < this.fileContents.length) {
        const c = this.fileContents[i]

        if (c == '\r') {
          if (i < this.fileContents.length - 1 && this.fileContents[i + 1] == '\n') {
            i += 1
          }

          newNumLines += 1
          writeable.write(newlineChars)
        } else if (c == '\n') {
          newNumLines += 1
          writeable.write(newlineChars)
        } else {
          writeable.write(c)
        }

        i += 1
      }
      writeable.end()
      this.newNumLines = newNumLines
    })
  }

  async run(argv) {
    const options = {
      string: [ 'new-eol', 'output-file' ],
      boolean: [ 'help', 'version' ],
      alias: {
        'o': 'output-file',
        'n': 'new-eol'
      },
      default: {
        'new-eol': 'auto',
      }
    }
    let args = parseArgs(argv, options)

    if (args.version) {
      this.log.info(fullVersion)
      return 0
    }

    if (args.help) {
      this.log.info(`
Line ending fixer. Defaults to reading from stdin.

-o, --output-file <file>  The output file. Can be the same as the input file. Defaults to stdout.
-n, --new-eol <ending>    The new EOL, either 'auto', 'cr', 'lf', 'crlf'.  'auto' will use the most
                          commonly occurring ending in the input file.
--help                    Displays help
--version                 Displays version
`)
      return 0
    }

    args['input-file'] = (args['_'].length > 0 ? args['_'][0] : null)
    this.args = args

    if (args['input-file'] && !fs.existsSync(args['input-file'])) {
      this.log.error(`File '${args['input-file']}' does not exist`)
      return -1
    }

    let msg = ''

    await this.readEolInfo()

    msg += `'${args['input-file'] || '<stdin>'}', ${this.numEndings > 1 ? 'mixed' : this.numCR > 0 ? 'cr' : this.numLF > 0 ? 'lf' : 'crlf'}, ${this.numLines} lines`

    if (args['new-eol'] === 'auto') {
      // Find the most common line ending && make that the automatic line ending
      this.args['new-eol'] = 'lf'
      let n = this.numLF

      if (this.numCRLF > n) {
        args['new-eol'] = 'crlf'
        n = this.numCRLF
      }

      if (this.numCR > n) {
        args['new-eol'] = 'cr'
      }
    }

    await this.writeNewFile()

    msg += ` -> '${args['output-file'] || '<stdout>'}', ${this.args['new-eol']}, ${this.newNumLines} lines`
    this.log.error(msg)
    return 0
  }
}
