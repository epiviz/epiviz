/**
 * Created by Florin Chelaru ( florinc [at] umd [dot] edu )
 * Date: 11/15/2014
 * Time: 9:19 AM
 */

goog.provide('epiviz.ui.charts.VisEventArgs');

/**
 * @param {string} id The id of the visualization
 * @param {T} [args] The custom event arguments
 * @constructor
 * @struct
 * @template T
 */
epiviz.ui.charts.VisEventArgs = function(id, args) {
  /**
   * @type {string}
   */
  this.id = id;

  /**
   * @type {T}
   */
  this.args = args;
};
