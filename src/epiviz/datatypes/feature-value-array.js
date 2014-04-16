/**
 * Created by Florin Chelaru ( florinc [at] umd [dot] edu )
 * Date: 11/8/13
 * Time: 8:31 AM
 */

goog.provide('epiviz.datatypes.FeatureValueArray');

/**
 * @param {epiviz.measurements.Measurement} measurement
 * @param {epiviz.datatypes.GenomicRange} boundaries
 * @param {number} globalStartIndex
 * @param {Array.<number>} values
 * @constructor
 * @extends {epiviz.datatypes.GenomicArray}
 */
epiviz.datatypes.FeatureValueArray = function(measurement, boundaries, globalStartIndex, values) {
  epiviz.datatypes.GenomicArray.call(this, measurement, boundaries, globalStartIndex, values);
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
 * @returns {number}
 * @override
 */
epiviz.datatypes.FeatureValueArray.prototype.size = function() {
  return this._values ? this._values.length : 0;
};

/**
 * @param {epiviz.datatypes.FeatureValueArray} second
 * @param {number} secondIndex
 * @returns {Array.<number>}
 */
epiviz.datatypes.FeatureValueArray.prototype.concatValues = function(second, secondIndex) {
  if (!second || !second.size()) { return this._values; }
  if (!this._values) { this._values = []; }
  return this._values.concat(second._values.slice(secondIndex));
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
  var values = this._values.slice(startIndex, endIndex);
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
