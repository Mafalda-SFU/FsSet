import {temporaryFile} from 'tempy'

import FsSetAsync from "@mafalda-sfu/fsset/async"


test('lock', function()
{
  const set = new FsSetAsync(temporaryFile(), {eol: null})

  const promise = set.lock(function()
  {
    set.add('foo')
  })

  return expect(promise).resolves.toMatchInlineSnapshot(`undefined`);
});

test('closed', function()
{
  const set = new FsSetAsync(temporaryFile(), {eol: null})

  set.close()

  const promise = set.lock(function(){})

  return expect(promise).rejects.toMatchInlineSnapshot(`[SyntaxError: closed]`);
});
