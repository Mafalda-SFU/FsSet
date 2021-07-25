import {lock} from 'proper-lockfile'

import FsSetAbstract from './abstract'


export default class FsSetAsync extends FsSetAbstract
{
  //
  // Public API
  //

  async lock(func, ...rest)
  {
    if(this._closed) throw new SyntaxError('closed')

    const release = this.#locks
      ? null
      : await lock(this._filePath, this._lockfile)

    this.#locks++

    try {
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
