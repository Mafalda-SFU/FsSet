const {file} = require('tempy')

const FsSetAbstract = require("../abstract");


test('abstract class', function()
{
  function func() {
    new FsSetAbstract(file())
  }

  expect(func).toThrowErrorMatchingInlineSnapshot(
    `"\`FsSetAbstract\` is an abstract class"`
  )
})
