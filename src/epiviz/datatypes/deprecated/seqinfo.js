/**
 * Created by Florin Chelaru ( florinc [at] umd [dot] edu )
 * Date: 10/10/13
 * Time: 10:03 AM
 */

goog.provide('epiviz.datatypes.SeqInfo');

/**
 *
 * @param {Array.<string>} levels A reference to an array shared across all chromosomes
 * @param {number} index
 * @constructor
 */
epiviz.datatypes.SeqInfo = function(levels, index) {
  /**
   * @type {Array.<string>}
   * @private
   */
  this._levels = levels;

  /**
   * @type {number}
   * @private
   */
  this._index = index;
};

/**
 * @param {string} name
 * @returns {epiviz.datatypes.SeqInfo}
 */
epiviz.datatypes.SeqInfo.fromName = function(name) {
  return new epiviz.datatypes.SeqInfo([name], 0);
};

/**
 * @returns {string}
 */
epiviz.datatypes.SeqInfo.prototype.name = function() {
  return this._levels[this._index];
};

/**
 * @returns {number}
 */
epiviz.datatypes.SeqInfo.prototype.index = function() {
  return this._index;
};

/**
 * @returns {Array.<string>}
 */
epiviz.datatypes.SeqInfo.prototype.levels = function() {
  return this._levels;
};
