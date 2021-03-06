const {lock} = require('proper-lockfile')

const FsSetAbstract = require('./abstract.js')


module.exports = class FsSetAsync extends FsSetAbstract
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
