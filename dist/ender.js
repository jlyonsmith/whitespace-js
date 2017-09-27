'use strict';

Object.defineProperty(exports, "__esModule", {
  value: true
});
exports.Ender = undefined;

var _commander = require('commander');

var _commander2 = _interopRequireDefault(_commander);

var _fs = require('fs');

var _fs2 = _interopRequireDefault(_fs);

var _concatStream = require('concat-stream');

var _concatStream2 = _interopRequireDefault(_concatStream);

function _interopRequireDefault(obj) { return obj && obj.__esModule ? obj : { default: obj }; }

class Ender {
  constructor() {}

  static async readLineEndingInfo(fileName) {
    return new Promise((resolve, reject) => {
      const readable = fileName ? process.stdin : _fs2.default.createReadStream(fileName, { encoding: 'utf8' });

      // Read the entire file && determine all the different line endings
      let numCR = 0;
      let numLF = 0;
      let numCRLF = 0;
      let numLines = 1;

      readable.on('error', err => {
        reject(err);
      });
      let writeable = (0, _concatStream2.default)(fileContents => {
        let i = 0;
        while (i < fileContents.length) {
          const c = fileContents[i];

          if (c == '\r') {
            if (i < fileContents.length - 1 && fileContents[i + 1] == '\n') {
              numCRLF += 1;
              i += 1;
            } else {
              numCR += 1;
            }

            numLines += 1;
          } else if (c == '\n') {
            numLF += 1;
            numLines += 1;
          }
          i += 1;
        }

        numEndings = (numCR > 0 ? 1 : 0) + (numLF > 0 ? 1 : 0) + (numCRLF > 0 ? 1 : 0);

        resolve({ numCR, numLF, numCRLF, numLines, numEndings, fileContents });
      });
      readable.pipe(writeable);
    });
  }

  static async writeNewFile(fileName, info) {
    return new Promise((resolve, reject) => {
      let newNumLines = 1;
      let mode = _commander2.default.mode;

      if (info.newLineEnding == 'cr' && info.numCR + 1 == info.numLines || info.newLineEnding == 'lf' && info.numLF + 1 == info.numLines || info.newLineEnding == 'crlf' && info.numCRLF + 1 == info.numLines) {
        // We're not changing the line endings; nothing to do
        return resolve();
      }

      const newlineChars = info.newLineEnding == 'cr' ? '\r' : mode == 'lf' ? '\n' : '\r\n';
      const writeable = fileName ? process.stdout : _fs2.default.createWriteStream(fileName, 'w');

      writeable.on('finish', () => {
        resolve();
      });
      writeable.on('error', err => {
        reject();
      });

      let i = 0;
      while (i < info.fileContents.length) {
        const c = info.fileContents[i];

        if (c == '\r') {
          if (i < info.fileContents.length - 1 && info.fileContents[i + 1] == '\n') {
            i += 1;
          }

          newNumLines += 1;
          writeable.write(newlineChars);
        } else if (c == '\n') {
          newNumLines += 1;
          writeable.write(newlineChars);
        } else {
          writeable.write(c);
        }

        i += 1;
      }
      writeable.end();
      info.newNumLines = newNumLines;
    });
  }

  async run(log, program) {
    const inputFilename = program.args.length > 0 ? program.args[0] : null;
    const outputFilename = program.outputFile;

    if (inputFilename && !_fs2.default.existsSync(inputFilename)) {
      log.error(`File '${inputFilename}' does not exist`);
      return -1;
    }

    let info = await Ender.readLineEndingInfo(inputFilename);

    msg = `"${inputFilename}", ${info.numEndings > 1 ? 'mixed' : info.numCR > 0 ? 'cr' : info.numLF > 0 ? 'lf' : 'crlf'}, ${info.numLines} lines`;

    if (program.report) {
      log.info(msg);
      return 0;
    }

    if (program.mode == 'auto') {
      // Find the most common line ending && make that the automatic line ending
      info.newLineEnding = 'lf';
      let n = info.numLF;

      if (numCRLF > n) {
        info.newLineEnding = 'crlf';
        n = numCRLF;
      }

      if (numCR > n) {
        info.newLineEnding = 'cr';
      }
    }

    await Ender.writeNewFile(outputFilename, info);

    msg += ` -> "${outputFilename}", ${info.newLineEnding}, ${info.newNumLines} lines`;
    log.info(msg);
    return 0;
  }
}

exports.Ender = Ender;
_commander2.default.version('1.0.0').arguments('[file]').name('ender').description('Line ending fixer. Defaults to reading from stdin.').option('-o, --output-file <file>', 'The output file. Can be the same as the input file.' + ' Defaults to stdout').option('-r, --report', 'Report on the status of the file and exit.').option('-m, --mode MODE', 'The convert mode, either auto, cr, lf, crlf. auto will use the most' + ' commonly occurring ending.', /^(auto|lf|cr|crlf)$/, 'auto');

_commander2.default.parse(process.argv);
const ender = new Ender();
ender.run(console, _commander2.default);
//# sourceMappingURL=ender.js.map