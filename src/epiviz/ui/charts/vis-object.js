/**
 * Created by Florin Chelaru ( florinc [at] umd [dot] edu )
 * Date: 11/15/2014
 * Time: 11:03 AM
 */

goog.provide('epiviz.ui.charts.VisObject');

/**
 * @interface
 */
epiviz.ui.charts.VisObject = function() {};

/**
 * @param {epiviz.ui.charts.VisObject} other
 * @returns {boolean}
 */
epiviz.ui.charts.VisObject.prototype.overlapsWith = function(other) { return false; };
