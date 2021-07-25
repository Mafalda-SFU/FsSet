import {file} from 'tempy'

import FsSetWaiting from "../lib/waiting";


test('lock', function()
{
  const set = new FsSetWaiting(file(), {eol: null})

  const promise = set.lock(function()
  {
    set.add('foo')
  })

  return expect(promise).resolves.toMatchInlineSnapshot(`undefined`);
});

test('closed', function()
{
  const set = new FsSetWaiting(file(), {eol: null})

  set.close()

  const promise = set.lock(function(){})

  return expect(promise).rejects.toMatchInlineSnapshot(`[SyntaxError: closed]`);
});
