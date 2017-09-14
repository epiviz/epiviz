/**
 * Created by Florin Chelaru ( florinc [at] umd [dot] edu )
 * Date: 11/8/13
 * Time: 8:31 AM
 */

goog.provide('epiviz.datatypes.FeatureValueArray');

goog.require('epiviz.datatypes.GenomicArray');
goog.require('epiviz.datatypes.GenomicRange');
goog.require('epiviz.utils');

/**
 * @param {epiviz.measurements.Measurement} measurement
 * @param {epiviz.datatypes.GenomicRange} boundaries
 * @param {number} globalStartIndex
 * @param {Array.<number>|Object.<string, Array.<*>>} values
 * @constructor
 * @extends {epiviz.datatypes.GenomicArray}
 */
epiviz.datatypes.FeatureValueArray = function(measurement, boundaries, globalStartIndex, values) {
  var vals = null;
  var valuesAnnotation = null;
  if (!values || $.isArray(values)) {
    vals = values;
    valuesAnnotation = {values: values};
  } else {
    vals = values.values;
    valuesAnnotation = values;
  }

  epiviz.datatypes.GenomicArray.call(this, measurement, boundaries, globalStartIndex, vals);

  /**
   * @type {Object.<string, Array.<*>>}
   * @private
   */
  this._valuesAnnotation = valuesAnnotation;
};

/**
 * Copy methods from upper class
 */
epiviz.datatypes.FeatureValueArray.prototype = epiviz.utils.mapCopy(epiviz.datatypes.GenomicArray.prototype);
epiviz.datatypes.FeatureValueArray.constructor = epiviz.datatypes.FeatureValueArray;

/**
 * @param {epiviz.measurements.Measurement} measurement
 * @param {epiviz.datatypes.GenomicRange} boundaries
 * @param {number} globalStartIndex
 * @param {Array.<number>} values
 * @returns {epiviz.datatypes.GenomicArray}
 * @override
 */
epiviz.datatypes.FeatureValueArray.prototype.createNew = function(measurement, boundaries, globalStartIndex, values) {
  return new epiviz.datatypes.FeatureValueArray(measurement, boundaries, globalStartIndex, values);
};

/**
 * @param {number} index
 * @returns {number}
 * @override
 */
epiviz.datatypes.FeatureValueArray.prototype.get = function(index) {
  return this._values[index];
};

/**
 * @param index
 * @returns {?Object.<string, *>}
 */
epiviz.datatypes.FeatureValueArray.prototype.getAnnotation = function(index) {
  if (this._valuesAnnotation == undefined) { return null; }
  var ret = {};
  for (var col in this._valuesAnnotation) {
    if (!this._valuesAnnotation.hasOwnProperty(col)) { continue; }
    ret[col] = this._valuesAnnotation[col][index];
  }
  return ret;
};

/**
 * @returns {number}
 * @override
 */
epiviz.datatypes.FeatureValueArray.prototype.size = function() {
  return this._values ? this._values.length : 0;
};

/**
 * @param {epiviz.datatypes.FeatureValueArray} second
 * @param {number} secondIndex
 * @returns {Array.<number>|Object.<string, *>}
 */
epiviz.datatypes.FeatureValueArray.prototype.concatValues = function(second, secondIndex) {
  if (!second || !second.size()) { return this._valuesAnnotation; }
  if (!this._valuesAnnotation || !this._valuesAnnotation.values) {
    this._valuesAnnotation = {values:[]};
  }
  var ret = {};
  for (var key in this._valuesAnnotation) {
    if (!this._valuesAnnotation.hasOwnProperty(key)) { continue; }
    if (!second._valuesAnnotation.hasOwnProperty(key)) { continue; }
    ret[key] = this._valuesAnnotation[key].concat(second._valuesAnnotation[key].slice(secondIndex));
  }
  return ret;
};

/**
 * @param {epiviz.datatypes.GenomicRange} range
 * @param {number} globalStartIndex
 * @param {number} length
 * @returns {epiviz.datatypes.FeatureValueArray}
 */
epiviz.datatypes.FeatureValueArray.prototype.trim = function(range, globalStartIndex, length) {
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
  /** @type {Object.<string, Array.<*>>} */
  var values = {};
  for (var key in this._valuesAnnotation) {
    if (!this._valuesAnnotation.hasOwnProperty(key)) { continue; }
    values[key] = this._valuesAnnotation[key].slice(startIndex, endIndex);
  }
  return new epiviz.datatypes.FeatureValueArray(this.measurement(), range, startIndex + this.globalStartIndex(), values);
};

/**
 * @returns {string}
 */
epiviz.datatypes.FeatureValueArray.prototype.toString = function() {
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

// goog.inherits(epiviz.datatypes.FeatureValueArray, epiviz.datatypes.GenomicArray);