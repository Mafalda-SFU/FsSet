import {lockSync} from 'proper-lockfile'

import FsSetAbstract from './abstract.js'


export default class FsSet extends FsSetAbstract
{
  //
  // Public API
  //

  lock(func, ...rest)
  {
    if(this.closed) throw new SyntaxError('closed')

    const release = this.#locks
      ? null
      : lockSync(this._filePath, this._lockfile)

    this.#locks++

    try
    {
      if(this.closed) throw new SyntaxError('closed')

      return func(...rest)
    }
    finally
    {
      this.#locks--

      release?.()
    }
  }


  //
  // Private API
  //

  #locks = 0
}
