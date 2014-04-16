/**
 * Created by Florin Chelaru ( florinc [at] umd [dot] edu )
 * Date: 10/23/13
 * Time: 10:59 AM
 */

goog.provide('epiviz.datatypes.GenomicData');

/**
 * @interface
 */
epiviz.datatypes.GenomicData = function() {

};

/**
 * @returns {string} A string of the fully qualified class name
 */
epiviz.datatypes.GenomicData.prototype.dataType = function() {};

/**
 * @returns {epiviz.datatypes.GenomicRanges}
 */
epiviz.datatypes.GenomicData.prototype.ranges = function() {};
