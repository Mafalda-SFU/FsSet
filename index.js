const {lockSync} = require('proper-lockfile')

const FsSetAbstract = require('./abstract.js')


module.exports = class FsSet extends FsSetAbstract
{
  //
  // Public API
  //

  lock(func, ...rest)
  {
    const release = this.#locks
      ? null
      : lockSync(this._filePath, this._lockfile)

    this.#locks++

    try {
      if(this.closed) throw new SyntaxError('closed')

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
