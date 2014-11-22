/**
 * Created by Florin Chelaru ( florinc [at] umd [dot] edu )
 * Date: 3/31/14
 * Time: 10:16 AM
 */

goog.provide('epiviz.utils.IterableArray');

/**
 * @param {Array.<T>} array
 * @constructor
 * @implements {epiviz.utils.Iterable.<T>}
 * @template T
 */
epiviz.utils.IterableArray = function(array) {
  /**
   * @type {Array.<T>}
   * @private
   */
  this._array = array;
};

/**
 * @param {function(T)} iteration
 */
epiviz.utils.IterableArray.prototype.foreach = function(iteration) {
  for (var i = 0; i < this._array.length; ++i) {
    if (iteration(this._array[i])) { return; }
  }
};
