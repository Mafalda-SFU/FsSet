import {
  closeSync, ftruncateSync, openSync, readSync, writeSync
} from 'fs'
import {EOL} from 'os'

import {lockSync} from 'proper-lockfile'


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
      eol = EOL,
      lockfile
    } = {bufferSize: DEFAULT_BUFFER_SIZE, eol: EOL}
  ){
    try {
      this.#fd = openSync(filePath, 'r+')
    } catch (error) {
      if(error.code !== 'ENOENT') throw error

      this.#fd = openSync(filePath, 'w+')
    }

    if(eol === null) eol = '\0'

    this.#buffer          = Buffer.alloc(bufferSize)
    this.#eol             = eol
    this.#filePath        = filePath
    this.#cleanAfterRead  = cleanAfterRead
    this.#lockfileOptions = lockfile
  }


  //
  // Set
  //

  get length()
  {
    return this.#wrap(this.#read).length
  }


  add(value)
  {
    return this.#wrap(this.#add, value)
  }

  clear()
  {
    return this.#wrap(this.#write)
  }

  delete(value)
  {
    return this.#wrap(this.#delete, value)
  }

  has(value)
  {
    return this.#wrap(this.#read).includes(value)
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
    const release = this.#lock()

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
  #eol
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

    const index = values.indexOf(value.toString())
    if(index < 0) return false

    values.splice(index, 1)

    this.#write(values)

    return true
  }

  #lock()
  {
    if(this.#closed) throw new SyntaxError('closed')

    return this.#locks
      ? null
      : lockSync(this.#filePath, this.#lockfileOptions)
  }

  #wrap(func, ...rest)
  {
    const release = this.#lock()

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
    .split(this.#eol)
    .filter(filterEmpty)

    if(this.#cleanAfterRead)
      result = result.filter(this.#cleanAfterRead)

    return result
  }

  #write = data =>
  {
    ftruncateSync(this.#fd)
    writeSync(this.#fd, data?.join(this.#eol) || '', 0)
  }
}
