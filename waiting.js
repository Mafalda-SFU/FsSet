import {promisify} from 'node:util'

import {constants, fcntl} from 'fs-ext'

import FsSetAbstract from './abstract.js'

const {F_SETLKW, F_UNLCK, F_WRLCK} = constants


const promisedFcntl = promisify(fcntl)


export default class FsSetWaiting extends FsSetAbstract
{
  //
  // Public API
  //

  async lock(func, ...rest)
  {
    if(this.closed) throw new SyntaxError('closed')

    if(!this.#locks)
      try
      {
        await promisedFcntl(this._fd, F_SETLKW, F_WRLCK)
      }
      catch (error)
      {
        // Probably only case is `EINTR`: command was interrupted by a signal
        if(error.code !== 'EBADF') throw error

        throw new SyntaxError('closed')
      }

    this.#locks++

    try
    {
      return await func(...rest)
    }
    finally
    {
      if(!(--this.#locks || this.closed))
        await promisedFcntl(this._fd, F_SETLKW, F_UNLCK)
    }
  }


  //
  // Private API
  //

  #locks = 0
}
