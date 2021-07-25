import {file} from 'tempy'

import FsSetAbstract from "../lib/abstract";


test('abstract class', function()
{
  function func() {
    new FsSetAbstract(file())
  }

  expect(func).toThrowErrorMatchingInlineSnapshot(
    `"\`FsSetAbstract\` is an abstract class"`
  )
})
