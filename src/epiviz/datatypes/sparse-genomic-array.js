/**
 * Created by Florin Chelaru ( florin [dot] chelaru [at] gmail [dot] com )
 * Date: 8/6/2015
 * Time: 10:11 AM
 */

goog.provide('epiviz.datatypes.SparseGenomicArray');

/**
 * @param {epiviz.measurements.Measurement} measurement
 * @param {epiviz.datatypes.GenomicRange} boundaries
 * @param {number} globalStartIndex
 * @param {*} values
 * @param {number} [size]
 * @param {Object.<number, number>} [indexMap]
 * @constructor
 */
epiviz.datatypes.SparseGenomicArray = function(measurement, boundaries, globalStartIndex, values, size, indexMap) {
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

  /**
   * @type {number}
   * @protected
   */
  this._size = size;

  /**
   * @type {Object.<number, number>}
   * @protected
   */
  this._indexMap = indexMap;
};

/**
 * @returns {epiviz.datatypes.GenomicRange}
 */
epiviz.datatypes.SparseGenomicArray.prototype.boundaries = function() { return this._boundaries; };

/**
 * @returns {?number}
 */
epiviz.datatypes.SparseGenomicArray.prototype.globalStartIndex = function() {
  return this._globalStartIndex;
};

/**
 * @returns {epiviz.measurements.Measurement}
 */
epiviz.datatypes.SparseGenomicArray.prototype.measurement = function() {
  return this._measurement;
};

/**
 * @param {number} index
 * @returns {*}
 */
epiviz.datatypes.SparseGenomicArray.prototype.get = function(index) { throw Error('unimplemented abstract method'); };

/**
 * @returns {number}
 */
epiviz.datatypes.SparseGenomicArray.prototype.size = function() { return this._size || 0; };

/**
 * @param {number} globalIndex
 * @returns {*}
 */
epiviz.datatypes.SparseGenomicArray.prototype.getByGlobalIndex = function(globalIndex) {
  return this.get(globalIndex - this._globalStartIndex);
};

/**
 * @param {number} index
 * @returns {number}
 */
epiviz.datatypes.SparseGenomicArray.prototype.calcRealIndex = function(index) {
  if (index < 0 || index >= this._size) { return index; }
  if (!this._indexMap) { return index; }
  var i = this._indexMap[index];
  if (i != undefined) { return i; }
  for (; index < this._size; ++index) {
    i = this._indexMap[index];
    if (i != undefined) { return -i; }
  }
  return -this.realSize();
};

/**
 * @returns {number}
 * @abstract
 */
epiviz.datatypes.SparseGenomicArray.prototype.realSize = function() { throw Error('unimplemented abstract method'); };

/**
 * @param {epiviz.datatypes.SparseGenomicArray} second
 * @param {number} secondIndex
 * @returns {*}
 * @abstract
 */
epiviz.datatypes.SparseGenomicArray.prototype.concatValues = function(second, secondIndex) { throw Error('unimplemented abstract method'); };

/**
 * Factory method
 * @param {epiviz.measurements.Measurement} measurement
 * @param {epiviz.datatypes.GenomicRange} boundaries
 * @param {number} globalStartIndex
 * @param {*} values
 * @param {number} [size]
 * @param {Object.<number, number>} [indexMap]
 * @returns {epiviz.datatypes.SparseGenomicArray}
 */
epiviz.datatypes.SparseGenomicArray.prototype.createNew = function(measurement, boundaries, globalStartIndex, values, size, indexMap) { throw Error('unimplemented abstract method'); };

/**
 * Merges two genomic arrays together by global index, eliminating common rows (where indices match)
 * IMPORTANT: This method fails if the given arrays are not overlapping or in continuation of one another
 * @param {epiviz.datatypes.SparseGenomicArray} arr
 * @returns {epiviz.datatypes.SparseGenomicArray}
 */
epiviz.datatypes.SparseGenomicArray.prototype.merge = function(arr) {
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
    values = first.concatValues(second, secondIndex),
    size = first.size() + second.size() - secondIndex;

  var indexMap = undefined;
  if (first._indexMap != undefined || second._indexMap != undefined) {
    var firstEnd;
    if (first._indexMap) {
      //indexMap = epiviz.utils.mapCopy(first._indexMap);
      indexMap = {};
      for (var index in first._indexMap) {
        if (!first._indexMap.hasOwnProperty(index)) { continue; }
        indexMap[index] = first._indexMap[index];
        firstEnd = indexMap[index];
      }
    } else {
      indexMap = {};
      for (var i = 0; i < first.size(); ++i) {
        indexMap[i] = i;
      }
    }

    if (second._indexMap) {
      var secondStart;
      for (var index in second._indexMap) {
        if (!second._indexMap.hasOwnProperty(index)) { continue; }
        if (index < secondIndex) { continue; }
        if (secondStart == undefined) { secondStart = second._indexMap[index]; }
        indexMap[index - secondIndex + first.size()] = second._indexMap[index] - secondStart + firstEnd;
      }
    } else {
      for (var i = 0; i < second.size(); ++i) {
        if (i < secondIndex) { continue; }
        indexMap[i - secondIndex + first.size()] = i - secondIndex + firstEnd;
      }
    }
  }

  return this.createNew(measurement, boundaries, globalStartIndex, values, size, indexMap);
};
