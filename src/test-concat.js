var fs = require('fs')
var concat = require('concat-stream')

var readStream = fs.createReadStream('src/spacer.js', { encoding: 'utf8' })
var concatStream = concat(gotPicture)

readStream.on('error', handleError)
readStream.pipe(concatStream)

function gotPicture(s) {
  console.log(s)
}

function handleError(err) {
  // handle your error appropriately here, e.g.:
  console.error(err) // print the error to STDERR
  process.exit(1) // exit program with non-zero exit code
}
