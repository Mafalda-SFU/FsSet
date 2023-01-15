import {closeSync, ftruncateSync, openSync, readSync, writeSync} from 'fs'
import {EOL} from 'os'


const DEFAULT_BUFFER_SIZE = 16384  // 16KB, Node.js default


function filterEmpty(line)
{
  return line?.length
}

function getLength({length})
{
  return length
}

function includes(value, result)
{
  return result.includes(value)
}


export default class FsSetAbstract
{
  constructor(
    filePath,
    {
      bufferSize = DEFAULT_BUFFER_SIZE,
      cleanAfterRead,
      eol = EOL,
      lockfile
    } = {bufferSize: DEFAULT_BUFFER_SIZE, eol: EOL}
  ){
    if(this.constructor === FsSetAbstract)
      throw new Error('`FsSetAbstract` is an abstract class')

    try
    {
      this._fd = openSync(filePath, 'r+')
    }
    catch (error)
    {
      if(error.code !== 'ENOENT') throw error

      this._fd = openSync(filePath, 'w+')
    }

    if(eol === null) eol = '\0'

    this.#buffer         = Buffer.alloc(bufferSize)
    this.#cleanAfterRead = cleanAfterRead
    this.#eol            = eol

    this._filePath = filePath
    this._lockfile = lockfile
  }


  //
  // Set
  //

  get length()
  {
    const result = this.lock(this.#read)

    if(result instanceof Promise) return result.then(getLength)

    return getLength(result)
  }


  add(value)
  {
    return this.lock(this.#add, value)
  }

  clear()
  {
    return this.lock(this.#write)
  }

  delete(value)
  {
    return this.lock(this.#delete, value)
  }

  has(value)
  {
    const result = this.lock(this.#read)

    if(result instanceof Promise) return result.then(includes.bind(null, value))

    return includes(value, result)
  }


  //
  // Public API
  //

  get closed()
  {
    return this._fd === -1
  }


  close()
  {
    if(this.closed) return

    closeSync(this._fd)
    this._fd = -1
  }


  //
  // Protected API
  //

  _fd
  _filePath
  _lockfile


  //
  // Private API
  //

  #buffer
  #cleanAfterRead
  #eol


  #add = value =>
  {
    const values = this.#read()

    values.push(value)

    this.#write(values)
  }

  #delete = value =>
  {
    const values = this.#read()

    const index = values.indexOf(value.toString())
    if(index < 0) return false

    values.splice(index, 1)

    this.#write(values)

    return true
  }

  /**
   * Read values file and remove non-existing processes from PIDs file
   *
   * @memberof FsSet
   */
  #read = () =>
  {
    const buffer = this.#buffer

    const length = readSync(this._fd, buffer, 0, buffer.length, 0)

    let result = buffer.toString('utf8', 0, length)
      .split(this.#eol)
      .filter(filterEmpty)

    if(this.#cleanAfterRead)
      result = result.filter(this.#cleanAfterRead)

    return result
  }

  #write = data =>
  {
    ftruncateSync(this._fd)
    writeSync(this._fd, data?.join(this.#eol) || '', 0)
  }
}
