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
 * @returns {epiviz.datatypes.GenomicRangeArray.Item}
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
 * @returns {epiviz.datatypes.GenomicRangeArray.Item}
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
 * @param {epiviz.datatypes.GenomicRangeArray.Item} rowItem
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
   * @type {epiviz.datatypes.GenomicRangeArray.Item}
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


