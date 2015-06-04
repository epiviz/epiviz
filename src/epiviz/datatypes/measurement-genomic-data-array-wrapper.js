/**
 * Created by Florin Chelaru ( florinc [at] umd [dot] edu )
 * Date: 1/15/2015
 * Time: 3:05 PM
 */

goog.provide('epiviz.datatypes.MeasurementGenomicDataArrayWrapper');

/**
 * @param {epiviz.measurements.Measurement} measurement
 * @param {Array.<epiviz.datatypes.GenomicData.ValueItem>} items
 * @param {Object.<number, epiviz.datatypes.GenomicData.ValueItem>} itemsByGlobalIndex
 * @constructor
 * @implements {epiviz.datatypes.MeasurementGenomicData}
 */
epiviz.datatypes.MeasurementGenomicDataArrayWrapper = function(measurement, items, itemsByGlobalIndex) {
  /**
   * @type {epiviz.measurements.Measurement}
   * @private
   */
  this._measurement = measurement;

  /**
   * @type {Array.<epiviz.datatypes.GenomicData.ValueItem>}
   * @private
   */
  this._items = items;

  /**
   * @type {Object.<number, epiviz.datatypes.GenomicData.ValueItem>}
   * @private
   */
  this._itemsByGlobalIndex = itemsByGlobalIndex;
};

/**
 * @param {number} index
 * @returns {epiviz.datatypes.GenomicData.ValueItem}
 */
epiviz.datatypes.MeasurementGenomicDataArrayWrapper.prototype.get = function(index) {
  return (this._items && index >= 0 && index < this._items.length) ? this._items[index] : null;
};

/**
 * @param {number} index
 * @returns {epiviz.datatypes.GenomicData.RowItem}
 */
epiviz.datatypes.MeasurementGenomicDataArrayWrapper.prototype.getRow = function(index) {
  return (this._items && index >= 0 && index < this._items.length) ? this._items[index].rowItem : null;
};

/**
 * @returns {epiviz.measurements.Measurement}
 */
epiviz.datatypes.MeasurementGenomicDataArrayWrapper.prototype.measurement = function() {
  return this._measurement;
};

/**
 * @returns {number}
 */
epiviz.datatypes.MeasurementGenomicDataArrayWrapper.prototype.globalStartIndex = function() {
  return (this._items && this._items.length) ? this._items[0].globalIndex : null;
};

/**
 * @returns {number}
 */
epiviz.datatypes.MeasurementGenomicDataArrayWrapper.prototype.globalEndIndex = function() {
  return (this._items && this._items.length) ? this._items[this._items.length - 1].globalIndex + 1 : null;
};

/**
 * @returns {number}
 */
epiviz.datatypes.MeasurementGenomicDataArrayWrapper.prototype.size = function() {
  return (this._items) ? this._items.length : 0;
};

/**
 * @param {number} globalIndex
 * @returns {epiviz.datatypes.GenomicData.ValueItem}
 */
epiviz.datatypes.MeasurementGenomicDataArrayWrapper.prototype.getByGlobalIndex = function(globalIndex) {
  return (this._itemsByGlobalIndex && (globalIndex in this._itemsByGlobalIndex)) ? this._itemsByGlobalIndex[globalIndex] : null;
};

/**
 * @param {number} globalIndex
 * @returns {epiviz.datatypes.GenomicData.RowItem}
 */
epiviz.datatypes.MeasurementGenomicDataArrayWrapper.prototype.getRowByGlobalIndex = function(globalIndex) {
  return (this._itemsByGlobalIndex && (globalIndex in this._itemsByGlobalIndex)) ? this._itemsByGlobalIndex[globalIndex].rowItem : null;
};

/**
 * TODO: Test to check correctness
 * Gets the first index and length of the rows that have start positions within the given range
 * @param {epiviz.datatypes.GenomicRange} range
 * @returns {{index: ?number, length: number}}
 */
epiviz.datatypes.MeasurementGenomicDataArrayWrapper.prototype.binarySearchStarts = function(range) {
  if (!this._items || !this._items.length ||
      this._items[0].rowItem.start() > range.end() ||
      this._items[this._items.length - 1].rowItem.start() < range.start()) {
    return {index:null, length:0};
  }

  // Perform binary search to find the start row index

  var s = 0, e = this._items.length - 1;
  var m;

  var startIndex = null;

  while (s <= e) {
    m = Math.floor((s + e) * 0.5);
    if (this._items[m].rowItem.start() == range.start()) {
      startIndex = m;
      e = m - 1;
    } else if (this._items[m].rowItem.start() < range.start()) { s = m + 1; }
    else { e = m - 1; }
  }

  if (startIndex === null) { startIndex = s; }

  // Perform binary search to find the end row index

  s = 0;
  e = this._items.length - 1;

  var endIndex = null;

  while (s <= e) {
    m = Math.floor((s + e) * 0.5);
    if (this._items[m].rowItem.start() == range.end()) {
      endIndex = m;
      s = m + 1;
    } else if (this._items[m].rowItem.start() < range.end()) { s = m + 1; }
    else { e = m - 1; }
  }

  if (endIndex === null) { endIndex = s - 1; }

  return {
    index: startIndex,
    length: endIndex + 1 - startIndex
  };
};

