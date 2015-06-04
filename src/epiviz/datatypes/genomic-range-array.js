/**
 * Created by Florin Chelaru ( florinc [at] umd [dot] edu )
 * Date: 11/1/13
 * Time: 10:26 AM
 */

goog.provide('epiviz.datatypes.GenomicRangeArray');

/**
 * @param {epiviz.measurements.Measurement} measurement
 * @param {epiviz.datatypes.GenomicRange} boundaries
 * @param {number} globalStartIndex
 * @param {{id: Array.<string>, start: Array.<number>, end: Array.<number>, strand: Array.<string>|string, metadata: Object.<string, Array>}} values
 * @param {boolean} [useOffset] True if the values are compressed and false/undefined/null otherwise
 * @constructor
 * @implements {epiviz.utils.Iterable}
 * @extends {epiviz.datatypes.GenomicArray}
 */
epiviz.datatypes.GenomicRangeArray = function(measurement, boundaries, globalStartIndex, values, useOffset) {

  epiviz.datatypes.GenomicArray.call(this, measurement, boundaries, globalStartIndex, values);

  /**
   * @type {Array.<string>}
   * @private
   */
  this._id = values.id;

  /**
   * @type {Array.<number>}
   * @private
   */
  this._start = values.start;

  /**
   * @type {Array.<number>}
   * @private
   */
  this._end = values.end;

  /**
   * @type {Array.<string>|string}
   * @private
   */
  this._strand = values.strand || null;

  /**
   * @type {Object.<string, Array>}
   * @private
   */
  this._metadata = values.metadata;

  /**
   * @type {?number}
   * @private
   */
  this._size = null;

  // If useOffset is true, it means that the values in the start/end arrays are compressed, and each value
  // in the array (with the exception of the first) is the offset between the real value and the previous one.
  // If the values are compressed, here we decompress them:
  if (useOffset) {
    var i;
    for (i = 1; i < this._start.length; ++i) {
      this._start[i] += this._start[i - 1];

      if (this._end) { this._end[i] += this._end[i - 1]; }
    }
  }
};

/**
 * Copy methods from upper class
 */
epiviz.datatypes.GenomicRangeArray.prototype = epiviz.utils.mapCopy(epiviz.datatypes.GenomicArray.prototype);
epiviz.datatypes.GenomicRangeArray.constructor = epiviz.datatypes.GenomicRangeArray;

/**
 * @param {epiviz.measurements.Measurement} measurement
 * @param {epiviz.datatypes.GenomicRange} boundaries
 * @param {number} globalStartIndex
 * @param {{id: Array.<string>, start: Array.<number>, end: Array.<number>, strand: Array.<string>|string, metadata: Object.<string, Array>}} values
 * @returns {epiviz.datatypes.GenomicArray}
 * @override
 */
epiviz.datatypes.GenomicRangeArray.prototype.createNew = function(measurement, boundaries, globalStartIndex, values) {
  return new epiviz.datatypes.GenomicRangeArray(measurement, boundaries, globalStartIndex, values);
};

/**
 * @param {number} i a numeric index of the row
 * @returns {epiviz.datatypes.GenomicData.RowItem}
 * @override
 */
epiviz.datatypes.GenomicRangeArray.prototype.get = function(i) {
  if (i < 0 || i >= this.size()) { return null; }

  return new epiviz.datatypes.GenomicRangeArray.RowItemWrapper(this, i);
};

/**
 * @returns {number} the total number of items in the structure
 * @override
 */
epiviz.datatypes.GenomicRangeArray.prototype.size = function() {
  if (this._size == undefined) {
    var size = Math.max(
      this._id ? this._id.length : 0,
      this._start ? this._start.length : 0,
      this._end ? this._end.length : 0,
      (this._metadata && Object.keys(this._metadata).length) ?
        Math.max.apply(undefined, $.map(this._metadata, function(col) { return col.length; })) : 0);
    this._size = size;
  }
  return this._size;
};

/**
 * @param {epiviz.datatypes.GenomicRangeArray} second
 * @param {number} secondIndex
 * @returns {{id: Array.<string>, start: Array.<number>, end: Array.<number>, strand: Array.<string>|string, metadata: Object.<string, Array>}}
 */
epiviz.datatypes.GenomicRangeArray.prototype.concatValues = function(second, secondIndex) {
  var strand = null;
  if (!Array.isArray(this._strand) && !Array.isArray(second._strand) && this._strand == second._strand) {
    strand = this._strand;
  } else {
    var
      firstStrand = Array.isArray(this._strand) ? this._strand : epiviz.utils.fillArray(this.size(), this._strand),
      secondStrand = Array.isArray(second._strand) ? second._strand : epiviz.utils.fillArray(second.size(), second._strand);
    strand = firstStrand.concat(secondStrand.slice(secondIndex))
  }

  var
    id = this._id ? this._id.concat(second._id.slice(secondIndex)) : null,
    start = this._start.concat(second._start.slice(secondIndex)),
    end = this._end ? this._end.concat(second._end.slice(secondIndex)) : null;

  // Concatenate metadata values. We assume that both structures have the same columns
  var metadata = {};
  for (var col in this._metadata) {
    if (!this._metadata.hasOwnProperty(col)) { continue; }
    metadata[col] = this._metadata[col].concat(second._metadata[col].slice(secondIndex));
  }

  return {
    id: id,
    start: start,
    end: end,
    strand: strand,
    metadata: metadata
  };
};

/**
 * @param {epiviz.datatypes.GenomicRange} range
 * @returns {?epiviz.datatypes.GenomicRangeArray}
 */
epiviz.datatypes.GenomicRangeArray.prototype.trim = function(range) {
  if (this.globalStartIndex() == undefined || !this.size() || !range || !this.boundaries() || this.boundaries().seqName() != range.seqName()) {
    return null;
  }

  var start = Math.max(this.boundaries().start(), range.start());
  var end = Math.min(this.boundaries().end(), range.end());
  if (end <= start) { return null; }
  range = epiviz.datatypes.GenomicRange.fromStartEnd(range.seqName(), start, end);

  var startIndex = -1;
  var endIndex = -1;
  for (var i = 0; i < this.size(); ++i) {
    if (startIndex < 0 && this.end(i) >= range.start()) { startIndex = i; }
    if (this._start[i] < range.end()) { endIndex = i + 1; }
  }
  if (endIndex <= startIndex) { return null; }

  var values, globalStartIndex;
  var col;

  if (startIndex >= 0 && endIndex >= startIndex) {
    values = {
      id: this._id ? this._id.slice(startIndex, endIndex) : null,
      start: this._start.slice(startIndex, endIndex),
      end: this._end ? this._end.slice(startIndex, endIndex) : null,
      strand: Array.isArray(this._strand) ? this._strand.slice(startIndex, endIndex) : this._strand,
      metadata: {}
    };
    for (col in this._metadata) {
      if (!this._metadata.hasOwnProperty(col)) { continue; }
      values.metadata[col] = this._metadata[col].slice(startIndex, endIndex);
    }
    globalStartIndex = this.globalStartIndex() + startIndex;
  } else {
    values = {
      id: this._id ? [] : null,
      start: [],
      end: this._end ? [] : null,
      strand: Array.isArray(this._strand) ? [] : this._strand,
      metadata: {}
    };
    for (col in this._metadata) {
      if (!this._metadata.hasOwnProperty(col)) { continue; }
      values.metadata[col] = [];
    }
    globalStartIndex = null;
  }

  return new epiviz.datatypes.GenomicRangeArray(this.measurement(), range, globalStartIndex, values);
};

/**
 * @returns {epiviz.datatypes.GenomicRangeArray}
 */
epiviz.datatypes.GenomicRangeArray.prototype.ranges = function() { return this; };

/**
 * Iterates through all genomic ranges until func returns something that evaluates to true
 * @param {function(epiviz.datatypes.GenomicData.RowItem)} func
 */
epiviz.datatypes.GenomicRangeArray.prototype.foreach = function(func) {
  var size = this.size();
  for (var i = 0; i < size; ++i) {
    if (func(this.get(i))) { return; }
  }
};

/**
 * @returns {Array.<string>} the names of the metadata columns associated with the epiviz.datatypes.GenomicRangeArray instance
 */
epiviz.datatypes.GenomicRangeArray.prototype.metadataColumns = function() {
  if (this._metadata) {
    return Object.keys(this._metadata);
  }

  return [];
};

/**
 * @param {number} index
 * @returns {string}
 */
epiviz.datatypes.GenomicRangeArray.prototype.id = function(index) {
  return this._id ? this._id[index] : this.globalStartIndex() + index;
};

/**
 * @param {number} index
 * @returns {number}
 */
epiviz.datatypes.GenomicRangeArray.prototype.start = function(index) {
  return this._start ? this._start[index] : undefined;
};

/**
 * @param {number} index
 * @returns {number}
 */
epiviz.datatypes.GenomicRangeArray.prototype.end = function(index) {
  return this._end ? this._end[index] : this.start(index);
};

/**
 * @param {number} index
 * @returns {string}
 */
epiviz.datatypes.GenomicRangeArray.prototype.strand = function(index) {
  return Array.isArray(this._strand) ? this._strand[index] : this._strand;
};

/**
 * @param {string} column
 * @param {number} index
 * @returns {*}
 */
epiviz.datatypes.GenomicRangeArray.prototype.metadata = function(column, index) {
  if (!this._metadata || !this._metadata[column]) { return null; }
  return this._metadata[column][index];
};

/**
 * @param {number} index
 * @returns {Object.<string, *>}
 */
epiviz.datatypes.GenomicRangeArray.prototype.rowMetadata = function(index) {
  var result = {};
  for (var column in this._metadata) {
    if (!this._metadata.hasOwnProperty(column)) { continue; }
    result[column] = this._metadata[column][index];
  }

  return result;
};

/**
 * @returns {string}
 */
epiviz.datatypes.GenomicRangeArray.prototype.toString = function() {
  var c, s, e;
  if (this.boundaries()) {
    c = this.boundaries().seqName();
    s = this.boundaries().start();
    e = this.boundaries().end();
  } else {
    c = s = e = '*';
  }
  var header = sprintf('%25s', this.measurement().name().substr(0, 22)) + sprintf(' [%6s%10s%10s]', c, s, e);
  var id = sprintf('%10s:', 'id');
  var idx = sprintf('%10s:', 'idx');
  var chr = sprintf('%10s:', 'chr');
  var start = sprintf('%10s:', 'start');
  var end = sprintf('%10s:', 'end');

  if (this.globalStartIndex() != undefined) {
    for (var globalIndex = this.globalStartIndex(); globalIndex < this.globalStartIndex() + this.size(); ++globalIndex) {
      /** @type {epiviz.datatypes.GenomicData.RowItem} */
      var row = this.getByGlobalIndex(globalIndex);
      id += sprintf('%10s', row.id());
      idx += sprintf('%10s', globalIndex);
      chr += sprintf('%10s', row.seqName());
      start += sprintf('%10s', row.start());
      end += sprintf('%10s', row.end());
    }
  }

  return [header, id, idx, chr, start, end].join('\n');
};

goog.provide('epiviz.datatypes.GenomicRangeArray.RowItemWrapper');

/**
 * @param {epiviz.datatypes.GenomicRangeArray} parent
 * @param {number} index
 *
 * @constructor
 * @implements {epiviz.datatypes.GenomicData.RowItem}
 */
epiviz.datatypes.GenomicRangeArray.RowItemWrapper = function(parent, index) {
  /**
   * @type {number}
   * @private
   */
  this._index = index;

  /**
   * @type {epiviz.datatypes.GenomicRangeArray}
   * @private
   */
  this._parent = parent;
};

/**
 * @returns {epiviz.datatypes.GenomicRangeArray}
 */
epiviz.datatypes.GenomicRangeArray.RowItemWrapper.prototype.parent = function() {
  return this._parent;
};

/**
 * @returns {string}
 */
epiviz.datatypes.GenomicRangeArray.RowItemWrapper.prototype.id = function() {
  return this._parent.id(this._index);
};

/**
 * @returns {string}
 */
epiviz.datatypes.GenomicRangeArray.RowItemWrapper.prototype.seqName = function() {
  return this._parent.boundaries() ? this._parent.boundaries().seqName() : undefined;
};

/**
 * @returns {number}
 */
epiviz.datatypes.GenomicRangeArray.RowItemWrapper.prototype.start = function() {
  return this._parent.start(this._index);
};

/**
 * @returns {number}
 */
epiviz.datatypes.GenomicRangeArray.RowItemWrapper.prototype.end = function() {
  return this._parent.end(this._index);
};

/**
 * @returns {number}
 */
epiviz.datatypes.GenomicRangeArray.RowItemWrapper.prototype.index = function() {
  return this._index;
};

/**
 * @returns {number}
 */
epiviz.datatypes.GenomicRangeArray.RowItemWrapper.prototype.globalIndex = function() {
  return this._index + this._parent.globalStartIndex();
};

/**
 * @param {epiviz.datatypes.GenomicData.RowItem} other
 * @returns {boolean}
 */
epiviz.datatypes.GenomicRangeArray.RowItemWrapper.prototype.equals = function(other) {
  if (!other) { return false; }
  if (this == other) { return true; }

  return (other.seqName() == this.seqName() &&
    other.start() == this.start() &&
    other.end() == this.end());
};

/**
 * @returns {string}
 */
epiviz.datatypes.GenomicRangeArray.RowItemWrapper.prototype.strand = function() {
  return this._parent.strand(this._index);
};

/**
 * @param {string} column
 * @returns {*}
 */
epiviz.datatypes.GenomicRangeArray.RowItemWrapper.prototype.metadata = function(column) {
  return this._parent.metadata(column, this._index);
};

/**
 * @returns {Object.<string, *>}
 */
epiviz.datatypes.GenomicRangeArray.RowItemWrapper.prototype.rowMetadata = function() {
  return this._parent.rowMetadata(this._index);
};

/**
 * @param {epiviz.datatypes.GenomicData.RowItem} other
 * @returns {boolean}
 */
epiviz.datatypes.GenomicRangeArray.RowItemWrapper.prototype.overlapsWith = function(other) {
  if (!other) { return false; }
  if (this == other) { return true; }
  if (this.seqName() != other.seqName()) { return false; }
  return (this.start() < other.end() && this.end() > other.start());
};
