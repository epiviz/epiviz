/**
 * Created by Florin Chelaru ( florinc [at] umd [dot] edu )
 * Date: 11/8/13
 * Time: 12:45 PM
 */

goog.provide('epiviz.datatypes.MeasurementGenomicDataWrapper');

/**
 * @param {epiviz.measurements.Measurement} measurement
 * @param {epiviz.datatypes.PartialSummarizedExperiment} container
 * @constructor
 * @implements {epiviz.datatypes.MeasurementGenomicData}
 */
epiviz.datatypes.MeasurementGenomicDataWrapper = function(measurement, container) {
  /**
   * @type {epiviz.measurements.Measurement}
   * @private
   */
  this._measurement = measurement;

  /**
   * @type {epiviz.datatypes.PartialSummarizedExperiment}
   * @private
   */
  this._container = container;

  /**
   * @type {?number}
   * @private
   */
  this._size = null;

  /**
   * @type {?number}
   * @private
   */
  this._globalStartIndex = null;
};

/**
 * @param {number} index
 * @returns {epiviz.datatypes.GenomicData.ValueItem}
 */
epiviz.datatypes.MeasurementGenomicDataWrapper.prototype.get = function(index) {
  var rows = this._container.rowData();
  var values = null;
  var firstGlobalIndex = this.globalStartIndex();

  var item = null;
  var value = null;
  var globalIndex = null;

  var size = this.size();
  if (!size || index >= size || index < 0) {
    return new epiviz.datatypes.GenomicData.ValueItem(globalIndex, item, value, this._measurement);
  }

  if (firstGlobalIndex != undefined) {
    if (this._measurement.type() == epiviz.measurements.Measurement.Type.FEATURE ||
      this._measurement.type() == epiviz.measurements.Measurement.Type.UNORDERED) {
      values = this._container.values(this._measurement);
      var valueIndex = firstGlobalIndex - values.globalStartIndex() + index;
      value = values.get(valueIndex);
    }

    var rowIndex = firstGlobalIndex - rows.globalStartIndex() + index;
    item = rows.get(rowIndex);

    globalIndex = firstGlobalIndex + index;
  }

  return new epiviz.datatypes.GenomicData.ValueItem(globalIndex, item, value, this._measurement);
};

/**
 * @param {number} index
 * @returns {epiviz.datatypes.GenomicData.RowItem}
 */
epiviz.datatypes.MeasurementGenomicDataWrapper.prototype.getRow = function(index) {
  var rows = this._container.rowData();
  var firstGlobalIndex = this.globalStartIndex();

  var item = null;

  var size = this.size();
  if (!size || index >= size || index < 0) {
    return item;
  }

  if (firstGlobalIndex != undefined) {
    var rowIndex = firstGlobalIndex - rows.globalStartIndex() + index;
    item = rows.get(rowIndex);
  }

  return item;
};

/**
 * @returns {epiviz.measurements.Measurement}
 */
epiviz.datatypes.MeasurementGenomicDataWrapper.prototype.measurement = function() {
  return this._measurement;
};

/**
 * @returns {number}
 */
epiviz.datatypes.MeasurementGenomicDataWrapper.prototype.globalStartIndex = function() {
  if (this._globalStartIndex !== null) { return this._globalStartIndex; }

  /**
   * @type {?epiviz.datatypes.GenomicRangeArray}
   */
  var rows = this._container.rowData();
  var values = null;
  var firstGlobalIndex = rows.globalStartIndex();

  if (firstGlobalIndex === null) { return firstGlobalIndex; }

  if (this._measurement.type() == epiviz.measurements.Measurement.Type.FEATURE ||
    this._measurement.type() == epiviz.measurements.Measurement.Type.UNORDERED) {
    values = this._container.values(this._measurement);
    if (!values.globalStartIndex()) { return values.globalStartIndex(); }
    firstGlobalIndex = Math.max(firstGlobalIndex, values.globalStartIndex());
  }

  this._globalStartIndex = firstGlobalIndex;
  return this._globalStartIndex;
};

/**
 * @returns {number}
 */
epiviz.datatypes.MeasurementGenomicDataWrapper.prototype.globalEndIndex = function() {
  var startIndex = this.globalStartIndex();
  if (startIndex == null) { return null; }
  return startIndex + this.size();
};

/**
 * @returns {number}
 */
epiviz.datatypes.MeasurementGenomicDataWrapper.prototype.size = function() {
  if (this._size !== null) { return this._size; }

  var firstGlobalIndex = this.globalStartIndex();
  if (firstGlobalIndex == undefined) { return 0; }

  var rows = this._container.rowData();
  var values = this._container.values(this._measurement);

  var result = rows.size() - firstGlobalIndex + rows.globalStartIndex();

  if (this._measurement.type() == epiviz.measurements.Measurement.Type.FEATURE ||
    this._measurement.type() == epiviz.measurements.Measurement.Type.UNORDERED) {
    result = Math.min(result, values.size() - firstGlobalIndex + values.globalStartIndex());
  }

  this._size = Math.max(0, result);

  return this._size;
};

/**
 * @param {number} globalIndex
 * @returns {epiviz.datatypes.GenomicData.ValueItem}
 */
epiviz.datatypes.MeasurementGenomicDataWrapper.prototype.getByGlobalIndex = function(globalIndex) {
  var firstGlobalIndex = this.globalStartIndex();
  if (firstGlobalIndex == undefined) { return new epiviz.datatypes.GenomicData.ValueItem(null, null, null, this._measurement); }

  return this.get(globalIndex - firstGlobalIndex);
};

/**
 * @param {number} globalIndex
 * @returns {epiviz.datatypes.GenomicData.RowItem}
 */
epiviz.datatypes.MeasurementGenomicDataWrapper.prototype.getRowByGlobalIndex = function(globalIndex) {
  var firstGlobalIndex = this.globalStartIndex();
  if (firstGlobalIndex == undefined) { return null; }

  return this.getRow(globalIndex - firstGlobalIndex);
};

/**
 * Gets the first index and length of the rows that have start positions within the given range
 * @param {epiviz.datatypes.GenomicRange} range
 * @returns {{index: ?number, length: number}}
 */
epiviz.datatypes.MeasurementGenomicDataWrapper.prototype.binarySearchStarts = function(range) {

  /** @type {?epiviz.datatypes.GenomicRangeArray} */
  var rows = this._container.rowData();

  if (this.size() == 0 || !rows || rows.size() == 0 || rows.start(0) >= range.end() || rows.start(rows.size() - 1) <= range.start()) { return {index: null, length: 0}; }

  // Perform binary search to find the start row index

  var s = 0, e = rows.size() - 1;
  var m;

  var startIndex = null;

  while (s <= e) {
    m = Math.floor((s + e) * 0.5);
    if (rows.start(m) == range.start()) {
      startIndex = m;
      e = m - 1;
    } else if (rows.start(m) < range.start()) { s = m + 1; }
    else { e = m - 1; }
  }

  if (startIndex === null) { startIndex = s; }

  // Perform binary search to find the end row index

  s = 0;
  e = rows.size() - 1;

  var endIndex = null;

  while (s <= e) {
    m = Math.floor((s + e) * 0.5);
    if (rows.start(m) == range.end()) {
      endIndex = m;
      s = m + 1;
    } else if (rows.start(m) < range.end()) { s = m + 1; }
    else { e = m - 1; }
  }

  if (endIndex === null) { endIndex = s - 1; }

  var globalStartIndex = Math.max(startIndex + rows.globalStartIndex(), this.globalStartIndex());
  var globalEndIndex = Math.min(endIndex + rows.globalStartIndex(), this.globalStartIndex() + this.size() - 1);

  return {
    index: globalStartIndex - this.globalStartIndex(),
    length: globalEndIndex - globalStartIndex + 1
  };
};
