/**
 * Created by Florin Chelaru ( florinc [at] umd [dot] edu )
 * Date: 3/4/14
 * Time: 10:45 AM
 */

goog.provide('epiviz.events.EventResult');

/**
 * @constructor
 * @struct
 * @template T
 */
epiviz.events.EventResult = function() {
  /**
   * @type {?boolean}
   */
  this.success = null;

  /**
   * @type {?string}
   */
  this.errorMessage = null;

  /**
   * @type {?T}
   */
  this.value = null;
};
