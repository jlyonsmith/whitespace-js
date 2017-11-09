import { Ender } from './Ender'
import tempy from 'tempy'
import fs from 'fs'
import util from 'util'

const writeFileAsync = util.promisify(fs.writeFile)
const readFileAsync = util.promisify(fs.readFile)

function getMockLog() {
  return {
    info: jest.fn(),
    log: jest.fn(),
    error: jest.fn()
  }
}

function getOutput(fn) {
  const calls = fn.mock.calls
  if (calls.length > 0 && calls[0].length > 0) {
    return calls[0][0]
  } else {
    return ''
  }
}

test('test help', done => {
  const mockLog = getMockLog()
  const tool = new Ender(mockLog)

  return tool.run(['--help']).then(exitCode => {
    expect(exitCode).toBe(0)
    expect(getOutput(mockLog.info)).toEqual(expect.stringContaining('--help'))
    done()
  })
})

const testGetInfo = (def) => async (done) => {
  const mockLog = getMockLog()
  const tool = new Ender(mockLog)
  const inFile = tempy.file()

  await writeFileAsync(inFile, def.in)
  let exitCode = await tool.run([inFile])
  expect(exitCode).toBe(0)
  expect(getOutput(mockLog.info)).toMatch(def.info)
  done()
}

const toHexArray = (s) => (Array(s.length).fill().map((_, i) => s.charCodeAt(i).toString(16).padStart(2, '0')).join(' '))

const testConvert = (def) => async (done) => {
  const mockLog = getMockLog()
  const tool = new Ender(mockLog)
  const inFile = tempy.file()
  const outFile = tempy.file()

  await writeFileAsync(inFile, def.in)
  let exitCode = await tool.run([inFile, '-o', outFile, '-n', def.newEol])
  expect(exitCode).toBe(0)
  expect(getOutput(mockLog.info)).toMatch(def.info)
  const content = await readFileAsync(outFile, { encoding: 'utf8' })
  expect(toHexArray(content)).toBe(toHexArray(def.out))
  done()
}

test('lf info', testGetInfo({ in: '\r', info: /cr, 2 lines/ }))
test('crlf info', testGetInfo({ in: '\r\n', info: /crlf, 2 lines/ }))
test('mixed1 info', testGetInfo({ in: '\n\r\n\r', info: /mixed, 4 lines/ }))
test('mixed2 info', testGetInfo({ in: '\n\n\r\n\r', info: /mixed, 5 lines/ }))
test('mixed3 info', testGetInfo({ in: '\n\r\n\r\r', info: /mixed, 5 lines/ }))
test('mixed4 info', testGetInfo({ in: '\n\r\n\r\r\n', info: /mixed, 5 lines/ }))

test('cr to lf', testConvert({ in: '\r', newEol: 'lf', out: '\n', info: /cr, 2 lines.*lf, 2 lines/ }))
test('lf to cr', testConvert({ in: '\n', newEol: 'cr', out: '\r', info: /lf, 2 lines.*cr, 2 lines/ }))
test('crlf to lf', testConvert({ in: '\r\n', newEol: 'lf', out: '\n', info: /crlf, 2 lines.*lf, 2 lines/ }))
test('crlf to lf', testConvert({ in: '\r\n', newEol: 'lf', out: '\n', info: /crlf, 2 lines.*lf, 2 lines/ }))
test('crlf to cr', testConvert({ in: '\r\n', newEol: 'cr', out: '\r', info: /crlf, 2 lines.*cr, 2 lines/ }))
test('mixed1 to auto', testConvert({ in: '\n\r\n\r', newEol: 'auto', out: '\n\n\n', info: /mixed, 4 lines.*lf, 4 lines/ }))
test('mixed2 to auto', testConvert({ in: '\n\n\r\n\r', newEol: 'auto', out: '\n\n\n\n', info: /mixed, 5 lines.*lf, 5 lines/ }))
test('mixed3 to auto', testConvert({ in: '\n\r\n\r\r', newEol: 'auto', out: '\r\r\r\r', info: /mixed, 5 lines.*cr, 5 lines/ }))
test('mixed4 to auto', testConvert({ in: '\n\r\n\r\r\n', newEol: 'auto', out: '\r\n\r\n\r\n\r\n', info: /mixed, 5 lines.*crlf, 5 lines/ }))
