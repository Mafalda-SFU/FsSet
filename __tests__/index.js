import {temporaryFile} from 'tempy'

import FsSet from "@mafalda/fsset"


test('exports', function()
{
  expect(FsSet).toMatchInlineSnapshot(`[Function]`);
});

test('no arguments', function()
{
  function func()
  {
    new FsSet
  }

  expect(func).toThrowErrorMatchingInlineSnapshot(
    `"The "path" argument must be of type string or an instance of Buffer or URL. Received undefined"`
  )
});

test('arguments', function()
{
  const options =
  {
    cleanAfterRead(){
      return true
    }
  }

  const set = new FsSet(temporaryFile(), options)

  expect(set).toMatchObject({
    _filePath: expect.any(String),
    _lockfile: undefined,
    closed: expect.any(Boolean)
  });
  expect(set).toHaveLength(0);
});

test('lifecycle', function()
{
  const set = new FsSet(temporaryFile())

  let result

  expect(set).toHaveLength(0);

  set.add('foo')
  expect(set).toHaveLength(1);

  set.add('bar')
  expect(set).toHaveLength(2);

  result = set.delete('foo')
  expect(result).toBe(true);
  expect(set).toHaveLength(1);

  const hasFoo = set.has('foo')
  expect(hasFoo).toBe(false);

  const hasBar = set.has('bar')
  expect(hasBar).toBe(true);

  set.clear()
  expect(set).toHaveLength(0);

  result = set.delete('foo')
  expect(result).toBe(false);

  set.close()
  set.close() // Idempotent

  function func()
  {
    result = set.lock()
  }

  expect(func).toThrowErrorMatchingInlineSnapshot(`"closed"`)

  expect(result).toBe(false)
});

test('lock', function()
{
  const set = new FsSet(temporaryFile(), {eol: null})

  const promise = set.lock(function()
  {
    set.add('foo')
  })

  return expect(promise).toMatchInlineSnapshot(`undefined`);
});
