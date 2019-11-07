import { SpacerTool } from "./SpacerTool"
import tempy from "tempy"
import fs from "fs"
import util from "util"

const writeFileAsync = util.promisify(fs.writeFile)
const readFileAsync = util.promisify(fs.readFile)

function getMockLog() {
  return {
    info: jest.fn(),
    log: jest.fn(),
    error: jest.fn(),
  }
}

function getOutput(fn) {
  const calls = fn.mock.calls
  if (calls.length > 0 && calls[0].length > 0) {
    return calls[0][0]
  } else {
    return ""
  }
}

test("test help", async (done) => {
  const mockLog = getMockLog()
  const tool = new SpacerTool(mockLog)

  const exitCode = await tool.run(["--help"])
  expect(exitCode).toBe(0)
  expect(getOutput(mockLog.info)).toEqual(expect.stringContaining("--help"))
  done()
})

const testGetInfo = (def) => async (done) => {
  const mockLog = getMockLog()
  const tool = new SpacerTool(mockLog)
  const inFile = tempy.file()

  await writeFileAsync(inFile, def.in)
  let exitCode = await tool.run([inFile])
  expect(exitCode).toBe(0)
  expect(getOutput(mockLog.info)).toMatch(def.info)
  done()
}

const space1 =
  "    \n" +
  "    a\n" +
  "\n" +
  "\tb\n" +
  ' \t   c = @"1"; c1 = @"2"\n' +
  "  d; d1\t; d2\n" +
  "\t  e\n" +
  '\t@"123"\n' +
  '    @"1\n' +
  "\t1\n" +
  '    2"\n' +
  "f\n" +
  "\n" +
  '    " @"\n' +
  "\tg\n" +
  "\n"

const space1_spaces =
  "\n" +
  "    a\n" +
  "\n" +
  "  b\n" +
  '     c = @"1"; c1 = @"2"\n' +
  "  d; d1	; d2\n" +
  "    e\n" +
  '  @"123"\n' +
  '    @"1\n' +
  "  1\n" +
  '    2"\n' +
  "f\n" +
  "\n" +
  '    " @"\n' +
  "  g\n" +
  "\n"

const space2 =
  "a:\n" + "{\n" + "\tb: 1,\n" + "  c: 2,\n" + " \t d:\t3\n" + " }\n" + "\n"

const space2_tabs =
  "a:\n" + "{\n" + "\tb: 1,\n" + "\tc: 2,\n" + "\td:\t3\n" + "}\n" + "\n"

test("space1 info", testGetInfo({ in: space1, info: /, mixed/ }))
test("space2 info", testGetInfo({ in: space1, info: /, mixed/ }))

const toHexArray = (s) =>
  Array(s.length)
    .fill()
    .map((_, i) =>
      s
        .charCodeAt(i)
        .toString(16)
        .padStart(2, "0")
    )
    .join(" ")

const testConvert = (def) => async (done) => {
  const mockLog = getMockLog()
  const tool = new SpacerTool(mockLog)
  const inFile = tempy.file()
  const outFile = tempy.file()

  await writeFileAsync(inFile, def.in)
  const round = def.round ? ["-r"] : []
  const newBol = def.newBol ? ["-n", def.newBol] : []
  let exitCode = await tool.run([inFile, "-o", outFile, ...round, ...newBol])
  expect(exitCode).toBe(0)
  expect(getOutput(mockLog.info)).toMatch(def.info)
  const content = await readFileAsync(outFile, { encoding: "utf8" })
  expect(toHexArray(content)).toBe(toHexArray(def.out))
  done()
}

test(
  "space1 to spaces",
  testConvert({
    in: space1,
    newBol: "spaces",
    out: space1_spaces,
    info: /, mixed.*spaces/,
  })
)
test(
  "space2 to tabs",
  testConvert({
    in: space2,
    newBol: "tabs",
    round: true,
    out: space2_tabs,
    info: /, mixed.*tabs/,
  })
)
