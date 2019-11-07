import parseArgs from "minimist"
import fs from "fs"
import concat from "concat-stream"
import { fullVersion } from "./version"
import stream from "stream"
import autobind from "autobind-decorator"

@autobind
export class Ender {
  constructor(log) {
    this.log = log
  }

  async readEolInfo() {
    return new Promise((resolve, reject) => {
      const readable = !this.args["input-file"]
        ? process.stdin
        : fs.createReadStream(this.args["input-file"], { encoding: "utf8" })

      // Read the entire file && determine all the different line endings
      let info = {
        numCR: 0,
        numLF: 0,
        numCRLF: 0,
        numLines: 1,
      }

      readable.on("error", (err) => {
        reject(err)
      })
      let writable = concat((fileContents) => {
        info.fileContents = fileContents
        let i = 0
        while (i < fileContents.length) {
          const c = fileContents[i]

          if (c == "\r") {
            if (i < fileContents.length - 1 && fileContents[i + 1] == "\n") {
              info.numCRLF += 1
              i += 1
            } else {
              info.numCR += 1
            }

            info.numLines += 1
          } else if (c == "\n") {
            info.numLF += 1
            info.numLines += 1
          }
          i += 1
        }

        info.numEndings =
          (info.numCR > 0 ? 1 : 0) +
          (info.numLF > 0 ? 1 : 0) +
          (info.numCRLF > 0 ? 1 : 0)
        resolve(info)
      })
      readable.pipe(writable)
    })
  }

  async writeNewFile(info) {
    return new Promise((resolve, reject) => {
      const newlineChars =
        this.args["new-eol"] === "cr"
          ? "\r"
          : this.args["new-eol"] === "lf"
          ? "\n"
          : "\r\n"

      let writable = null

      if (!this.args["output-file"]) {
        writable = new stream.PassThrough()
        writable.pipe(process.stdout)
      } else {
        writable = fs.createWriteStream(this.args["output-file"], {
          flags: "w",
          encoding: "utf8",
        })
      }

      writable.on("finish", () => {
        resolve()
      })
      writable.on("error", (err) => {
        reject()
      })

      let newNumLines = 1
      let i = 0
      while (i < info.fileContents.length) {
        const c = info.fileContents[i]

        if (c === "\r") {
          if (
            i < info.fileContents.length - 1 &&
            info.fileContents[i + 1] == "\n"
          ) {
            i += 1
          }

          newNumLines += 1
          writable.write(newlineChars)
        } else if (c === "\n") {
          newNumLines += 1
          writable.write(newlineChars)
        } else {
          writable.write(c)
        }

        i += 1
      }
      info.newNumLines = newNumLines
      writable.end()
    })
  }

  async run(argv) {
    const options = {
      string: ["new-eol", "output-file"],
      boolean: ["help", "version"],
      alias: {
        o: "output-file",
        n: "new-eol",
      },
    }
    let args = parseArgs(argv, options)

    if (args.version) {
      this.log.info(fullVersion)
      return 0
    }

    if (args.help) {
      this.log.info(`
End of line normalizer.

ender [<options>] <file>

<file>                    The input file. Defaults to STDIN.
-o, --output-file <file>  The output file. Can be the same as the input file. Defaults to STDOUT.
-n, --new-eol <ending>    The new EOL, either 'auto', 'cr', 'lf', 'crlf'.  'auto' will use the most
                          commonly occurring ending in the input file. Default is to just report endings.
--help                    Displays help
--version                 Displays version
`)
      return 0
    }

    args["input-file"] = args["_"].length > 0 ? args["_"][0] : null
    this.args = args

    if (args["input-file"] && !fs.existsSync(args["input-file"])) {
      this.log.error(`File '${args["input-file"]}' does not exist`)
      return -1
    }

    const eolList = ["cr", "lf", "crlf", "auto"]
    if (args["new-eol"] && !eolList.includes(args["new-eol"])) {
      this.log.error(`New EOL must be one of ${eolList.join(", ")}`)
      return -1
    }

    let info = await this.readEolInfo()
    let msg =
      `'${args["input-file"] || "<STDIN>"}', ` +
      `${
        info.numEndings > 1
          ? "mixed"
          : info.numCR > 0
          ? "cr"
          : info.numLF > 0
          ? "lf"
          : "crlf"
      }, ` +
      `${info.numLines} lines`

    if (args["new-eol"]) {
      if (args["new-eol"] === "auto") {
        // Find the most common line ending && make that the automatic line ending
        this.args["new-eol"] = "lf"
        let n = info.numLF

        if (info.numCRLF > n) {
          args["new-eol"] = "crlf"
          n = info.numCRLF
        }

        if (info.numCR > n) {
          args["new-eol"] = "cr"
        }
      }

      await this.writeNewFile(info)

      msg += ` -> '${args["output-file"] || "<STDOUT>"}', ${
        this.args["new-eol"]
      }, ${info.newNumLines} lines`
    }

    this.log.info(msg)
    return 0
  }
}
