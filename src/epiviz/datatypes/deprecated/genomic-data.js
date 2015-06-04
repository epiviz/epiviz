/**
 * Created by Florin Chelaru ( florinc [at] umd [dot] edu )
 * Date: 10/23/13
 * Time: 10:59 AM
 */

goog.provide('epiviz.datatypes.deprecated.GenomicData');

/**
 * @interface
 * @deprecated
 */
epiviz.datatypes.deprecated.GenomicData = function() {

};

/**
 * @returns {string} A string of the fully qualified class name
 */
epiviz.datatypes.deprecated.GenomicData.prototype.dataType = function() {};

/**
 * @returns {epiviz.datatypes.GenomicRanges}
 */
epiviz.datatypes.deprecated.GenomicData.prototype.ranges = function() {};
