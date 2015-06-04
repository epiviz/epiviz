/**
 * Created by Florin Chelaru ( florinc [at] umd [dot] edu )
 * Date: 10/10/13
 * Time: 10:03 AM
 */

goog.provide('epiviz.datatypes.deprecated.SeqInfo');

/**
 *
 * @param {Array.<string>} levels A reference to an array shared across all chromosomes
 * @param {number} index
 * @constructor
 * @deprecated
 */
epiviz.datatypes.deprecated.SeqInfo = function(levels, index) {
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
 * @returns {epiviz.datatypes.deprecated.SeqInfo}
 */
epiviz.datatypes.deprecated.SeqInfo.fromName = function(name) {
  return new epiviz.datatypes.deprecated.SeqInfo([name], 0);
};

/**
 * @returns {string}
 */
epiviz.datatypes.deprecated.SeqInfo.prototype.name = function() {
  return this._levels[this._index];
};

/**
 * @returns {number}
 */
epiviz.datatypes.deprecated.SeqInfo.prototype.index = function() {
  return this._index;
};

/**
 * @returns {Array.<string>}
 */
epiviz.datatypes.deprecated.SeqInfo.prototype.levels = function() {
  return this._levels;
};
