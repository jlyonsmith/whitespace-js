import { Spacer } from './Spacer'

test('test help', (done) => {
  const tool = new Spacer({
    info: jest.fn(),
    log: jest.fn()
  })
  return tool.run(['--help']).then(exitCode => {
    expect(exitCode).toBe(0)
    done()
  })
})
