import {lock} from 'proper-lockfile'

import FsSetAbstract from './abstract.js'


export default class FsSetAsync extends FsSetAbstract
{
  //
  // Public API
  //

  async lock(func, ...rest)
  {
    const release = this.#locks
      ? null
      : await lock(this._filePath, this._lockfile)

    this.#locks++

    try {
      if(this.closed) throw new SyntaxError('closed')

      return await func(...rest)
    } finally {
      this.#locks--

      await release?.()
    }
  }


  //
  // Private API
  //

  #locks = 0
}
