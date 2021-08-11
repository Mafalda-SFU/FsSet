const {promisify} = require('util')

const {constants: {F_SETLKW, F_UNLCK, F_WRLCK}, fcntl} = require('fs-ext')

const FsSetAbstract = require('./abstract.js')


const promisedFcntl = promisify(fcntl)


module.exports = class FsSetWaiting extends FsSetAbstract
{
  //
  // Public API
  //

  async lock(func, ...rest)
  {
    if(!this.#locks)
      try {
        await promisedFcntl(this._fd, F_SETLKW, F_WRLCK)
      } catch (error) {
        // Probably only case is `EINTR`: command was interrupted by a signal
        if(error.code !== 'EBADF') throw error

        throw new SyntaxError('closed')
      }

    this.#locks++

    try {
      return await func(...rest)
    } finally {
      if(!--this.#locks) await promisedFcntl(this._fd, F_SETLKW, F_UNLCK)
    }
  }


  //
  // Private API
  //

  #locks = 0
}
