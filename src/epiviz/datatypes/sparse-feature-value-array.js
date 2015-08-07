/**
 * Created by Florin Chelaru ( florin [dot] chelaru [at] gmail [dot] com )
 * Date: 8/6/2015
 * Time: 1:55 PM
 */

goog.provide('epiviz.datatypes.SparseFeatureValueArray');

/**
 * @param {epiviz.measurements.Measurement} measurement
 * @param {epiviz.datatypes.GenomicRange} boundaries
 * @param {number} globalStartIndex
 * @param {Array.<number>|Object.<string, Array.<*>>} values
 * @param {number} [size]
 * @param {Object.<number, number>} [indexMap]
 * @param {number} [defaultValue]
 * @constructor
 * @extends {epiviz.datatypes.SparseGenomicArray}
 */
epiviz.datatypes.SparseFeatureValueArray = function(measurement, boundaries, globalStartIndex, values, size, indexMap, defaultValue) {
  var vals = null;
  var valuesAnnotation = null;
  if (!values || $.isArray(values)) {
    vals = values;
    valuesAnnotation = {values: values};
  } else {
    vals = values.values;
    valuesAnnotation = values;
  }

  epiviz.datatypes.SparseGenomicArray.call(this, measurement, boundaries, globalStartIndex, vals, size, indexMap);

  /**
   * @type {Object.<string, Array.<*>>}
   * @private
   */
  this._valuesAnnotation = valuesAnnotation;

  /**
   * @type {number}
   * @private
   */
  this._defaultValue = defaultValue || 0;
};

/**
 * Copy methods from upper class
 */
epiviz.datatypes.SparseFeatureValueArray.prototype = epiviz.utils.mapCopy(epiviz.datatypes.SparseGenomicArray.prototype);
epiviz.datatypes.SparseFeatureValueArray.constructor = epiviz.datatypes.SparseFeatureValueArray;

/**
 * @param {epiviz.measurements.Measurement} measurement
 * @param {epiviz.datatypes.GenomicRange} boundaries
 * @param {number} globalStartIndex
 * @param {Array.<number>} values
 * @param {number} [size]
 * @param {Object.<number, number>} [indexMap]
 * @returns {epiviz.datatypes.SparseGenomicArray}
 * @override
 */
epiviz.datatypes.SparseFeatureValueArray.prototype.createNew = function(measurement, boundaries, globalStartIndex, values, size, indexMap) {
  return new epiviz.datatypes.SparseFeatureValueArray(measurement, boundaries, globalStartIndex, values, size, indexMap, this._defaultValue);
};

/**
 * @param {number} index
 * @returns {number}
 * @override
 */
epiviz.datatypes.SparseFeatureValueArray.prototype.get = function(index) {
  if (index < 0 || index >= this._size) { return undefined; }
  var i = this.calcRealIndex(index);
  if (Math.abs(i) >= this.realSize()) { return undefined; }
  if (i < 0) { return this._defaultValue; }
  return this._values[i];
};

/**
 * @param index
 * @returns {?Object.<string, *>}
 */
epiviz.datatypes.SparseFeatureValueArray.prototype.getAnnotation = function(index) {
  if (index < 0 || index >= this._size) { return undefined; }
  var i = this.calcRealIndex(index);
  if (Math.abs(i) >= this.realSize()) { return undefined; }
  if (i < 0) { return null; }

  var ret = {};
  for (var col in this._valuesAnnotation) {
    if (!this._valuesAnnotation.hasOwnProperty(col)) { continue; }
    ret[col] = this._valuesAnnotation[col][i];
  }
  return ret;
};

/**
 * @param {epiviz.datatypes.SparseFeatureValueArray} second
 * @param {number} secondIndex
 * @returns {Array.<number>|Object.<string, *>}
 */
epiviz.datatypes.SparseFeatureValueArray.prototype.concatValues = function(second, secondIndex) {
  if (!second || !second.size()) { return this._valuesAnnotation; }
  if (!this._valuesAnnotation || !this._valuesAnnotation.values) {
    this._valuesAnnotation = {values:[]};
  }

  var realSecondIndex = Math.abs(second.calcRealIndex(secondIndex));

  var ret = {};
  for (var key in this._valuesAnnotation) {
    if (!this._valuesAnnotation.hasOwnProperty(key)) { continue; }
    if (!second._valuesAnnotation.hasOwnProperty(key)) { continue; }
    ret[key] = this._valuesAnnotation[key].concat(second._valuesAnnotation[key].slice(realSecondIndex));
  }
  return ret;
};

/**
 * @param {epiviz.datatypes.GenomicRange} range
 * @param {number} globalStartIndex
 * @param {number} length
 * @returns {epiviz.datatypes.SparseFeatureValueArray}
 */
epiviz.datatypes.SparseFeatureValueArray.prototype.trim = function(range, globalStartIndex, length) {
  if (this.globalStartIndex() == undefined || !this.size() ||
    globalStartIndex == undefined || !range ||
    !this.boundaries() || this.boundaries().seqName() != range.seqName()) {
    return null;
  }

  var start = Math.max(this.boundaries().start(), range.start());
  var end = Math.min(this.boundaries().end(), range.end());
  if (end <= start) { return null; }
  range = epiviz.datatypes.GenomicRange.fromStartEnd(range.seqName(), start, end);

  var startIndex = Math.max(globalStartIndex, this.globalStartIndex()) - this.globalStartIndex();
  var endIndex = Math.min(globalStartIndex + length, this.globalStartIndex() + this.size()) - this.globalStartIndex();
  if (endIndex <= startIndex) { return null; }

  var realStartIndex = Math.abs(this.calcRealIndex(startIndex));
  var realEndIndex = Math.abs(this.calcRealIndex(endIndex));

  /** @type {Object.<string, Array.<*>>} */
  var values = {};
  for (var key in this._valuesAnnotation) {
    if (!this._valuesAnnotation.hasOwnProperty(key)) { continue; }
    values[key] = this._valuesAnnotation[key].slice(realStartIndex, realEndIndex);
  }

  var indexMap = {};
  var i = 0;
  for (var index in this._indexMap) {
    if (!this._indexMap.hasOwnProperty(index)) { continue; }
    if (index < startIndex) { continue; }
    if (index >= endIndex) { break; }

    indexMap[index - startIndex] = i++;
  }
  return new epiviz.datatypes.SparseFeatureValueArray(this.measurement(), range, startIndex + this.globalStartIndex(), values, endIndex - startIndex, indexMap, this._defaultValue);
};

/**
 * @returns {string}
 */
epiviz.datatypes.SparseFeatureValueArray.prototype.toString = function() {
  var c, s, e;
  if (this.boundaries()) {
    c = this.boundaries().seqName();
    s = this.boundaries().start();
    e = this.boundaries().end();
  } else {
    c = s = e = '*';
  }
  var header = sprintf('%25s', this.measurement().name().substr(0, 22)) + sprintf(' [%6s%10s%10s]', c, s, e);
  var idx = sprintf('%10s:', 'idx');
  var val = sprintf('%10s:', 'val');

  if (this.globalStartIndex() != undefined) {
    for (var globalIndex = this.globalStartIndex(); globalIndex < this.globalStartIndex() + this.size(); ++globalIndex) {
      /** @type {number} */
      var v = this.getByGlobalIndex(globalIndex);
      idx += sprintf('%10s', globalIndex);
      val += sprintf('%10s', v);
    }
  }

  return [header, idx, val].join('\n');
};
