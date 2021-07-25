import {lockSync} from 'proper-lockfile'

import FsSetAbstract from './abstract'


export default class FsSet extends FsSetAbstract
{
  //
  // Public API
  //

  lock(func, ...rest)
  {
    if(this._closed) throw new SyntaxError('closed')

    const release = this.#locks
      ? null
      : lockSync(this._filePath, this._lockfile)

    this.#locks++

    try {
      return func(...rest)
    } finally {
      this.#locks--

      release?.()
    }
  }


  //
  // Private API
  //

  #locks = 0
}
