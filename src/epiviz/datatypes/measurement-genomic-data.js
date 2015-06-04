/**
 * Created by Florin Chelaru ( florinc [at] umd [dot] edu )
 * Date: 1/15/2015
 * Time: 1:32 PM
 */

goog.provide('epiviz.datatypes.MeasurementGenomicData');

/**
 * @interface
 */
epiviz.datatypes.MeasurementGenomicData = function() {};

/**
 * @param {number} index
 * @returns {epiviz.datatypes.GenomicData.ValueItem}
 */
epiviz.datatypes.MeasurementGenomicData.prototype.get = function(index) { throw Error('unimplemented abstract method'); };

/**
 * @param {number} index
 * @returns {epiviz.datatypes.GenomicData.RowItem}
 */
epiviz.datatypes.MeasurementGenomicData.prototype.getRow = function(index) { throw Error('unimplemented abstract method'); };

/**
 * @returns {epiviz.measurements.Measurement}
 */
epiviz.datatypes.MeasurementGenomicData.prototype.measurement = function() { throw Error('unimplemented abstract method'); };

/**
 * @returns {number}
 */
epiviz.datatypes.MeasurementGenomicData.prototype.globalStartIndex = function() { throw Error('unimplemented abstract method'); };

/**
 * @returns {number}
 */
epiviz.datatypes.MeasurementGenomicData.prototype.globalEndIndex = function() { throw Error('unimplemented abstract method'); };


/**
 * @returns {number}
 */
epiviz.datatypes.MeasurementGenomicData.prototype.size = function() { throw Error('unimplemented abstract method'); };

/**
 * @param {number} globalIndex
 * @returns {epiviz.datatypes.GenomicData.ValueItem}
 */
epiviz.datatypes.MeasurementGenomicData.prototype.getByGlobalIndex = function(globalIndex) { throw Error('unimplemented abstract method'); };

/**
 * @param {number} globalIndex
 * @returns {epiviz.datatypes.GenomicData.RowItem}
 */
epiviz.datatypes.MeasurementGenomicData.prototype.getRowByGlobalIndex = function(globalIndex) { throw Error('unimplemented abstract method'); };

/**
 * Gets the first index and length of the rows that have start positions within the given range
 * @param {epiviz.datatypes.GenomicRange} range
 * @returns {{index: ?number, length: number}}
 */
epiviz.datatypes.MeasurementGenomicData.prototype.binarySearchStarts = function(range) { throw Error('unimplemented abstract method'); };
