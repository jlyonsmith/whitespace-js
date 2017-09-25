import Ender from './Ender'

test('test help', () => {
  exec(`${distDir}/ender --help`, (error, stdout, stderr) => {
    if (error) {
      console.error(`exec error: ${error}`)
    }
    console.log(`stdout: ${stdout}`)
    console.log(`stderr: ${stderr}`)
  })
})
