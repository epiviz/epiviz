/**
 * Created by Florin Chelaru ( florinc [at] umd [dot] edu )
 * Date: 11/8/13
 * Time: 2:34 PM
 */

goog.provide('epiviz.datatypes.GenomicArray');

/**
 * @param {epiviz.measurements.Measurement} measurement
 * @param {epiviz.datatypes.GenomicRange} boundaries
 * @param {number} globalStartIndex
 * @param {*} values
 * @constructor
 */
epiviz.datatypes.GenomicArray = function(measurement, boundaries, globalStartIndex, values) {
  /**
   * @type {epiviz.measurements.Measurement}
   * @private
   */
  this._measurement = measurement;

  /**
   * @type {epiviz.datatypes.GenomicRange}
   * @private
   */
  this._boundaries = boundaries;

  /**
   * @type {?number}
   * @private
   */
  this._globalStartIndex = globalStartIndex;

  /**
   * @type {*}
   * @protected
   */
  this._values = values;
};

/**
 * @returns {epiviz.datatypes.GenomicRange}
 */
epiviz.datatypes.GenomicArray.prototype.boundaries = function() { return this._boundaries; };

/**
 * @returns {?number}
 */
epiviz.datatypes.GenomicArray.prototype.globalStartIndex = function() {
  return this._globalStartIndex;
};

/**
 * @returns {epiviz.measurements.Measurement}
 */
epiviz.datatypes.GenomicArray.prototype.measurement = function() {
  return this._measurement;
};

/**
 * @param {number} index
 * @returns {*}
 */
epiviz.datatypes.GenomicArray.prototype.get = function(index) { throw Error('unimplemented abstract method'); };

/**
 * @returns {number}
 */
epiviz.datatypes.GenomicArray.prototype.size = function() { throw Error('unimplemented abstract method'); };

/**
 * @param {number} globalIndex
 * @returns {*}
 */
epiviz.datatypes.GenomicArray.prototype.getByGlobalIndex = function(globalIndex) {
  return this.get(globalIndex - this._globalStartIndex);
};

/**
 * @param {epiviz.datatypes.GenomicArray} second
 * @param {number} secondIndex
 * @returns {*}
 */
epiviz.datatypes.GenomicArray.prototype.concatValues = function(second, secondIndex) { throw Error('unimplemented abstract method'); };

/**
 * Factory method
 * @param {epiviz.measurements.Measurement} measurement
 * @param {epiviz.datatypes.GenomicRange} boundaries
 * @param {number} globalStartIndex
 * @param {*} values
 * @returns {epiviz.datatypes.GenomicArray}
 */
epiviz.datatypes.GenomicArray.prototype.createNew = function(measurement, boundaries, globalStartIndex, values) { throw Error('unimplemented abstract method'); };

/**
 * Merges two genomic arrays together by global index, eliminating common rows (where indices match)
 * IMPORTANT: This method fails if the given arrays are not overlapping or in continuation of one another
 * @param {epiviz.datatypes.GenomicArray} arr
 * @returns {epiviz.datatypes.GenomicArray}
 */
epiviz.datatypes.GenomicArray.prototype.merge = function(arr) {
  if (!arr || arr.boundaries() == undefined) {
    return this;
  }

  if (this.boundaries().seqName() != arr.boundaries().seqName() ||
    this.boundaries().start() > arr.boundaries().end() ||
    arr.boundaries().start() > this.boundaries().end()) {
    throw Error('Two genomic arrays can only be merged if they overlap or are in continuation to one another');
  }

  var first = (this.boundaries().start() < arr.boundaries().start()) ? this : arr;
  var second = (first == this) ? arr : this;

  if (first.boundaries().end() >= second.boundaries().end()) {
    // The first array contains the given array
    return first;
  }

  // Compute the index of the first element in the second array that isn't in the first as well;
  var secondIndex = (first.globalStartIndex() != undefined && second.globalStartIndex() != undefined) ?
    first.globalStartIndex() + first.size() - second.globalStartIndex() : 0;

  var
    measurement = first.measurement(),
    globalStartIndex = (first.globalStartIndex() != undefined) ? first.globalStartIndex() : second.globalStartIndex(),
    boundaries = epiviz.datatypes.GenomicRange.fromStartEnd(
      first.boundaries().seqName(),
      first.boundaries().start(),
      second.boundaries().end()),
    values = first.concatValues(second, secondIndex);

  return this.createNew(measurement, boundaries, globalStartIndex, values);
};
