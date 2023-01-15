import {temporaryFile} from 'tempy'

import FsSetAbstract from "../abstract"


test('abstract class', function()
{
  function func() {
    new FsSetAbstract(temporaryFile())
  }

  expect(func).toThrowErrorMatchingInlineSnapshot(
    `"\`FsSetAbstract\` is an abstract class"`
  )
})
