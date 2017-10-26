import { Ender } from './Ender'
import tmp from 'tmp'
import fs from 'fs'
import util from 'util'

let tmpDirObj = null

beforeAll(() => {
  tmpDirObj = tmp.dirSync()
})

afterAll(() => {
  if (tmpDirObj) {
    tmpDirObj.removeCallback()
  }
})

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

test('cr to cr', (done) => {
  const mockLog = getMockLog()
  const tool = new Ender(mockLog)
  const crTxt = tmpDirObj.name + '/cr.txt'
  const crTxt2 = tmpDirObj.name + '/cr2.txt'

  return util.promisify(fs.writeFile)(crTxt, '\r').then(() => {
    return tool.run(`-n cr -o ${crTxt2} ${crTxt}`.split(' '))
  }).then(exitCode => {
    expect(exitCode).toBe(0)
    expect(getOutput(mockLog.error)).toEqual(expect.stringMatching(/cr2.txt/))
    // TODO: Check number of lines and contents of file
    done()
  })
})

// def test_lf_txt
//   output = `cd #{@ender_dir}; #{@bin_dir}/ender lf.txt`
//   assert output.end_with?("\"lf.txt\", lf, 2 lines\n"), output
// end
//
// def test_crlf_txt
//   output = `cd #{@ender_dir}; #{@bin_dir}/ender crlf.txt`
//   assert output.end_with?("\"crlf.txt\", crlf, 2 lines\n"), output
// end
//
// # TODO: The rest of these...
//
// # eval $ENDER mixed1.txt
// # eval $ENDER mixed2.txt
// # eval $ENDER mixed3.txt
// # eval $ENDER mixed4.txt
// # eval $ENDER -m lf -o cr2lf.txt cr.txt
// # eval $ENDER -m cr -o lf2cr.txt lf.txt
// # eval $ENDER -m lf -o crlf2lf.txt crlf.txt
// # eval $ENDER -m cr -o crlf2cr.txt crlf.txt
// # eval $ENDER -m auto mixed1.txt
// # eval $ENDER -m auto mixed2.txt
// # eval $ENDER -m auto mixed3.txt
// # eval $ENDER -m auto mixed4.txt
