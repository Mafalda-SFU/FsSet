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

test('lifecycle', async function()
{
  const set = new FsSetWaiting(file())

  let result

  expect(await set.length).toBe(0);

  await set.add('foo')
  expect(await set.length).toBe(1);

  await set.add('bar')
  expect(await set.length).toBe(2);

  result = await set.delete('foo')
  expect(result).toBe(true);
  expect(await set.length).toBe(1);

  const hasFoo = await set.has('foo')
  expect(hasFoo).toBe(false);

  const hasBar = await set.has('bar')
  expect(hasBar).toBe(true);

  await set.clear()
  expect(await set.length).toBe(0);

  result = await set.delete('foo')
  expect(result).toBe(false);

  set.close()
  set.close() // Idempotent

  try
  {
    result = await set.lock()
  }
  catch(error)
  {
    if(error.message !== 'closed') throw error
  }

  expect(result).toBe(false)
})
