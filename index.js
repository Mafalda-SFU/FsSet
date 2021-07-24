import {
  closeSync, ftruncateSync, openSync, readSync, writeSync
} from 'fs'

import {lock, lockSync} from 'proper-lockfile'


const DEFAULT_BUFFER_SIZE = 16384  // 16KB, Node.js default


function filterEmpty(line)
{
  return line?.length
}


export default class FsSet
{
  constructor(
    filePath,
    {
      bufferSize = DEFAULT_BUFFER_SIZE,
      cleanAfterRead,
      lockfile
    } = {bufferSize: DEFAULT_BUFFER_SIZE}
  ){
    try {
      this.#fd = openSync(filePath, 'r+')
    } catch (error) {
      if(error.code !== 'ENOENT') throw error

      this.#fd = openSync(filePath, 'w+')
    }

    this.#buffer          = Buffer.alloc(bufferSize)
    this.#filePath        = filePath
    this.#cleanAfterRead  = cleanAfterRead
    this.#lockfileOptions = lockfile
  }


  //
  // Set
  //

  get length()
  {
    return this.#lock(this.#read).length
  }


  add(value)
  {
    return this.#lock(this.#add, value)
  }

  clear()
  {
    return this.#lock(this.#write)
  }

  delete(value)
  {
    return this.#lock(this.#delete, value)
  }

  has(value)
  {
    return this.#lock(this.#read).includes(value)
  }


  //
  // Public API
  //

  close()
  {
    if(this.#closed) return

    this.#closed = true

    closeSync(this.#fd)
  }

  async lock(func, ...rest)
  {
    if(this.#closed) throw new SyntaxError('closed')

    const release = !this.#locks
      && await lock(this.#filePath, this.#lockfileOptions)

    this.#locks++

    try {
      return await func(...rest)
    } finally {
      this.#locks--

      release?.()
    }
  }


  //
  // Private API
  //

  #buffer
  #closed
  #fd
  #cleanAfterRead
  #filePath
  #lockfileOptions
  #locks = 0

  #add = value =>
  {
    const values = this.#read()

    values.push(value)

    this.#write(values)
  }

  #delete = value =>
  {
    const values = this.#read()

    const index = values.indexOf(value)
    if(index < 0) return false

    values.splice(index, 1)

    this.#write(values)

    return true
  }

  #lock(func, ...rest)
  {
    if(this.#closed) throw new SyntaxError('closed')

    const release = !this.#locks
      && lockSync(this.#filePath, this.#lockfileOptions)

    try {
      return func(...rest)
    } finally {
      release?.()
    }
  }

  /**
   * Read values file and remove non-existing processes from PIDs file
   *
   * @memberof FsSet
   */
  #read = () =>
  {
    const buffer = this.#buffer

    const length = readSync(this.#fd, buffer, 0, buffer.length, 0)

    let result = buffer.toString('utf8', 0, length)
    .split(`\0`)
    .filter(filterEmpty)

    if(this.#cleanAfterRead)
      result = result.filter(this.#cleanAfterRead)

    return result
  }

  #write = data =>
  {
    ftruncateSync(this.#fd)
    writeSync(this.#fd, data?.join(`\0`) || '', 0)
  }
}
