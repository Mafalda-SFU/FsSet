const {file} = require('tempy')

const FsSetAsync = require("../async");


test('lock', function()
{
  const set = new FsSetAsync(file(), {eol: null})

  const promise = set.lock(function()
  {
    set.add('foo')
  })

  return expect(promise).resolves.toMatchInlineSnapshot(`undefined`);
});

test('closed', function()
{
  const set = new FsSetAsync(file(), {eol: null})

  set.close()

  const promise = set.lock(function(){})

  return expect(promise).rejects.toMatchInlineSnapshot(`[SyntaxError: closed]`);
});
