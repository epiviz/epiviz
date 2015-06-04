/**
 * Created by Florin Chelaru ( florinc [at] umd [dot] edu )
 * Date: 1/15/2015
 * Time: 2:20 PM
 */

goog.provide('epiviz.datatypes.GenomicData');

/**
 * @interface
 */
epiviz.datatypes.GenomicData = function() {};

/**
 * @param {function} callback Called when data is fully initialized and ready to be manipulated
 */
epiviz.datatypes.GenomicData.prototype.ready = function(callback) { throw Error('unimplemented abstract method'); };

/**
 * @returns {boolean}
 */
epiviz.datatypes.GenomicData.prototype.isReady = function() { throw Error('unimplemented abstract method'); };

/**
 * @returns {epiviz.datatypes.MeasurementGenomicData}
 */
epiviz.datatypes.GenomicData.prototype.firstSeries = function() { throw Error('unimplemented abstract method'); };

/**
 * @param {epiviz.measurements.Measurement} m
 * @returns {epiviz.datatypes.MeasurementGenomicData}
 */
epiviz.datatypes.GenomicData.prototype.getSeries = function(m) { throw Error('unimplemented abstract method'); };

/**
 * @param {epiviz.measurements.Measurement} m
 * @param {number} i
 * @returns {epiviz.datatypes.GenomicData.ValueItem}
 */
epiviz.datatypes.GenomicData.prototype.get = function(m, i) { throw Error('unimplemented abstract method'); };

/**
 * @param {epiviz.measurements.Measurement} m
 * @param {number} i
 * @returns {epiviz.datatypes.GenomicData.RowItem}
 */
epiviz.datatypes.GenomicData.prototype.getRow = function(m, i) { throw Error('unimplemented abstract method'); };

/**
 * @returns {Array.<epiviz.measurements.Measurement>}
 */
epiviz.datatypes.GenomicData.prototype.measurements = function() { throw Error('unimplemented abstract method'); };

/**
 * @param {epiviz.measurements.Measurement} m
 * @returns {number}
 */
epiviz.datatypes.GenomicData.prototype.globalStartIndex = function(m) { throw Error('unimplemented abstract method'); };

/**
 * @param {epiviz.measurements.Measurement} m
 * @returns {number}
 */
epiviz.datatypes.GenomicData.prototype.globalEndIndex = function(m) { throw Error('unimplemented abstract method'); };

/**
 * @param {epiviz.measurements.Measurement} m
 * @returns {number}
 */
epiviz.datatypes.GenomicData.prototype.size = function(m) { throw Error('unimplemented abstract method'); };

/**
 * @param {epiviz.measurements.Measurement} m
 * @param {number} globalIndex
 * @returns {epiviz.datatypes.GenomicData.ValueItem}
 */
epiviz.datatypes.GenomicData.prototype.getByGlobalIndex = function(m, globalIndex) { throw Error('unimplemented abstract method'); };

/**
 * @param {epiviz.measurements.Measurement} m
 * @param {number} globalIndex
 * @returns {epiviz.datatypes.GenomicData.RowItem}
 */
epiviz.datatypes.GenomicData.prototype.getRowByGlobalIndex = function(m, globalIndex) { throw Error('unimplemented abstract method'); };

/**
 * Gets the first index and length of the rows that have start positions within the given range
 * @param {epiviz.measurements.Measurement} m
 * @param {epiviz.datatypes.GenomicRange} range
 * @returns {{index: ?number, length: number}}
 */
epiviz.datatypes.GenomicData.prototype.binarySearchStarts = function(m, range) { throw Error('unimplemented abstract method'); };

/**
 * Iterates through all pairs in the map, or until the given function returns something that
 * evaluates to true.
 * @param {function(epiviz.measurements.Measurement, epiviz.datatypes.MeasurementGenomicData, number=)} callback
 */
epiviz.datatypes.GenomicData.prototype.foreach = function(callback) { throw Error('unimplemented abstract method'); };

/**
 * @param {number} globalIndex
 * @param {epiviz.datatypes.GenomicData.RowItem} rowItem
 * @param {?number} [value]
 * @param {epiviz.measurements.Measurement} measurement
 * @constructor
 * @struct
 */
epiviz.datatypes.GenomicData.ValueItem = function(globalIndex, rowItem, value, measurement) {
  /**
   * @type {number}
   */
  this.globalIndex = globalIndex;

  /**
   * @type {epiviz.datatypes.GenomicData.RowItem}
   */
  this.rowItem = rowItem;

  /**
   * @type {number}
   */
  this.value = (value === 0 || value) ? value : null;

  /**
   * @type {epiviz.measurements.Measurement}
   */
  this.measurement = measurement;
};

/**
 * @interface
 */
epiviz.datatypes.GenomicData.RowItem = function() {};

/**
 * @returns {string}
 */
epiviz.datatypes.GenomicData.RowItem.prototype.id = function() { throw Error('unimplemented abstract method'); };

/**
 * @returns {string}
 */
epiviz.datatypes.GenomicData.RowItem.prototype.seqName = function() { throw Error('unimplemented abstract method'); };

/**
 * @returns {number}
 */
epiviz.datatypes.GenomicData.RowItem.prototype.start = function() { throw Error('unimplemented abstract method'); };

/**
 * @returns {number}
 */
epiviz.datatypes.GenomicData.RowItem.prototype.end = function() { throw Error('unimplemented abstract method'); };

/**
 * @returns {number}
 */
epiviz.datatypes.GenomicData.RowItem.prototype.globalIndex = function() { throw Error('unimplemented abstract method'); };

/**
 * @returns {string}
 */
epiviz.datatypes.GenomicData.RowItem.prototype.strand = function() { throw Error('unimplemented abstract method'); };

/**
 * @param {string} column
 * @returns {*}
 */
epiviz.datatypes.GenomicData.RowItem.prototype.metadata = function(column) { throw Error('unimplemented abstract method'); };

/**
 * @returns {Object.<string, *>}
 */
epiviz.datatypes.GenomicData.RowItem.prototype.rowMetadata = function() { throw Error('unimplemented abstract method'); };
