import { Ender } from './ender'

test('test help', (done) => {
  const ender = new Ender({
    info: jest.fn(),
    log: jest.fn()
  })
  return ender.run(['--help']).then(exitCode => {
    expect(exitCode).toBe(0)
    done()
  })
})
